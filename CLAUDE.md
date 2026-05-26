# Degree Planner — Project Guide

## Purpose
A React demo (no backend) for planning a 3-year CS/Math/Physics degree. Students place courses into semesters, pick lecture time slots, see weekly schedule grids and exam period calendars, and block off personal unavailable times.

## Stack
- React 19 + Vite + TypeScript
- Tailwind CSS v4 (JIT, no config file — just `@import "tailwindcss"` in CSS)
- `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) for conditional classes
- No router — single-page app with view state in `App.tsx`

## File Map

```
src/
  App.tsx                    — nav bar (tabs, year selector, Block button, Import/Export)
  types/index.ts             — all shared types
  state/DegreeContext.tsx    — global state (useReducer), all actions
  data/courses.ts            — COURSES array, COURSE_MAP, INITIAL_PLACED
  lib/
    utils.ts                 — cn() helper
    scoring.ts               — filterAndScore(), pickBestOption()
  pages/
    SemesterPage.tsx         — per-semester view (WeeklySchedule + MonthCalendar + SemesterCourseList + Catalogue)
    DegreePlanPage.tsx       — 3-year overview (ExemptionsBox + SemesterBox grid + Catalogue)
  components/
    WeeklySchedule.tsx       — 5-day grid, course blocks, blocker drag/resize/draw
    MonthCalendar.tsx        — snake visualization (study days + exam heads by faculty color)
    SemesterCourseList.tsx   — bottom bar: course chips + Combinations button
    SchedulePreviewPanel.tsx — mini schedule combination previews with blocker collision detection
    SemesterBox.tsx          — compact semester box for degree plan view
    MiniExamCalendar.tsx     — mini calendar showing exam dates (used in SemesterBox + DegreePlanPage)
    Catalogue.tsx            — right panel course list with scoring/search/filters
    CourseItem.tsx           — single course row in Catalogue
    ExemptionsBox.tsx        — left panel for exempted (pre-passed) courses
```

## State Model (`DegreeState`)
```typescript
placed: PlacedCourse[]       // { courseId, semesterId, lectureOptionId, locked }
exemptions: string[]         // courseIds treated as already completed
filters: CatalogueFilters    // search, faculties, credits, maxCollisions, minExamGap, ignorePrereqs
activeSemester: SemesterId   // 1–6
blockers: Blocker[]          // { id, label?, day, startHour, endHour, semesterId } — per-semester
```

**Actions:** ADD_COURSE, REMOVE_COURSE, MOVE_COURSE, TOGGLE_LOCK, SET_LECTURE_OPTION, SET_RECITATION_OPTION, SET_FILTERS, SET_ACTIVE_SEMESTER, ADD_BLOCKER, REMOVE_BLOCKER, UPDATE_BLOCKER, ADD_EXEMPTION, REMOVE_EXEMPTION, LOAD_PLAN

## Key Patterns

### Drag state for blockers (WeeklySchedule)
```typescript
type DragState = { type: 'none' } | { type: 'creating'; ... } | { type: 'moving'; id; offsetHour; origDuration; ... } | { type: 'resizing'; id; ... }
dragState = useRef<DragState>  // for logic (no re-render)
dragRender = useState<DragState>  // for visual update
```
Document-level mousemove/mouseup listeners — avoids stale closures.

### Equal-height flex children
Use `flex-1 min-h-0` on rows and `h-full` on children. Scrollable areas need `overflow-y-auto`.

### Catalogue modes
- Normal (SemesterPage): scoring active, add button, semester selector hidden
- `noScoring` (DegreePlanPage): simple search+faculty filter, no add button, no scoring-specific filters

### Collision visualization
Red diagonal stripe: `repeating-linear-gradient(-45deg, rgba(220,38,38,0.38) 0px, rgba(220,38,38,0.38) 4px, transparent 4px, transparent 12px)` with border `rgba(220,38,38,0.65)`.

### Snake in MonthCalendar
- Faculty-colored bar connecting study days leading up to each exam
- Body starts 7 days before the exam (or from prev exam+1 day if closer)
- HEAD = exam day circle; bar extends left only (never right)
- BODY = study days; bar extends left if prev is body, right if next is body/head
- Hover tooltip shows exam name

## Data
- 37 courses across cs/math/physics/misc faculties (`elective` renamed to `misc`)
- Each course has 0–3 lecture options and 0–3 recitation options (LectureOption[])
- `lectureOptions: []` = lab/recitation-only course (e.g. misc-datalab)
- Exam dates shifted to Jul–Aug 2026 (future dates from May 2026)
- `INITIAL_PLACED`: pre-populated semester 1–5 courses with recitationOptionId
- `data/plans.ts`: 3 default tracks (cs/math/physics) × 6 semesters for Load Plan feature

## Degree Plan Page Layout
```
[ExemptionsBox] [Main area] [Catalogue noScoring]

Main area (flex-col):
  Active year (flex: 2 1 0):
    Row 1: [SemA courses box] [SemB courses box]   (flex-1)
    Row 2: [SemA MiniExamCalendar] [SemB MiniExamCalendar]  (flex-1)
  Inactive year (flex: 1 1 0, opacity-70): [SemC] [SemD]
  Inactive year (flex: 1 1 0, opacity-70): [SemE] [SemF]
  Trash drop zone (shrink-0)
```

## Semester Page Layout
```
[WeeklySchedule + MonthCalendar (flex-row, flex-1)]
[SemesterCourseList (shrink-0, full-width below both)]
[Catalogue (w-64 on right)]
```

## Blocker UX
- Draw on grid → creates unnamed blocker
- Click label text → inline edit (Enter/Escape)
- Drag body → move; drag bottom edge → resize
- Block button in nav bar → popover with sliders (0.5h steps) + optional label + day picker

## Schedule Preview Panel
- `getAllConfigs(placed, blockers)`: cartesian product of lecture options, sorted by collision count
- Collision detection includes course-blocker overlaps (not just course-course)
- 3 previews per page, pagination with grayed prev/next
- Click to apply config; active config shown with check ring

## Conventions
- No comments unless the WHY is non-obvious
- Tailwind for styling; inline style only for dynamic values (positions, percentages)
- `createPortal(…, document.body)` for overlays/panels
- TypeScript strict — no `any`
- Faculty color palettes: cs=blue, math=violet, physics=amber, elective=stone
