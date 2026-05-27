# Scheduler → Talpix Migration Roadmap

How this workspace (Project B) drops into the main Talpix repo (Project A,
`../new_talpix/talpix`). Project A is the read-only blueprint; nothing here
modifies it — this is the plan for when the Scheduler is merged in.

---

## 1. Mock (local-only) vs. Production-ready

### Temporary local mock — replaced/deleted on merge
| File / element | Why it's mock | Fate on merge |
|---|---|---|
| `backend/web_features/scheduler/repository.py` — the `_load_courses/_load_initial_placed/_load_plans` bodies, `lru_cache`, `_atomic_write`, `DATA_DIR`, `json`/`Path`/`threading` imports | Reads JSON files off disk to stand in for Mongo | **Bodies swapped to MongoEngine queries** (§2). Public function names/signatures stay identical. |
| `backend/web_features/scheduler/decorators.py` | Mock DRF shim (`api_view`, `authentication_classes`, `permission_classes`, `restrict_roles`, `TalpiotJWTAuthentication`, `IsAuthenticated`, `JsonResponse`, `Request`) backed by FastAPI | **Deleted.** Imports re-point to the real `server_side.infastructure.auth.*` + DRF + `django.http.JsonResponse`. |
| `backend/web_features/scheduler/data/*.json` | Fixtures | `courses.json` optionally kept as a seed; `initial_placed.json`/`plans.json` are demo data (regenerate from Mongo or drop). |
| `backend/main.py` | FastAPI entry point + CORS | **Deleted.** Talpix's Django ASGI app + central `urls.py` mount the feature. |
| `backend/_seed_demo_plan.py`, `backend/conftest.py`, `backend/requirements.txt` | Local dev/seed/test tooling | Not migrated (Talpix already pins `mongoengine`, has its own conftest/settings). |
| FastAPI `APIRouter` in `urls_scheduler.py` | FastAPI routing | Converted to Django `urlpatterns = [path(...)]` (§3). |
| `frontend/src/App.tsx`, `main.tsx` | Project-B SPA shell + react-router v7 | Not migrated — Talpix's `index.js` shell + `urls.js` own routing. |

### 100% production-ready — drop in as-is (modulo notes)
| File / element | Status |
|---|---|
| `backend/apps/TalpiotAPIs/Scheduler/models.py` | **Production.** MongoEngine `Course` (groups, test_dates, prerequisites, num_groups…), `PlacedCourse`, `PlanTrack`, `meta={'collection': …}`, `course_number` primary key. |
| `backend/web_features/scheduler/serializers.py` | **Production.** Pure projection over plain dicts — source-agnostic (works for JSON *and* `to_mongo()` dicts). Derives faculty, day/hour slots, `term`, `hasExam`, `mandatoryAttendance` (נ״ח). |
| `backend/web_features/scheduler/logic_scheduler.py` | **Production logic**, `request`-first views + Talpix decorator stack + scoped JSON logging. Only the import line and `save_placement`'s body read change (§2). |
| Frontend CSS Modules (`*.module.css`), components, pages, `stores/`, `hooks/`, `lib/scoring.ts`, `testIds.ts` | **Production** UI/state — CSS-Module flex + design tokens, Context providers, custom hooks. See §3 frontend notes (TS↔JS, hook/testIds merge). |
| `urls.js` Category/Page registration | **Production** routing contract (§3). |

---

## 2. Backend conversion pathway — `repository.py` → live Mongo

The view layer never changes: it already calls `repository.all_courses()`,
`repository.get_course(id)`, etc. and treats the result as opaque dicts. Only
the **bodies** of `repository.py` swap from JSON parsing to Mongo queries.

**Identity-key adapter stays critical:** `course_number` is the MongoEngine
`primary_key`, so Mongo stores it as `_id` and `to_mongo()` emits `_id` (not
`course_number`). A `_to_dict()` helper re-injects `course_number` so the
serializers — which read `course_number` — need no change.

Replace the JSON internals with:

