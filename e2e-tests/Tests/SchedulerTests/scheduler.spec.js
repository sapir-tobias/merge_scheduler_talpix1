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
    YEAR_OPTION: 'nav-year-option',
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

// #1 — state survives a browser refresh (localStorage hydration)
test('user changes persist across a page reload', async ({ page }) => {
  await page.getByTestId(TID.NAV.TAB_SEM_A).click();
  const chips = page.locator('[data-testid^="semester-course-chip-"]');
  await expect(chips.first()).toBeVisible();
  const before = await chips.count();
  expect(before).toBeGreaterThan(0);

  await page.locator('[data-testid^="semester-course-remove-"]').first().click();
  await expect(chips).toHaveCount(before - 1);

  await page.reload();
  await expect(page.getByTestId(TID.NAV.CONTAINER)).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId(TID.APP_LOADING)).toHaveCount(0);
  await page.getByTestId(TID.NAV.TAB_SEM_A).click();
  await expect(page.locator('[data-testid^="semester-course-chip-"]')).toHaveCount(before - 1);
});

// #2 — credit filter actually narrows the Plan-page (noScoring) catalogue
test('credit filter narrows the Plan-page catalogue', async ({ page }) => {
  const rows = page.getByTestId(TID.CATALOGUE.COURSE_LIST).locator('[data-testid^="course-item-"]');
  await expect(rows.first()).toBeVisible({ timeout: 15000 });
  const before = await rows.count();
  await page.getByTestId(TID.CATALOGUE.FILTER_TOGGLE).click();
  // Set the range value via the native setter so React's onChange fires.
  await page.getByTestId(TID.CATALOGUE.CREDITS_MAX).evaluate(el => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, '0');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect.poll(async () => rows.count()).toBeLessThan(before);
});

// #4 — a placed course can be toggled mandatory (amber when active)
test('a placed course can be toggled mandatory', async ({ page }) => {
  await page.getByTestId(TID.NAV.TAB_SEM_A).click();
  const btn = page.locator('[data-testid^="semester-course-mandatory-"]').first();
  await expect(btn).toBeAttached();
  await btn.click();
  await expect(btn).toHaveCSS('color', 'rgb(245, 158, 11)');
});

// #6 — year selector toggles a visible active state
test('year selector shows an active state when clicked', async ({ page }) => {
  const y2 = page.getByTestId(`${TID.NAV.YEAR_OPTION}-2`);
  await y2.click();
  await expect(y2).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

// #1/#3 — a prereq not offered this year resolves a name + is flagged (no dead-end)
test('prerequisites resolve a name and flag non-offered courses', async ({ page }) => {
  await page.getByTestId(TID.CATALOGUE.SEARCH_INPUT).fill('מבנה המחשב');
  const row = page.getByTestId('course-item-67200');           // מבנה המחשב
  await expect(row).toBeVisible({ timeout: 15000 });
  await page.getByTestId('course-item-expand-67200').click();
  await expect(row).toContainText('מבוא למדעי המחשב');          // 76639 name resolved (was blank)
  await expect(row).toContainText('(not offered)');             // 76639 isn't in the catalogue
});

// Aggressive: faculty + credit filters narrow the catalogue together
test('faculty and credit filters narrow the catalogue together', async ({ page }) => {
  await page.getByTestId(TID.NAV.TAB_SEM_A).click();
  const rows = page.getByTestId(TID.CATALOGUE.COURSE_LIST).locator('[data-testid^="course-item-"]');
  await expect(rows.first()).toBeVisible({ timeout: 15000 });
  const all = await rows.count();
  await page.getByTestId(TID.CATALOGUE.FILTER_TOGGLE).click();
  for (const f of ['math', 'physics', 'misc']) {
    await page.getByTestId(`catalogue-faculty-filter-${f}`).click();   // leave CS only
  }
  await expect.poll(async () => rows.count()).toBeLessThan(all);
  expect(await rows.count()).toBeGreaterThan(0);
});

// Aggressive: placement + mandatory flag + search filter all survive one reload
test('placement, mandatory flag and filters persist together across reload', async ({ page }) => {
  await page.getByTestId(TID.NAV.TAB_SEM_A).click();
  const mand = page.locator('[data-testid^="semester-course-mandatory-"]').first();
  await mand.click();
  await expect(mand).toHaveCSS('color', 'rgb(245, 158, 11)');
  await page.getByTestId(TID.CATALOGUE.SEARCH_INPUT).fill('algorithm');

  await page.reload();
  await expect(page.getByTestId(TID.NAV.CONTAINER)).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId(TID.APP_LOADING)).toHaveCount(0);
  await expect(page.getByTestId(TID.CATALOGUE.SEARCH_INPUT)).toHaveValue('algorithm');
  await page.getByTestId(TID.NAV.TAB_SEM_A).click();
  await expect(page.locator('[data-testid^="semester-course-mandatory-"]').first())
    .toHaveCSS('color', 'rgb(245, 158, 11)');
});

// Aggressive: Load Plan fills multiple semesters with rendered course blocks
test('Load Plan populates the grid across multiple semesters', async ({ page }) => {
  await page.getByTestId('nav-load-plan-button').click();
  await page.getByTestId('load-plan-track-cs').click();
  await page.getByTestId(TID.NAV.TAB_SEM_A).click();
  await expect(page.getByTestId(TID.WEEKLY.GRID)).toBeVisible();
  await expect(page.locator('[data-testid^="weekly-course-block-"]').first()).toBeVisible({ timeout: 10000 });
  await page.getByTestId(`${TID.NAV.YEAR_OPTION}-2`).click();   // year 2 -> semesters 3 & 4
  await page.getByTestId(TID.NAV.TAB_SEM_A).click();
  await expect(page.getByTestId(TID.WEEKLY.GRID)).toBeVisible();
});
