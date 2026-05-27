"""Database abstraction layer for the Scheduler feature.

The view controllers talk to this module as if it were a live Mongo cluster:
``all_courses()`` stands in for ``Course.objects.all()``, ``get_course(num)``
for ``Course.objects(course_number=num).first()`` and so on. Locally the data
is parsed from JSON fixtures on disk; swapping these function bodies for real
``mongoengine`` queries (see ``apps.TalpiotAPIs.Scheduler.models``) is a
drop-in change that leaves every call site untouched.

IDENTITY KEY ADAPTER
--------------------
The real university payload identifies a course by ``course_number`` (e.g.
``"77693"``), not by a synthetic ``id``. Every lookup that arrives as a
generic ``course_id`` is normalized and matched against ``course_number`` here,
so callers never have to know the underlying primary-key name.
"""
from __future__ import annotations

import json
import threading
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from apps.settings import load_settings

# Resolve the data directory + mock flag through the unified settings chain
# (env -> secret_settings.json -> settings.json) rather than hardcoding paths.
# ``scheduler_use_mock`` is the switch a production deploy flips to route these
# functions at the live Mongo cluster instead of the JSON fixtures.
_settings = load_settings()
_BACKEND_ROOT = Path(__file__).resolve().parents[2]  # …/backend
DATA_DIR = (_BACKEND_ROOT / _settings.get("scheduler_data_dir", "web_features/scheduler/data")).resolve()
USE_MOCK = bool(_settings.get("scheduler_use_mock", True))

COURSES_FILE = DATA_DIR / "courses.json"
INITIAL_PLACED_FILE = DATA_DIR / "initial_placed.json"
PLANS_FILE = DATA_DIR / "plans.json"

#: The real shnaton primary key. Centralized so a production swap to Mongo only
#: has to change query construction, not the call sites.
IDENTITY_KEY = "course_number"

_write_lock = threading.Lock()


# ──────────────────────────────────────────────────────────────────────────
# Loading (cached — mirrors a warm connection pool)
# ──────────────────────────────────────────────────────────────────────────
@lru_cache(maxsize=1)
def _load_courses() -> List[Dict[str, Any]]:
    return json.loads(COURSES_FILE.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def _load_initial_placed() -> List[Dict[str, Any]]:
    return json.loads(INITIAL_PLACED_FILE.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def _load_plans() -> Dict[str, List[Dict[str, Any]]]:
    return json.loads(PLANS_FILE.read_text(encoding="utf-8"))


def _invalidate_caches() -> None:
    """Drop cached datasets after a write (mirrors cache eviction)."""
    _load_courses.cache_clear()
    _load_initial_placed.cache_clear()
    _load_plans.cache_clear()


def _normalize_id(course_id: Any) -> str:
    """Coerce an incoming identifier to the canonical ``course_number`` string."""
    return str(course_id).strip()


def _atomic_write(path: Path, payload: Any) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


# ──────────────────────────────────────────────────────────────────────────
# Course queries  (Course.objects … )
# ──────────────────────────────────────────────────────────────────────────
def all_courses() -> List[Dict[str, Any]]:
    """Course.objects.all()."""
    return list(_load_courses())


def get_course(course_id: Any) -> Optional[Dict[str, Any]]:
    """Course.objects(course_number=course_id).first() — via the identity adapter."""
    target = _normalize_id(course_id)
    for course in _load_courses():
        if _normalize_id(course.get(IDENTITY_KEY)) == target:
            return course
    return None


def filter_courses(**criteria: Any) -> List[Dict[str, Any]]:
    """Course.objects(**criteria) — flat field-equality filter."""
    if not criteria:
        return all_courses()
    out: List[Dict[str, Any]] = []
    for course in _load_courses():
        if all(course.get(field) == value for field, value in criteria.items()):
            out.append(course)
    return out


def course_exists(course_id: Any) -> bool:
    return get_course(course_id) is not None


def upsert_course(course: Dict[str, Any]) -> Dict[str, Any]:
    """Course(**course).save() — insert or replace by ``course_number``."""
    key = _normalize_id(course.get(IDENTITY_KEY))
    if not key:
        raise ValueError(f"course is missing identity key '{IDENTITY_KEY}'")
    with _write_lock:
        courses = list(_load_courses())
        for i, existing in enumerate(courses):
            if _normalize_id(existing.get(IDENTITY_KEY)) == key:
                courses[i] = course
                break
        else:
            courses.append(course)
        _atomic_write(COURSES_FILE, courses)
        _invalidate_caches()
    return course


# ──────────────────────────────────────────────────────────────────────────
# Placement queries  (PlacedCourse.objects … )
# ──────────────────────────────────────────────────────────────────────────
def all_placed() -> List[Dict[str, Any]]:
    """PlacedCourse.objects.all() — the canonical starter placement."""
    return list(_load_initial_placed())


def save_placed(placed: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Replace the stored placement set (bulk upsert)."""
    if not isinstance(placed, list):
        raise ValueError("placed must be a list of placement entries")
    with _write_lock:
        _atomic_write(INITIAL_PLACED_FILE, placed)
        _invalidate_caches()
    return placed


# ──────────────────────────────────────────────────────────────────────────
# Plan queries  (PlanTrack.objects … )
# ──────────────────────────────────────────────────────────────────────────
def list_track_ids() -> List[str]:
    """[t.track_id for t in PlanTrack.objects]."""
    return list(_load_plans().keys())


def get_plan(track_id: str) -> Optional[List[Dict[str, Any]]]:
    """PlanTrack.objects(track_id=track_id).first().entries."""
    plans = _load_plans()
    key = _normalize_id(track_id)
    return list(plans[key]) if key in plans else None