```python
# backend/web_features/scheduler/repository.py  (production form)
from apps.TalpiotAPIs.Scheduler.models import Course, PlacedCourse, PlanTrack

IDENTITY_KEY = "course_number"

def _to_dict(doc):
    """MongoEngine document -> plain dict the serializers consume.
    Re-injects course_number because the PK is stored as _id."""
    d = doc.to_mongo().to_dict()
    d["course_number"] = str(doc.pk)
    d.pop("_id", None)
    return d

def all_courses():
    return [_to_dict(c) for c in Course.objects()]                      # Course.objects.all()

def get_course(course_id):
    c = Course.objects(course_number=str(course_id).strip()).first()    # identity adapter
    return _to_dict(c) if c else None

def filter_courses(**criteria):
    return [_to_dict(c) for c in Course.objects(**criteria)]

def course_exists(course_id):
    return Course.objects(course_number=str(course_id).strip()).first() is not None

def all_placed():
    return [p.to_mongo().to_dict() for p in PlacedCourse.objects()]

def save_placed(placed):
    PlacedCourse.objects().delete()
    PlacedCourse.objects.insert([PlacedCourse(**p) for p in placed])
    return placed

def list_track_ids():
    return [t.track_id for t in PlanTrack.objects()]

def get_plan(track_id):
    t = PlanTrack.objects(track_id=str(track_id).strip()).first()
    return [e.to_mongo().to_dict() for e in t.entries] if t else None

def upsert_course(course):
    Course(**course).save()
    return course
```

**Lines removed:** every `_load_*` function, `_invalidate_caches`,
`_atomic_write`, `DATA_DIR`/`*_FILE` paths, and the `json` / `pathlib` /
`threading` / `lru_cache` imports. **`logic_scheduler.py` deltas:** change
`from .decorators import (...)` to the real DRF/auth imports, and in
`save_placement` swap `body = await request.json()` (sync) for
`body = request.data` — i.e. it becomes a normal sync DRF view again.

---

## 3. Explicit stitching drop-map

### Backend (`Project B` → `../new_talpix/talpix/services/backend/`)
| From (Project B) | To (Talpix) | Notes |
|---|---|---|
| `backend/apps/TalpiotAPIs/Scheduler/` | `services/backend/apps/TalpiotAPIs/Scheduler/` | `models.py` (Course, PlacedCourse, PlanTrack, **SavedSchedule** w/ `ReferenceField(User)`) + `__init__.py`, as-is. |
| `backend/apps/settings.py` + `settings.json` | `services/backend/apps/settings.py` | **merge** the `scheduler_*` keys + env-override entries into Talpix's existing `load_settings()` (don't overwrite); `secret_settings.json` stays git-ignored. |
| `backend/web_features/scheduler/logic_scheduler.py` | `services/backend/web_features/scheduler/logic.py` | rename → `logic.py`; re-point imports (§2). |
| `backend/web_features/scheduler/urls_scheduler.py` | `services/backend/web_features/scheduler/urls.py` | rename → `urls.py`; convert `APIRouter` → `urlpatterns` (below). |
| `backend/web_features/scheduler/repository.py` | same path | swap bodies to Mongo (§2). |
| `backend/web_features/scheduler/serializers.py` | same path | as-is. |
| `backend/web_features/scheduler/data/courses.json` | same path (or seed script) | optional seed. |
| `backend/web_features/scheduler/decorators.py` | — | **do not copy** (delete; use real auth). |
| `backend/tests/scheduler_tests/{test_repository,test_serializers,test_models}.py` | `services/backend/tests/scheduler_tests/` | port directly (pure-function + model introspection). |
| `backend/tests/scheduler_tests/test_endpoints.py` | `services/backend/tests/scheduler_tests/` | **rewrite** FastAPI `TestClient` → Django `APIClient`. |

Django route table after the rename:
```python
# services/backend/web_features/scheduler/urls.py
from django.urls import path
from .logic import (
    list_courses, get_course, get_initial_placed,
    save_placement, list_plans, get_plan,
)
urlpatterns = [
    path("courses/",                list_courses),
    path("courses/<str:course_id>/", get_course),
    path("initial-placed/",         get_initial_placed),   # GET
    path("initial-placed/save/",    save_placement),        # POST
    path("plans/",                  list_plans),
    path("plans/<str:track_id>/",   get_plan),
]
```
Then mount it in Talpix's root URL conf: `path("api/scheduler/", include("web_features.scheduler.urls"))`.

