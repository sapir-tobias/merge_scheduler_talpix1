# Scheduler — Project Guide

## Purpose
A degree-planning Scheduler, structured as a **plug-and-play drop-in for the Talpix repo**. Students place courses into semesters, pick lecture/recitation time slots, see weekly schedule grids and exam-period calendars, and block off personal unavailable times. Split into a React frontend and a Talpix-shaped mock backend so it ports into Talpix (`services/frontend` + `services/backend/web_features`) with minimal changes.

## Stack
- **Frontend:** React 19 + Vite + TypeScript, react-router-dom v7
- **Styling:** CSS Modules + Bootstrap 5 / react-bootstrap. **No Tailwind.** Global design tokens (CSS custom properties) live in `src/index.css`; components reference them from co-located `[Component].module.css`. `cn()` from `src/lib/utils.ts` is plain clsx (CSS Modules already produce unique class names).
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
src/
  App.tsx                    — providers (CoursesProvider → DegreeProvider) + router; maps allPages → routes with role gating
  urls.js                    — Category/Page registry (Talpix-style); schedulerPages roles = ['Cadet','Sagab','Sagaz','Kamat']
  main.tsx, index.css        — entry + global design tokens
  testIds.ts                 — central data-testid constants (shared with Playwright)
  types/index.ts             — all shared types
  stores/
    DegreeContext.tsx        — global plan state (useReducer), all actions
    CoursesStore.tsx         — fetches catalogue + initial-placed from the API; exposes courseMap, fetchPlan
  hooks/
    useAPIFetch.ts           — GET hook [data, isLoading, refresh] (Talpix-standard)
    useAPIAction.ts          — POST/PUT/PATCH/DELETE hook [execute, isLoading]
  lib/{utils.ts, scoring.ts} — cn() helper; filterAndScore(), pickBestOption()
  pages/
    SchedulerPage.tsx        — nav-bar shell (tabs, year selector, Block, Load Plan, Import/Export) + active view
    SemesterPage.tsx         — per-semester view (WeeklySchedule + MonthCalendar + SemesterCourseList + Catalogue)
    DegreePlanPage.tsx       — 3-year overview (ExemptionsBox + SemesterBox grid + Catalogue)
  components/
    WeeklySchedule.tsx       — 5-day grid, course blocks, blocker drag/resize/draw
    MonthCalendar.tsx        — snake visualization (study days + exam heads by faculty color)
    ExamStrip.tsx            — linear exam-period strip
    SemesterCourseList.tsx   — bottom bar: course chips + Combinations button
    SchedulePreviewPanel.tsx — schedule-combination previews with blocker collision detection
    SemesterBox.tsx          — compact semester box for degree plan view
    MiniExamCalendar.tsx     — mini calendar showing exam dates
    Catalogue.tsx            — right panel course list with scoring/search/filters
    CourseItem.tsx           — single course row in Catalogue
    ExemptionsBox.tsx        — left panel for exempted (pre-passed) courses
    Tooltip.tsx              — shared hover tooltip
  _archive/                  — dead legacy demo files (not imported; excluded conceptually)
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
- CSS Modules for styling; Bootstrap utility/components allowed; inline `style` only for dynamic values (positions, percentages).
- `createPortal(…, document.body)` for overlays/panels.
- TypeScript strict — no `any`. Faculty palette: cs=blue, math=violet, physics=amber, misc=stone.
- Backend: views never touch the filesystem directly — always go through `repository`; project to the wire shape through `serializers`.
- Keep `data-testid`s in `testIds.ts` and reuse them in components + Playwright.
