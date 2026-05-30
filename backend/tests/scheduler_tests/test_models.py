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


def test_from_shnaton_dict_round_trips_a_real_course():
    """The shared ingest path: a raw shnaton dict in -> a valid Course out
    (writer branch's one-liner). Validates that every typed list-of-dicts is
    correctly wrapped into its EmbeddedDocument."""
    import json
    from pathlib import Path
    data = json.loads(
        (Path(__file__).resolve().parents[2] / "web_features/scheduler/data/courses.json")
        .read_text(encoding="utf-8")
    )
    doc = next(c for c in data if c.get("groups") and c.get("test_dates") and c.get("prerequisites"))
    course = Course.from_shnaton_dict(doc)
    course.validate()
    assert course.course_number == doc["course_number"]
    assert course.groups[0].group_id == doc["groups"][0]["group_id"]
    assert course.groups[0].schedule[0].day == doc["groups"][0]["schedule"][0]["day"]
    assert course.test_dates[0].moed == doc["test_dates"][0]["moed"]
    assert course.prerequisites[0].course_number == doc["prerequisites"][0]["course_number"]
    # free-form passthrough fields preserve the raw JSON shape
    assert course.prerequisites_tree == doc.get("prerequisites_tree")
    assert course.assignments == doc.get("assignments")


def test_course_covers_every_shnaton_key():
    """The model schema must be 1:1 with the raw shnaton JSON — any drift
    means the writer branch silently drops data or the reader misses a field."""
    import json
    from pathlib import Path
    data = json.loads(
        (Path(__file__).resolve().parents[2] / "web_features/scheduler/data/courses.json")
        .read_text(encoding="utf-8")
    )
    json_keys = set()
    for course in data:
        json_keys |= set(course.keys())
    assert json_keys == set(Course._fields.keys())


def test_other_documents_bind_collections():
    assert PlacedCourse._meta["collection"] == "scheduler_placed"
    assert PlanTrack._meta["collection"] == "scheduler_plans"
    assert PlanTrack._fields["track_id"].primary_key is True


def test_saved_schedule_references_user():
    assert SavedSchedule._meta["collection"] == "scheduler_saved_schedules"
    student = SavedSchedule._fields["student"]
    assert student.__class__.__name__ == "ReferenceField"
    assert student.required is True
