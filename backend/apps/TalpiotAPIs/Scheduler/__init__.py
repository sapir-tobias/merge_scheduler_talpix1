"""Scheduler MongoEngine documents (production drop-in schema).

Imported lazily — only when the feature is wired to a live Mongo cluster.
Guarded so that a dev environment without ``mongoengine`` installed can still
import the package without raising.
"""
from __future__ import annotations

try:  # pragma: no cover - exercised only in production w/ mongoengine present
    from .models import (
        Course,
        CourseGroup,
        PlacedCourse,
        PlanEntry,
        PlanTrack,
        PrerequisiteRef,
        SavedBlocker,
        SavedSchedule,
        ScheduleMeeting,
        TestDate,
    )

    __all__ = [
        "Course",
        "CourseGroup",
        "PlacedCourse",
        "PlanEntry",
        "PlanTrack",
        "PrerequisiteRef",
        "SavedBlocker",
        "SavedSchedule",
        "ScheduleMeeting",
        "TestDate",
    ]
except ModuleNotFoundError:  # mongoengine not installed locally
    __all__ = []