### Frontend (`Project B` → `../new_talpix/talpix/services/frontend/src/`)
Frontend is **pure JavaScript** (`.js`, JSX-in-`.js` like Talpix's CRA), every file <200 lines, CSS-Module + design-token styling, and only Talpix-present libraries (`react-icons`, `bootstrap`). The folder split already mirrors Talpix (`components/`, `pages/`, `hooks/`, `utils/`, `stores/` — no `lib/`). Most of it is now a literal copy-in.
| From (Project B) | To (Talpix) | Notes |
|---|---|---|
| `components/timetable/*.js` (+ `*.module.css`) — all 25 feature components | `components/timetable/` | drop in as-is (already namespaced, like Talpix's `components/` groupings). |
| `pages/Timetable/{SchedulerPage,SemesterPage,DegreePlanPage}.js` (+ css) | `pages/Timetable/` | drop in as-is (matches `pages/Talpix/`, `pages/groups/`). |
| `utils/*.js` (scoring, utils[cn], weeklyLayout, snakeMap, previewConfigs, planIO) | `utils/` | drop in as-is. |
| `hooks/{useBlockerDrag,useDismissOnOutsideClick}.js` | `hooks/` | scheduler interaction hooks, as-is. |
| `constants.js` | `src/constants.js` | Talpix already has a `src/constants.js` — **merge** the timetable tokens in. |
| `stores/{DegreeContext,CoursesStore}.js` | `stores/` | as-is (DegreeContext persists to localStorage). |
| `index.css` `--color-*` / `--faculty-*` tokens | merge missing tokens into Talpix `styles/theme.css` | don't overwrite Talpix theme. |
| `testIds.js` | **merge** scheduler keys into Talpix's existing `testIds.js` | add the `NAV`/`CATALOGUE`/`WEEKLY`/… sub-objects; don't overwrite. |
| `urls.js` scheduler block | **merge** into Talpix's `urls.js` (below) | import path: `./pages/Timetable/SchedulerPage`. |
| `hooks/{useAPIFetch,useAPIAction}.js` | — | Talpix **already has** these (different signatures). Keep timetable-scoped or rewire `CoursesStore` (see caveat). |
| `App.js`, `main.js`, full `urls.js`, `vite.config.js`, `index.html`, `jsconfig`-less | — | not migrated — Talpix owns the shell/router/build (CRA, not Vite). |
| `e2e-tests/Tests/SchedulerTests/scheduler.spec.js` | Talpix `e2e-tests/Tests/SchedulerTests/` | as-is (15 specs). |

**Register the Scheduler in Talpix `services/frontend/src/urls.js`:**
```js
// 1) add to the imports block at the top:
import SchedulerPage from "./pages/Timetable/SchedulerPage";

// 2) declare the category's pages (exact roles):
const schedulerPages = [
    new Page('מערכת שעות', 'planner', SchedulerPage, ['Cadet', 'Sagab', 'Sagaz', 'Kamat']),
];

// 3) add one entry to the exported `categories` array:
new Category('מערכת', 'scheduler', schedulerPages),
```
This yields the route `/scheduler/planner`, gated by `<Restricted roles={['Cadet','Sagab','Sagaz','Kamat']}>` via Talpix's existing `index.js` router — no router rewrite needed (the page component is router-agnostic).

### Integration caveats (genuine deltas, not copy-paste)
1. **Language + libraries: resolved.** The frontend is pure JavaScript (`.js`, JSX-in-`.js`, no types) and uses only libraries present in Talpix (`react-icons`, `bootstrap`) — it drops straight into Talpix's CRA environment. (Locally it runs on Vite 7 with a jsx loader; Vite is not migrated — Talpix builds with `react-scripts`.)
2. **Hook signatures differ.** Talpix `useAPIFetch(apiUrl, data, deps, thenFunc)` returns `[data, loading, refresh, clear, setResData]` and pulls `user` from `userContext`; ours is `useAPIFetch(url, defaultData, deps)` → `[data, loading, refresh]`. Either keep the scheduler-scoped hooks or rewire `CoursesStore` (its only consumer) to Talpix's signature.
3. **Persistence.** `DegreeContext` persists to `localStorage` (`degree-planner-state`). In production this can stay (per-device) or be swapped for the `SavedSchedule` document (`ReferenceField(User)`) via `useAPIAction` — the reducer shape already matches the document fields.
4. **Endpoint tests** use FastAPI `TestClient` — rewrite to Django `APIClient`. Repository/serializer/model tests port directly.

---

## 4. Build / verify after stitching
- Backend: `pytest services/backend/tests/scheduler_tests` (repository/serializer/model specs).
- Frontend: typecheck/lint per Talpix toolchain; `e2e-tests` Playwright suite against the `/scheduler/planner` route.
- Local sanity in this repo before merge: `pwsh scripts/run.ps1` (tsc + pytest), `pwsh scripts/run.ps1 -Dev` (full stack).
