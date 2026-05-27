/**
 * Centralized data-testid constants.
 * Shared between React components and Playwright tests.
 *
 * Convention:
 *   - Group by page / feature.
 *   - Keep IDs kebab-case and descriptive.
 *   - Import in components:  import { TEST_IDS } from '../testIds';
 *   - Import in tests:       import { TEST_IDS } from '../src/testIds';
 */

export const TEST_IDS = {
  // ── Shared across pages ───────────────────────────────
  PAGE_HEADER: 'page-header',
  TABLE: 'page-table',
  APP_LOADING: 'app-loading',

  // ── Scheduler: top navigation bar ─────────────────────
  NAV: {
    CONTAINER: 'scheduler-nav',
    BRAND: 'scheduler-brand',
    TAB_PLAN: 'nav-tab-plan',
    TAB_SEM_A: 'nav-tab-sem-a',
    TAB_SEM_B: 'nav-tab-sem-b',
    YEAR_SELECT: 'nav-year-select',
    YEAR_OPTION: 'nav-year-option',          // suffix with -{year}
    BLOCK_BUTTON: 'nav-block-button',
    LOAD_PLAN_BUTTON: 'nav-load-plan-button',
    IMPORT_BUTTON: 'nav-import-button',
    IMPORT_INPUT: 'nav-import-input',
    EXPORT_BUTTON: 'nav-export-button',
  },

  // ── Scheduler: block (time blocker) popover ───────────
  BLOCK_POPOVER: {
    CONTAINER: 'block-popover',
    DAY_OPTION: 'block-day-option',          // suffix with -{dayKey}
    START_SLIDER: 'block-start-slider',
    END_SLIDER: 'block-end-slider',
    LABEL_INPUT: 'block-label-input',
    ADD_BUTTON: 'block-add-button',
  },

  // ── Scheduler: load-plan popover ──────────────────────
  LOAD_PLAN: {
    POPOVER: 'load-plan-popover',
    TRACK_OPTION: 'load-plan-track',         // suffix with -{trackId}
  },

  // ── Scheduler: catalogue (course browser) ─────────────
  CATALOGUE: {
    CONTAINER: 'catalogue-container',
    SEARCH_INPUT: 'catalogue-search-input',
    FILTER_TOGGLE: 'catalogue-filter-toggle',
    FACULTY_FILTER: 'catalogue-faculty-filter', // suffix with -{faculty}
    SEMESTER_SELECT: 'catalogue-semester-select', // suffix with -{id}
    CREDITS_MIN: 'catalogue-credits-min',
    CREDITS_MAX: 'catalogue-credits-max',
    MAX_COLLISIONS: 'catalogue-max-collisions',
    MIN_EXAM_GAP: 'catalogue-min-exam-gap',
    IGNORE_PREREQS_TOGGLE: 'catalogue-ignore-prereqs-toggle',
    COURSE_LIST: 'catalogue-course-list',
  },

  // ── Scheduler: single course row (catalogue item) ─────
  COURSE_ITEM: {
    ROW: 'course-item',                       // suffix with -{courseId}
    EXPAND_BUTTON: 'course-item-expand',      // suffix with -{courseId}
    ADD_BUTTON: 'course-item-add',            // suffix with -{courseId}
  },

  // ── Scheduler: weekly schedule grid ───────────────────
  WEEKLY: {
    GRID: 'weekly-grid',
    COURSE_BLOCK: 'weekly-course-block',      // suffix with -{courseId}
    BLOCKER: 'weekly-blocker',                // suffix with -{blockerId}
    OPTION_PANEL: 'weekly-option-panel',
    LOCK_BUTTON: 'weekly-lock-button',        // suffix with -{courseId}
    REMOVE_BUTTON: 'weekly-remove-button',    // suffix with -{courseId}
  },

  // ── Scheduler: month calendar ─────────────────────────
  MONTH_CALENDAR: {
    CONTAINER: 'month-calendar',
    DAY: 'month-calendar-day',                // suffix with -{dateStr}
  },

  // ── Scheduler: bottom course list bar ─────────────────
  SEMESTER_COURSE_LIST: {
    BAR: 'semester-course-list',
    CHIP: 'semester-course-chip',             // suffix with -{courseId}
    EXPAND_BUTTON: 'semester-course-expand',  // suffix with -{courseId}
    MANDATORY_BUTTON: 'semester-course-mandatory', // suffix with -{courseId}
    REMOVE_BUTTON: 'semester-course-remove',  // suffix with -{courseId}
    COMBINATIONS_BUTTON: 'semester-combinations-button',
  },

  // ── Scheduler: schedule preview / combinations panel ──
  PREVIEW: {
    PANEL: 'preview-panel',
    CARD: 'preview-card',                     // suffix with -{index}
    PREV_BUTTON: 'preview-prev-button',
    NEXT_BUTTON: 'preview-next-button',
    CLOSE_BUTTON: 'preview-close-button',
    PAGE_DOT: 'preview-page-dot',             // suffix with -{index}
  },

  // ── Scheduler: degree-plan semester box ───────────────
  SEMESTER_BOX: {
    CONTAINER: 'semester-box',                // suffix with -{id}
    COURSE_CHIP: 'semester-box-chip',         // suffix with -{courseId}
    REMOVE_BUTTON: 'semester-box-remove',     // suffix with -{courseId}
    EXPAND_BUTTON: 'semester-box-expand',     // suffix with -{courseId}
  },

  // ── Scheduler: exemptions panel ───────────────────────
  EXEMPTIONS: {
    CONTAINER: 'exemptions-container',
    CHIP: 'exemptions-chip',                  // suffix with -{courseId}
    REMOVE_BUTTON: 'exemptions-remove',       // suffix with -{courseId}
  },

  // ── Scheduler: degree plan page ───────────────────────
  DEGREE_PLAN: {
    CONTAINER: 'degree-plan-container',
    TRASH_ZONE: 'degree-plan-trash',
  },
}

export default TEST_IDS
