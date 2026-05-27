"""Production MongoEngine schema tests (skipped if mongoengine is absent).

Asserts the drop-in documents key on the real ``course_number`` and bind to the
expected collections — no DB connection required, just class introspection.
"""
from __future__ import annotations

import pytest

pytest.importorskip("mongoengine")

from apps.TalpiotAPIs.Scheduler.models import (  # noqa: E402
    Course,
    PlacedCourse,
    PlanTrack,
    SavedSchedule,
)


def test_course_collection_and_primary_key():
    assert Course._meta["collection"] == "courses"
    assert Course._fields["course_number"].primary_key is True


def test_course_has_real_schema_fields():
    for field in ("name_he", "faculty_code", "credits", "groups", "test_dates", "prerequisites"):
        assert field in Course._fields


def test_other_documents_bind_collections():
    assert PlacedCourse._meta["collection"] == "scheduler_placed"
    assert PlanTrack._meta["collection"] == "scheduler_plans"
    assert PlanTrack._fields["track_id"].primary_key is True


def test_saved_schedule_references_user():
    assert SavedSchedule._meta["collection"] == "scheduler_saved_schedules"
    student = SavedSchedule._fields["student"]
    assert student.__class__.__name__ == "ReferenceField"
    assert student.required is True
