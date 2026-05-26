# Target System Layout (Talpix Integration Spec)

This file serves as the strict architectural blueprint for refactoring the Scheduler codebase. All code structural changes, file movements, and simulated backend splits must align with these target constraints so it can eventually be integrated cleanly into Talpix.

## 1. Frontend Structural Layout
In Talpix, the frontend sits under `services/frontend/src/` and follows a flat, modular directory pattern. We must mirror this organization:
- Shared components must align with a flat tree style: `services/frontend/src/components/` (e.g., standard buttons, grid cards, text inputs).
- Main views and feature clusters align with: `services/frontend/src/pages/`
- App global states or context tracking map structurally to: `services/frontend/src/stores/` or `contexts/`

## 2. Simulated Backend Layer
Talpix handles its backend feature services under a modular Python tree schema:
- Base path: `services/backend/web_features/`
- Scheduler features will be organized as a mock Python feature sub-module here.

## 3. Immediate Execution Goals
- Restructure Scheduler into distinct local `frontend/` and `backend/` sub-directories.
- Re-route current hardcoded static course/plan data objects out of the UI files and into a simple local mock Python file inside the new `backend/` folder. This service should return the data via a mock API layer as if it were reading from a live backend database.
- Keep the local application 100% autonomous and runnable on localhost so the MVP can be validated standalone before any integration happens.