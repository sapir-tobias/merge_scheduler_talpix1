"""FastAPI entry point for the mock Talpix backend.

Mirrors Talpix's modular layout: features live under web_features/<name>/
and each one exposes an APIRouter via urls_scheduler.py that this module mounts.
"""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from web_features.scheduler.urls_scheduler import router as scheduler_router

# Scoped JSON log lines (Grafana LogQL friendly). Real Talpix configures this
# centrally in settings; here we keep a minimal stream handler so the
# feature's `logger.info(json...)` calls are visible during local dev.
logging.basicConfig(level=logging.INFO, format="%(name)s %(message)s")

app = FastAPI(title="Talpix Mock Backend (Scheduler)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scheduler_router)


@app.get("/health")
def health():
    return {"status": "ok"}
