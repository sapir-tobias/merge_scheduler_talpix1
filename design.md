# Design Reference

Quick file-by-file guide. Read this instead of opening source files.

---

## Entry Points

### `src/App.tsx`
Nav bar + top-level view router.
- **State:** `view` (`'plan' | 'semA' | 'semB'`), defaults to `'plan'`; `year` (1–3); blocker popover; Load Plan popover
- **Nav order:** Degree Plan → Semester A → Semester B
- **Right-side buttons (l→r):** Block · Load Plan · Import · Export
- **Load Plan** calls `buildPlan(track, exemptions)` → dispatches `LOAD_PLAN`
- Renders: `DegreePlanPage` | `SemesterPage(semA)` | `SemesterPage(semB)`

### `src/state/DegreeContext.tsx`
Global `useReducer` state. All app state lives here.
- **State shape:** `placed[]`, `exemptions[]`, `filters`, `activeSemester`, `blockers[]`
- **Key actions:** ADD_COURSE (deduplicates + removes from exemptions), LOAD_PLAN (replaces placed[]), SET_RECITATION_OPTION, SET_LECTURE_OPTION

---

## Pages

### `src/pages/SemesterPage.tsx`
Per-semester view (Semester A or B tab).
- Layout: `[WeeklySchedule | MonthCalendar]` (row, flex-1) + `SemesterCourseList` (bottom bar) + `Catalogue` (right panel)

### `src/pages/DegreePlanPage.tsx`
3-year overview (landing page / Degree Plan tab).
- Layout: `ExemptionsBox` (left) | main grid (3 year rows + trash zone) | `Catalogue noScoring` (right)
- Active year gets `flex: 2 1 0`, inactive years `flex: 1 1 0 opacity-70`
- Drag from catalogue/exemptions → dispatches ADD_COURSE with best lecture + first recitation option

---

## Components

### `src/components/WeeklySchedule.tsx`
5-day grid with course blocks and blocker drawing.
- **Course blocks:** lecture (solid border) + recitation (dashed border, "Rec" prefix label), both from `allCourseBlocks`
- **Collision zones:** course↔course AND course↔blocker — both rendered as bright red diagonal stripe `z-[25]`
- **Option panel:** click a course block → popup with lecture options + recitation options (separate sections)
- **Blocker drag:** draw on empty grid → creates blocker (for current semester); drag body → move; drag bottom edge → resize
- **Filter dimming:** blocks whose faculty is not in `state.filters.faculties` render at `opacity: 0.18`
- Blockers are **per-semester** — filtered to `semBlockers = state.blockers.filter(b => b.semesterId === semesterId)`
- Faculty colors: cs=blue, math=violet, physics=amber, misc=stone

### `src/components/SemesterCourseList.tsx`
Bottom bar below WeeklySchedule.
- Horizontal scrollable row of course chips
- Each chip has: faculty dot · **status icon** (green ✓ / amber ⚠ / red ✗) · name/code · exam date · optional expand `▾` · remove ×
- Status computed via `scoreCourse()` — green=no issues, amber=warning, red=critical
- `▾` expand button (shown if course has >1 lecture option OR any recitation options) — opens portal popup above bar
- Portal popup: `maxHeight: min(420, rect.top - 12)`, `overflowY: auto`; shows Lecture + Recitation sections
- Right side: "Combinations (N)" button → opens `SchedulePreviewPanel`

### `src/components/SchedulePreviewPanel.tsx`
Lecture schedule combination browser (portal overlay above bottom bar).
- `getAllConfigs` = cartesian product of lecture options only; recitation carried through as-is
- `buildSlots` includes both lecture AND recitation slots (for collision counting + preview rendering)
- Collision count = course↔course + course↔blocker (same-course pairs excluded)
- 3 previews per page; click to apply; current config highlighted with check ring

### `src/components/Catalogue.tsx`
Right-panel course browser.
- Props: `semesterId?`, `showSemesterSelector?`, `draggable?`, `noScoring?`
- **noScoring mode** (DegreePlanPage): simple name/code filter, no scoring UI, no add button
- **scoring mode** (SemesterPage): `filterAndScore()` ranks by collisions/exam gap/prereqs
- Faculty filter buttons: CS / Math / Phys / Misc

### `src/components/CourseItem.tsx`
Single row in Catalogue. Expand → shows description, lecture times, recitation times, exam date, prereqs.
- Lab-only courses (empty lectureOptions) show "Lab / recitation only" note

### `src/components/SemesterBox.tsx`
Compact semester box in DegreePlanPage. Shows course list (draggable chips) + optional MiniExamCalendar.

### `src/components/ExemptionsBox.tsx`
Left panel in DegreePlanPage. Drag courses here to mark as "already completed"; drag back to place in semesters.

### `src/components/MonthCalendar.tsx`
Snake visualization. Faculty-colored bars connecting study days → exam head circles.
- **Props:** `closeExamDates?: Set<string>` — dates that get a bright red outline ring on the head circle
- Snake bars are `h-[14px]` (thicker than calendar date numbers `text-[12px]`)

### `src/components/MiniExamCalendar.tsx`
Compact calendar used inside SemesterBox and DegreePlanPage.

### `src/components/ExamStrip.tsx`
Horizontal exam date strip used in SemesterPage.

### `src/components/Tooltip.tsx`
Generic tooltip wrapper (portal-based).

---

## Data & Logic

### `src/data/courses.ts`
37 courses: cs (12), math (9), physics (6), misc (10).
- Each course: `lectureOptions[]` (0–3) + optional `recitationOptions[]` (0–3)
- `lectureOptions: []` = lab/recitation-only (e.g. `misc-datalab`)
- `INITIAL_PLACED` has 16 pre-placed courses with `recitationOptionId: 'r1'` where applicable
- `COURSE_MAP`: `Map<id, Course>` for O(1) lookup

### `src/data/plans.ts`
3 default degree tracks × 6 semesters.
- `buildPlan(track, exemptions)` → `PlacedCourse[]` (exempt courses filtered out)
- Tracks: `'cs'` · `'math'` · `'physics'`

### `src/lib/scoring.ts`
- `pickBestOption(course, placed, semId)` — picks lecture option with fewest collisions; returns `''` for lab-only
- `pickFirstRecitationOption(course)` — returns first recitation option id or `undefined`
- `scoreCourse(...)` — returns `CourseScore` with collision count, exam gap, prereq status
- `filterAndScore(...)` — filters + sorts courses for Catalogue
- **Prerequisites:** only courses from **previous** semesters (`p.semesterId < semesterId`) count as satisfied

### `src/types/index.ts`
Key types:
- `Faculty = 'cs' | 'math' | 'physics' | 'misc'`
- `Course` has `lectureOptions: LectureOption[]` + optional `recitationOptions?: LectureOption[]`
- `PlacedCourse` has `lectureOptionId: string` + optional `recitationOptionId?: string`

---

## Visual Conventions

| Faculty | Color |
|---------|-------|
| cs      | blue  |
| math    | violet |
| physics | amber |
| misc    | stone |

**Collision stripe:** `repeating-linear-gradient(-45deg, rgba(239,68,68,0.78) 0px, ... 12px)` with border `rgba(239,68,68,0.95)` — bright red, used for both course↔course AND course↔blocker overlaps on the weekly grid.

**Recitation blocks:** same faculty color as lecture, but dashed border + "Rec" prefix.

**Lab-only course:** `lectureOptions: []` — no lecture block on grid, only recitation block (dashed).
