# Degree Planner — Talpix Integration MVP

Local-only full-stack scaffold preparing the Scheduler for integration with Talpix.

```
.
├── frontend/                       Vite + React + TS (Talpix `services/frontend` shape)
│   └── src/
│       ├── components/             flat shared UI
│       ├── pages/                  feature views (DegreePlanPage, SemesterPage)
│       ├── stores/                 React Context state (CoursesStore, DegreeContext)
│       ├── hooks/                  useAPIFetch, useAPIAction (Talpix-standard)
│       ├── lib/                    pure helpers (scoring, cn)
│       ├── types/                  shared TS types
│       └── _archive/               legacy scaffolds (not built)
└── backend/                        FastAPI mock of Talpix `services/backend`
    ├── main.py                     app entry, CORS, router mount
    ├── requirements.txt
    ├── _seed_from_ts.py            one-shot converter: legacy TS data → JSON
    └── web_features/
        └── scheduler/              one Talpix-style feature module
            ├── urls.py             APIRouter (Django-DRF-style decorators)
            ├── logic.py            "DB" queries (reads from data/ JSON)
            ├── models.py           pydantic models simulating Mongo Documents
            ├── decorators.py       @api_view / @authentication_classes / @permission_classes mocks + JsonResponse
            └── data/               courses.json / plans.json / initial_placed.json
```

## First-time setup

```bash
npm install
npm --prefix frontend install
pip install -r backend/requirements.txt
```

## Run

```bash
npm run dev
```

That spawns both services concurrently:

- Frontend: http://localhost:5173 (Vite proxies `/api/*` to the backend)
- Backend: http://localhost:8000 (OpenAPI docs at http://localhost:8000/docs)

## Endpoints

| Method | Path                              | Purpose                                |
|--------|-----------------------------------|----------------------------------------|
| GET    | `/api/scheduler/courses`          | All Course documents                   |
| GET    | `/api/scheduler/courses/{id}`     | Single Course                          |
| GET    | `/api/scheduler/initial-placed`   | Starter 16-course placement            |
| GET    | `/api/scheduler/plans`            | Available track ids                    |
| GET    | `/api/scheduler/plans/{track}`    | A track's 6-semester default plan      |
| GET    | `/health`                         | Liveness probe                         |

## Re-seeding mock data

The JSON under `backend/web_features/scheduler/data/` was generated from the
original `frontend/src/data/*.ts` files (now in `_archive/`). To regenerate:

```bash
npm run seed
```
