// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Scheduler end-to-end flow.
 *
 * Mirrors the Talpix validation style: drive the real page through its
 * data-testid selectors and assert the live (FastAPI -> repository ->
 * serializer) data actually renders. Selector strings mirror
 * frontend/src/testIds.ts (kept inline so this .js spec runs standalone).
 */
const TID = {
  APP_LOADING: 'app-loading',
  NAV: {
    CONTAINER: 'scheduler-nav',
    TAB_PLAN: 'nav-tab-plan',
    TAB_SEM_A: 'nav-tab-sem-a',
    EXPORT_BUTTON: 'nav-export-button',
    IMPORT_INPUT: 'nav-import-input',
  },
  CATALOGUE: {
    CONTAINER: 'catalogue-container',
    SEARCH_INPUT: 'catalogue-search-input',
    COURSE_LIST: 'catalogue-course-list',
    FILTER_TOGGLE: 'catalogue-filter-toggle',
    CREDITS_MAX: 'catalogue-credits-max',
  },
  COURSE_ITEM: { ROW: 'course-item', EXPAND: 'course-item-expand' },
  WEEKLY: { GRID: 'weekly-grid' },
  MONTH_CALENDAR: { CONTAINER: 'month-calendar' },
  SEMESTER_COURSE_LIST: { BAR: 'semester-course-list' },
  DEGREE_PLAN: { CONTAINER: 'degree-plan-container' },
};

test.beforeEach(async ({ page }) => {
  await page.goto('/scheduler/planner');
  // App boots through a loading gate that fetches the catalogue from the API.
  await expect(page.getByTestId(TID.NAV.CONTAINER)).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId(TID.APP_LOADING)).toHaveCount(0);
});

test('semester view renders the weekly grid, calendar and catalogue', async ({ page }) => {
  // The app boots on the Degree Plan tab; the weekly grid lives on a semester view.
  await page.getByTestId(TID.NAV.TAB_SEM_A).click();
  await expect(page.getByTestId(TID.WEEKLY.GRID)).toBeVisible();
  await expect(page.getByTestId(TID.MONTH_CALENDAR.CONTAINER)).toBeVisible();
  await expect(page.getByTestId(TID.CATALOGUE.CONTAINER)).toBeVisible();
  await expect(page.getByTestId(TID.SEMESTER_COURSE_LIST.BAR)).toBeVisible();
});

test('catalogue loads real courses from the backend', async ({ page }) => {
  const rows = page
    .getByTestId(TID.CATALOGUE.COURSE_LIST)
    .locator(`[data-testid^="${TID.COURSE_ITEM.ROW}-"]`);
  await expect(rows.first()).toBeVisible({ timeout: 15000 });
  expect(await rows.count()).toBeGreaterThan(0);
});

test('catalogue search filters the list', async ({ page }) => {
  const search = page.getByTestId(TID.CATALOGUE.SEARCH_INPUT);
  await expect(search).toBeVisible();
  const list = page.getByTestId(TID.CATALOGUE.COURSE_LIST);
  const rows = list.locator(`[data-testid^="${TID.COURSE_ITEM.ROW}-"]`);
  const before = await rows.count();
  await search.fill('zzzzzznomatch');
  await expect(rows).toHaveCount(0);
  await search.fill('');
  await expect.poll(async () => rows.count()).toBeGreaterThan(0);
  expect(before).toBeGreaterThan(0);
});

test('switching to the Plan tab renders the degree-plan board', async ({ page }) => {
  await page.getByTestId(TID.NAV.TAB_PLAN).click();
  await expect(page.getByTestId(TID.DEGREE_PLAN.CONTAINER)).toBeVisible();
});

test('credit filter reaches the real high-credit range (not clamped to 6)', async ({ page }) => {
  await page.getByTestId(TID.NAV.TAB_SEM_A).click();
  await page.getByTestId(TID.CATALOGUE.FILTER_TOGGLE).click();
  const max = await page.getByTestId(TID.CATALOGUE.CREDITS_MAX).getAttribute('max');
  // dataset has courses up to 20 cr; the slider must reach past the old cap of 6.
  expect(Number(max)).toBeGreaterThanOrEqual(7);
});

test('no-exam courses never render "Invalid Date"', async ({ page }) => {
  // Most real courses have no final; the semester chips + course detail must
  // show "No exam" rather than an invalid-date string.
  await page.getByTestId(TID.NAV.TAB_SEM_A).click();
  await expect(page.getByTestId(TID.SEMESTER_COURSE_LIST.BAR)).toBeVisible();
  await expect(page.getByText('Invalid Date')).toHaveCount(0);
});

test('export downloads the plan as JSON', async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId(TID.NAV.EXPORT_BUTTON).click(),
  ]);
  expect(download.suggestedFilename()).toContain('degree-plan');
  await expect(page.getByTestId(TID.NAV.IMPORT_INPUT)).toHaveCount(1);
});
