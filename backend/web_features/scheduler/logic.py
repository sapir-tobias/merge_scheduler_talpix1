"""Business logic for the Scheduler feature.

In a real Talpix deployment these functions would issue MongoEngine queries
against the live collections. Here they read from JSON files on disk to
simulate the same shape: "load -> filter -> return list of documents".
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

DATA_DIR = Path(__file__).resolve().parent / "data"


@lru_cache(maxsize=1)
def _load_courses() -> List[Dict[str, Any]]:
    return json.loads((DATA_DIR / "courses.json").read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def _load_initial_placed() -> List[Dict[str, Any]]:
    return json.loads((DATA_DIR / "initial_placed.json").read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def _load_plans() -> Dict[str, List[Dict[str, Any]]]:
    return json.loads((DATA_DIR / "plans.json").read_text(encoding="utf-8"))


def fetch_all_courses() -> List[Dict[str, Any]]:
    """Equivalent to Course.objects.all()."""
    return list(_load_courses())


def fetch_course_by_id(course_id: str) -> Optional[Dict[str, Any]]:
    """Equivalent to Course.objects(id=course_id).first()."""
    for c in _load_courses():
        if c["id"] == course_id:
            return c
    return None


def fetch_initial_placed() -> List[Dict[str, Any]]:
    """Returns the canonical starter placement (16-course demo plan)."""
    return list(_load_initial_placed())


def fetch_plan(track_id: str) -> Optional[List[Dict[str, Any]]]:
    """Returns the default 6-semester plan for a track, or None if unknown."""
    plans = _load_plans()
    return list(plans[track_id]) if track_id in plans else None


def list_track_ids() -> List[str]:
    return list(_load_plans().keys())
