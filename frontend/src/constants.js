/**
 * Shared layout tokens & domain constants — single source of truth.
 * Components import from here instead of hardcoding values inline.
 */

// ── Faculty palette ───────────────────────────────────────────
export const FACULTY_KEYS = ['cs', 'math', 'physics', 'misc']
export const FACULTIES = [
  { id: 'cs', label: 'CS' },
  { id: 'math', label: 'Math' },
  { id: 'physics', label: 'Phys' },
  { id: 'misc', label: 'Misc' },
]
export const FACULTY_LABEL = { cs: 'CS', math: 'Math', physics: 'Phys', misc: 'Misc' }

// ── Credit filter bounds — span the real dataset (0–20 cr) ────
export const MIN_CREDITS = 0
export const MAX_CREDITS = 20

// ── Semester terms (normalized by the backend serializer) ─────
export const TERM_LABEL = { a: 'Sem A', b: 'Sem B', either: 'A / B', yearly: 'Yearly', summer: 'Summer' }

// ── Schedulable weekdays (the 5-day grid) ─────────────────────
export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu']
export const DAY_LABEL = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu' }
export const DAYS_LIST = [
  { key: 'sun', label: 'Sunday' },
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
]

// ── Placement semesters (1–6) and plan years (1–3) ────────────
export const SEMESTER_IDS = [1, 2, 3, 4, 5, 6]
export const PLAN_YEARS = [1, 2, 3]

// ── Default degree tracks (Load Plan) ─────────────────────────
export const TRACK_IDS = ['cs', 'math', 'physics']
export const TRACK_LABEL = { cs: 'Computer Science', math: 'Mathematics', physics: 'Physics' }
export const TRACK_DESC = {
  cs: '6 semesters · algorithms, OS, networks, AI',
  math: '6 semesters · analysis, algebra, statistics, QM',
  physics: '6 semesters · mechanics, E&M, quantum, thermo',
}
export const TRACK_DOT_COLOR = { cs: '#60a5fa', math: '#a78bfa', physics: '#fbbf24' }

// Mock current-user roles (Talpix resolves these from the authenticated session)
export const CURRENT_USER_ROLES = ['Cadet']
