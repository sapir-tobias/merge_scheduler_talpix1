# Scheduler — Project Guide

## Purpose
A degree-planning Scheduler, structured as a **plug-and-play drop-in for the Talpix repo**. Students place courses into semesters, pick lecture/recitation time slots, see weekly schedule grids and exam-period calendars, and block off personal unavailable times. Split into a React frontend and a Talpix-shaped mock backend so it ports into Talpix (`services/frontend` + `services/backend/web_features`) with minimal changes.

## Stack
- **Frontend:** React + Vite + **pure JavaScript** (`.js`, JSX inside `.js` like Talpix; Vite 7 with the jsx loader), react-router-dom. Only libraries that exist in Talpix are used: `react-icons` (icons, `react-icons/lu`), `bootstrap`. **No clsx / lucide-react / radix / CVA.**
- **Styling:** CSS Modules. **No Tailwind.** Global design tokens (CSS custom properties) live in `src/index.css`; components reference them from co-located `[Component].module.css`. `cn()` from `src/utils/utils.js` is a dependency-free truthy-join (CSS Modules already produce unique class names).
- **Backend:** FastAPI mock of a Talpix Django/DRF feature. Views carry the real DRF decorator stack via a shim (`decorators.py`) and talk to a JSON-backed repository that mimics MongoEngine queries.
- **Run:** `npm run dev` (root) starts both via `concurrently`; Vite proxies `/api` → `http://localhost:8000`.

## Repo Layout
```
frontend/                         — Vite/React/TS app
backend/                          — FastAPI mock Talpix backend
  main.py                         — app entry; mounts the scheduler router; basicConfig JSON logs
  apps/TalpiotAPIs/Scheduler/
    models.py                     — MongoEngine Documents (production drop-in schema; course_number PK)
  web_features/scheduler/
    urls_scheduler.py             — APIRouter route table (prefix /api/scheduler)
    logic_scheduler.py            — view controllers (DRF decorator stack + scoped JSON logging)
    repository.py                 — Mongo-like abstraction over JSON; course_number identity adapter
    serializers.py                — shnaton document -> frontend wire shape projection
    decorators.py                 — FastAPI shim mirroring DRF (@api_view, restrict_roles, JsonResponse…)
    data/{courses,initial_placed,plans}.json
  _seed_demo_plan.py              — regenerates initial_placed/plans from real courses
  tests/scheduler_tests/          — pytest (repository, serializers, endpoints, models)
  conftest.py                     — puts backend/ on sys.path for tests
e2e-tests/Tests/SchedulerTests/   — Playwright spec + playwright.config.js
scripts/run.ps1                   — verification gate (tsc --noEmit + pytest)
```

## Frontend File Map
```
src/                         — pure JavaScript (.js). ALL feature code is co-located under
                               components/timetable/ (Talpix pattern, cf. components/food, components/shift);
                               global hooks/ holds only the shared Talpix hooks.
  App.js, main.js, index.css — local shell + entry + design tokens (not migrated; Talpix owns index.js/Main.js)
  urls.js                    — Category/Page registry (Talpix-style); roles = ['Cadet','Sagab','Sagaz','Kamat'] (merge block into Talpix urls.js)
  testIds.js                 — central data-testid constants (merge into Talpix testIds.js; shared with Playwright)
  hooks/
    useAPIFetch.js, useAPIAction.js          — local copies of Talpix's shared hooks (use Talpix's on merge)
  pages/Timetable/
    SchedulerPage.js         — nav-bar shell (tabs, year selector, Block, Load Plan, Import/Export) + active view
    SemesterPage.js          — per-semester view (WeeklySchedule + MonthCalendar + SemesterCourseList + Catalogue)
    DegreePlanPage.js        — 3-year overview (ExemptionsBox + SemesterBox grid + Catalogue)
  components/timetable/      — the whole feature, co-located (every file < 200 lines):
    DegreeContext.js, CoursesStore.js               — feature React contexts (cf. components/food/FoodWeekContext.js)
    useBlockerDrag.js, useDismissOnOutsideClick.js  — feature hooks (cf. components/food/useBreakfasts.js)
    scoring.js, weeklyLayout.js, snakeMap.js, previewConfigs.js, planIO.js, utils.js(cn) — feature helpers
    constants.js                                    — feature tokens (cf. pages/Elements/CadetPage/constants.js)
    WeeklySchedule.js + ScheduleGrid/CourseBlock/BlockerBlock/LectureOptionPanel  — 5-day grid, blocks, blocker drag/resize/draw
    MonthCalendar.js + MonthGrid                                                  — snake visualization (study days + exam heads)
    Catalogue.js + CatalogueFilters + CourseItem + CourseItemDetail               — course browser w/ scoring/search/filters
    SemesterCourseList.js + SemesterCourseChip                                    — bottom bar: chips + Combinations
    SchedulePreviewPanel.js + PreviewCard + MiniSchedule                          — combination previews + collision detection
    SemesterBox.js + SemesterBoxBody, MiniExamCalendar, ExemptionsBox, ExamStrip, Tooltip
    BlockerPopover, LoadPlanPopover, SchedulerIOButtons                           — nav-bar popovers + import/export
```

## Backend Architecture (the drop-in story)
The view layer is identical to a real Talpix view, so porting = delete the shim and import the real auth helpers — no view rewrites.

