"""Repository layer tests — the JSON-backed Mongo stand-in + identity adapter."""
from __future__ import annotations

from web_features.scheduler import repository


def test_all_courses_returns_real_dataset():
    courses = repository.all_courses()
    assert isinstance(courses, list)
    assert len(courses) > 0
    # Real shnaton documents are keyed by course_number, not a synthetic id.
    assert "course_number" in courses[0]
    assert "id" not in courses[0]


def test_identity_adapter_matches_course_number():
    sample = repository.all_courses()[0]
    number = sample["course_number"]
    found = repository.get_course(number)
    assert found is not None
    assert found["course_number"] == number


def test_identity_adapter_normalizes_input():
    number = repository.all_courses()[0]["course_number"]
    # Whitespace / non-str input must still resolve to the same document.
    assert repository.get_course(f"  {number} ")["course_number"] == number


def test_get_course_missing_returns_none():
    assert repository.get_course("__does_not_exist__") is None
    assert repository.course_exists("__does_not_exist__") is False


def test_filter_courses_by_faculty_code():
    cs = repository.filter_courses(faculty_code="012")
    assert len(cs) > 0
    assert all(c["faculty_code"] == "012" for c in cs)


def test_plans_and_tracks():
    tracks = repository.list_track_ids()
    assert set(tracks) >= {"cs", "math", "physics"}
    cs_plan = repository.get_plan("cs")
    assert cs_plan is not None and len(cs_plan) > 0
    # Plan entries reference real course_numbers.
    numbers = {c["course_number"] for c in repository.all_courses()}
    assert all(entry["course_number"] in numbers for entry in cs_plan)
    assert repository.get_plan("nope") is None


def test_initial_placed_references_real_courses():
    placed = repository.all_placed()
    assert len(placed) > 0
    numbers = {c["course_number"] for c in repository.all_courses()}
    assert all(p["course_number"] in numbers for p in placed)
