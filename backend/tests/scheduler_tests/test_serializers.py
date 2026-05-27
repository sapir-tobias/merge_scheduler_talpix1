"""Serializer tests — shnaton document -> frontend wire shape projection."""
from __future__ import annotations

from web_features.scheduler import repository, serializers

WIRE_KEYS = {
    "id",
    "code",
    "name",
    "nameEn",
    "faculty",
    "credits",
    "term",
    "lectureOptions",
    "recitationOptions",
    "examDate",
    "hasExam",
    "mandatoryAttendance",
    "prerequisites",
    "description",
}


def test_serialize_course_shape_matches_frontend_contract():
    course = repository.all_courses()[0]
    wire = serializers.serialize_course(course)
    assert set(wire.keys()) == WIRE_KEYS
    assert wire["id"] == str(course["course_number"])
    assert wire["faculty"] in {"cs", "math", "physics", "misc"}
    assert isinstance(wire["credits"], (int, float))
    assert isinstance(wire["lectureOptions"], list)
    assert wire["term"] in {"a", "b", "either", "yearly", "summer", ""}
    assert isinstance(wire["hasExam"], bool)
    assert isinstance(wire["mandatoryAttendance"], bool)


def test_term_mapping():
    assert serializers._term({"semester": "סמסטר א"}) == "a"
    assert serializers._term({"semester": "סמסטר ב"}) == "b"
    assert serializers._term({"semester": "סמסטר א או ב"}) == "either"
    assert serializers._term({"semester": "שנתי"}) == "yearly"
    assert serializers._term({"semester": "סמסטר קיץ"}) == "summer"
    assert serializers._term({}) == ""


def test_mandatory_attendance_derived_from_course_type():
    assert serializers._mandatory_attendance({"course_type": "מעבדה"}) is True
    assert serializers._mandatory_attendance({"course_type": "סמינריון"}) is True
    assert serializers._mandatory_attendance({"course_type": "שעור ומעבדה מפוצל"}) is True
    assert serializers._mandatory_attendance({"course_type": "שעור"}) is False
    assert serializers._mandatory_attendance({}) is False


def test_has_exam_requires_date():
    with_exam = {"course_number": "1", "name_he": "x", "groups": [],
                 "has_exam": True, "test_dates": [{"moed": 1, "start": "2026-01-28T09:00:00"}]}
    no_date = {"course_number": "2", "name_he": "y", "groups": [], "has_exam": True, "test_dates": []}
    assert serializers.serialize_course(with_exam)["hasExam"] is True
    assert serializers.serialize_course(no_date)["hasExam"] is False


def test_faculty_mapping():
    assert serializers._faculty({"faculty_code": "012"}) == "cs"
    assert serializers._faculty({"faculty_code": "002", "department": "פיסיקה"}) == "physics"
    assert serializers._faculty({"faculty_code": "002", "department": "מתמטיקה"}) == "math"
    assert serializers._faculty({"faculty_code": "002", "department": "תכנית תלפיות"}) == "misc"
    assert serializers._faculty({}) == "misc"


def test_hours_parsing():
    assert serializers._parse_hours("11:00-13:45") == (11.0, 13.75)
    assert serializers._parse_hours("08:00-09:45") == (8.0, 9.75)
    assert serializers._parse_hours("garbage") is None
    assert serializers._parse_hours("13:00-12:00") is None  # end <= start


def test_groups_split_into_lecture_and_recitation():
    course = {
        "course_number": "1",
        "name_he": "x",
        "groups": [
            {"group_id": "L1", "lesson_type": "שעור",
             "schedule": [{"day": "ראשון", "hours": "10:00-11:45"}]},
            {"group_id": "T1", "lesson_type": "תרגיל",
             "schedule": [{"day": "שני", "hours": "12:00-13:45"}]},
            {"group_id": "X", "lesson_type": "שעור",
             "schedule": [{"day": "שישי", "hours": "10:00-11:45"}]},  # Friday -> dropped
        ],
    }
    wire = serializers.serialize_course(course)
    assert [o["id"] for o in wire["lectureOptions"]] == ["L1"]
    assert [o["id"] for o in wire["recitationOptions"]] == ["T1"]
    assert wire["lectureOptions"][0]["slots"][0] == {"day": "sun", "startHour": 10.0, "endHour": 11.75}


def test_exam_date_prefers_moed_1():
    course = {
        "course_number": "1", "name_he": "x", "groups": [],
        "test_dates": [
            {"moed": 2, "start": "2026-04-30T16:00:00"},
            {"moed": 1, "start": "2026-01-28T09:00:00"},
        ],
    }
    # date-only projection (calendar expects YYYY-MM-DD, no time component)
    assert serializers.serialize_course(course)["examDate"] == "2026-01-28"


def test_exam_date_empty_when_no_exam():
    # Many real courses have no final; examDate must be "" (not an invalid date).
    course = {"course_number": "1", "name_he": "x", "groups": [], "test_dates": [], "exam_dates": []}
    assert serializers.serialize_course(course)["examDate"] == ""


def test_serialize_placed_and_plan_entry():
    placed = serializers.serialize_placed(
        {"course_number": "77693", "semester_id": 1, "lecture_option_id": "3-01",
         "recitation_option_id": None, "locked": True}
    )
    assert placed == {
        "courseId": "77693", "semesterId": 1, "lectureOptionId": "3-01",
        "recitationOptionId": None, "locked": True,
    }
    entry = serializers.serialize_plan_entry(
        {"course_number": "77693", "semester_id": 2, "lecture_option_id": "3-01",
         "recitation_option_id": "r1"}
    )
    assert entry == {
        "courseId": "77693", "semesterId": 2,
        "lectureOptionId": "3-01", "recitationOptionId": "r1",
    }
