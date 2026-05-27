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
  NAV: { CONTAINER: 'scheduler-nav', TAB_PLAN: 'nav-tab-plan', TAB_SEM_A: 'nav-tab-sem-a' },
  CATALOGUE: {
    CONTAINER: 'catalogue-container',
    SEARCH_INPUT: 'catalogue-search-input',
    COURSE_LIST: 'catalogue-course-list',
  },
  COURSE_ITEM: { ROW: 'course-item' },
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