- **Identity-key adapter** (`repository.py`): the real shnaton payload identifies a course by `course_number` (e.g. `"77693"`), not a synthetic `id`. Every `course_id` lookup normalizes and matches against `course_number`. Functions read like Mongo queries: `all_courses()` ≈ `Course.objects.all()`, `get_course(n)` ≈ `Course.objects(course_number=n).first()`, plus `filter_courses`, `get_plan`, `list_track_ids`, `save_placed`, `upsert_course`. Swapping JSON for live Mongo is a body-only change.
- **Serializers** (`serializers.py`): pure projection of a shnaton document → the frontend `Course` wire shape. Faculty: `faculty_code` `012`→cs, `002`+dept→`physics`/`math`, else `misc`. Slots: Hebrew weekday (ראשון→sun … חמישי→thu; Fri/Sat dropped) + `"HH:MM-HH:MM"`→(start,end) float hours. Groups split into `lectureOptions`/`recitationOptions` (`lesson_type` "תרגיל" = recitation, else lecture). `examDate` prefers the moed-1 sitting.
- **Decorator stack** (every view, `logic_scheduler.py`):
  ```python
  @api_view(['GET'])
  @authentication_classes([TalpiotJWTAuthentication])
  @permission_classes([IsAuthenticated])
  @restrict_roles(['Cadet','Sagab','Sagaz','Kamat'])
  def list_courses(request): return JsonResponse({...}, status=200)
  ```
  Returns `JsonResponse` (Starlette JSONResponse under the hood). Logging is scoped (`logging.getLogger(__name__)`) and every line is a JSON string for Grafana LogQL.
- **Routes** (`urls_scheduler.py`, all `response_model=None`):
  `GET /api/scheduler/courses`, `GET /courses/{course_id}`, `GET /initial-placed`, `POST /initial-placed`, `GET /plans`, `GET /plans/{track_id}`.
- **Production schema** (`apps/TalpiotAPIs/Scheduler/models.py`): MongoEngine `Document`s mirroring the real payload; `course_number` primary key; `meta={'collection': 'courses'}`. Imported only when wired to Mongo (`mongoengine` is an optional install; the JSON repository runs localhost without it).

## State Model (`DegreeState`)
```typescript
placed: PlacedCourse[]       // { courseId, semesterId, lectureOptionId, recitationOptionId?, locked }
exemptions: string[]         // courseIds treated as already completed
filters: CatalogueFilters
activeSemester: SemesterId   // 1–6
blockers: Blocker[]          // { id, label?, day, startHour, endHour, semesterId } — per-semester
```
**Actions:** ADD_COURSE, REMOVE_COURSE, MOVE_COURSE, TOGGLE_LOCK, SET_LECTURE_OPTION, SET_RECITATION_OPTION, SET_FILTERS, SET_ACTIVE_SEMESTER, ADD_BLOCKER, REMOVE_BLOCKER, UPDATE_BLOCKER, ADD_EXEMPTION, REMOVE_EXEMPTION, LOAD_PLAN

## Data
- `courses.json` = real Hebrew University shnaton scrape: **353 courses** keyed by `course_number`, with `name_he`, `faculty_code`/`faculty_name`, `credits`, `semester`, `has_exam`, `exam_dates`/`test_dates`, `groups` (`group_id`, `lesson_type`, `schedule[]`), `prerequisites`, etc. The frontend never sees these keys directly — `serializers.py` projects them onto the stable `Course` contract.
- `initial_placed.json` / `plans.json` are demo fixtures in **document (real-key) shape** (`course_number`, `semester_id`, `lecture_option_id`…), regenerated from real courses by `_seed_demo_plan.py` so every entry references a real `course_number` + `group_id`. Serialized to frontend shape on the way out.

## Key Frontend Patterns
### Drag state for blockers (WeeklySchedule)
`dragState = useRef<DragState>` for logic (no re-render) + `dragRender = useState<DragState>` for visuals. Document-level mousemove/mouseup listeners avoid stale closures.

### Equal-height flex children
Module CSS uses `flex: 1; min-height: 0` on rows and `height: 100%` on children; scrollable areas set `overflow-y: auto`.

### Snake in MonthCalendar
Faculty-colored bar connects study days leading to each exam. Body starts 7 days before the exam (or prev exam+1 if closer). HEAD = exam-day circle (bar extends left only); BODY = study days. Hover tooltip shows exam name.

### Schedule Preview Panel
`getAllConfigs(placed, blockers)`: cartesian product of lecture options, sorted by collision count; collisions include course-blocker overlaps. Click to apply a config.

## Testing & Verification
- **Backend:** `cd backend && python -m pytest tests` (30 tests: repository identity adapter, serializer projections, endpoint integration incl. decorator-stack assertions, MongoEngine model introspection — skipped if `mongoengine` absent).
- **e2e:** `cd e2e-tests && npm install && npx playwright test` (config auto-starts the dev stack via root `npm run dev`, `reuseExistingServer` locally). Selectors come from `testIds.ts`.
- **Gate:** `pwsh scripts/run.ps1` runs `tsc --noEmit` + pytest. `pwsh scripts/run.ps1 -Dev` launches the dev stack.

## Conventions
- No comments unless the WHY is non-obvious.
- **Pure JavaScript** (`.js` with JSX inside, Talpix-style); **every file < 200 lines** — split large views into sub-components under `components/timetable/`.
- **Only libraries that exist in Talpix.** Icons via `react-icons/lu`; class names via the dependency-free `cn()`; no clsx/lucide/radix/CVA. New non-Talpix libs need a why-it's-logic justification first.
- No hardcoded tokens in views — faculty/credit/term/day/track constants live in `src/constants.js`. Faculty palette: cs=blue, math=violet, physics=amber, misc=stone.
- CSS Modules for styling; inline `style` only for dynamic values (positions, percentages); `createPortal(…, document.body)` for overlays/panels.
- Backend: views never touch the filesystem directly — always go through `repository`; project to the wire shape through `serializers`.
- Keep `data-testid`s in `testIds.js` and reuse them in components + Playwright.
