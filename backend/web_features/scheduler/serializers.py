"""Projection layer: shnaton documents -> frontend wire shape.

The repository returns raw course documents whose keys match the real
university payload (``course_number``, ``name_he``, ``groups`` …). The React
client, however, consumes the stable ``Course`` contract defined in
``frontend/src/types`` (``id``, ``name``, ``faculty``, ``lectureOptions`` …).

These pure functions bridge the two. Because the projection only depends on
the document shape — not on where the document came from — it is identical for
JSON fixtures and live Mongo, so the views never change when the data source
is swapped.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

# Hebrew weekday -> the 5 schedulable day keys the grid understands.
# Friday/Saturday have no column in the weekly grid and are dropped.
_DAY_MAP = {
    "ראשון": "sun",
    "שני": "mon",
    "שלישי": "tue",
    "רביעי": "wed",
    "חמישי": "thu",
}

# A pure recitation group; everything else (שעור, מעבדה, סדנה, combined …) is
# treated as a lecture-style block for scheduling purposes.
_RECITATION_TYPES = {"תרגיל"}

# Hebrew semester term -> normalized key the UI can label/filter on.
_TERM_MAP = {
    "סמסטר א": "a",
    "סמסטר ב": "b",
    "סמסטר א או ב": "either",
    "שנתי": "yearly",
    "סמסטר קיץ": "summer",
}

# Course types that carry mandatory attendance (נוכחות חובה): labs, seminars,
# workshops and guided sessions. The shnaton payload has no explicit flag, so
# it is derived from ``course_type`` (single source of truth).
_ATTENDANCE_TYPES = ("מעבדה", "סמינריון", "סדנה", "הדרכה")


def _faculty(course: Dict[str, Any]) -> str:
    """Map (faculty_code, department) -> the frontend faculty palette key."""
    code = (course.get("faculty_code") or "").strip()
    dept = (course.get("department") or "").strip()
    if code == "012":
        return "cs"
    if code == "002":
        if "פיסיקה" in dept:
            return "physics"
        if "מתמטיקה" in dept:
            return "math"
        return "misc"  # e.g. "תכנית תלפיות"
    return "misc"


def _parse_hours(hours: Optional[str]) -> Optional[tuple[float, float]]:
    """'11:00-13:45' -> (11.0, 13.75). Returns None if unparseable."""
    if not hours or "-" not in hours:
        return None
    start_s, _, end_s = hours.partition("-")

    def to_float(token: str) -> Optional[float]:
        token = token.strip()
        if ":" not in token:
            return None
        h, _, m = token.partition(":")
        try:
            return int(h) + int(m) / 60.0
        except ValueError:
            return None

    start, end = to_float(start_s), to_float(end_s)
    if start is None or end is None or end <= start:
        return None
    return start, end


def _slots_for_group(group: Dict[str, Any]) -> List[Dict[str, Any]]:
    slots: List[Dict[str, Any]] = []
    for meeting in group.get("schedule") or []:
        day = _DAY_MAP.get((meeting.get("day") or "").strip())
        parsed = _parse_hours(meeting.get("hours"))
        if day is None or parsed is None:
            continue
        start, end = parsed
        slots.append({"day": day, "startHour": start, "endHour": end})
    return slots


def _options(course: Dict[str, Any]) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Split ``groups`` into (lectureOptions, recitationOptions)."""
    lectures: List[Dict[str, Any]] = []
    recitations: List[Dict[str, Any]] = []
    for group in course.get("groups") or []:
        slots = _slots_for_group(group)
        if not slots:
            continue
        option = {"id": group.get("group_id"), "slots": slots}
        if (group.get("lesson_type") or "").strip() in _RECITATION_TYPES:
            recitations.append(option)
        else:
            lectures.append(option)
    return lectures, recitations


def _exam_date(course: Dict[str, Any]) -> str:
    """First exam date as 'YYYY-MM-DD' (moed-1 preferred), or '' if no exam.

    The frontend calendar expects a date-only string, so the time component of
    the ISO datetime is dropped. Courses with no exam yield '' — callers must
    tolerate that, since many real courses have no final.
    """
    test_dates = course.get("test_dates") or []
    raw = ""
    for td in test_dates:
        if td.get("moed") == 1 and td.get("start"):
            raw = td["start"]
            break
    if not raw and test_dates and test_dates[0].get("start"):
        raw = test_dates[0]["start"]
    if not raw:
        exam_dates = course.get("exam_dates") or []
        raw = exam_dates[0] if exam_dates else ""
    return raw.split("T")[0] if raw else ""


def _term(course: Dict[str, Any]) -> str:
    """Normalized semester term: 'a' | 'b' | 'either' | 'yearly' | 'summer' | ''."""
    return _TERM_MAP.get((course.get("semester") or "").strip(), "")


def _mandatory_attendance(course: Dict[str, Any]) -> bool:
    course_type = course.get("course_type") or ""
    return any(t in course_type for t in _ATTENDANCE_TYPES)


def serialize_course(course: Dict[str, Any]) -> Dict[str, Any]:
    """A shnaton course document -> the frontend ``Course`` shape."""
    lectures, recitations = _options(course)
    credits = course.get("credits")
    exam_date = _exam_date(course)
    return {
        "id": str(course.get("course_number")),
        "code": str(course.get("course_number")),
        "name": course.get("name_he") or course.get("name_en") or "",
        "nameEn": course.get("name_en") or "",
        "faculty": _faculty(course),
        "credits": credits if isinstance(credits, (int, float)) else 0,
        "term": _term(course),
        "lectureOptions": lectures,
        "recitationOptions": recitations,
        "examDate": exam_date,
        "hasExam": bool(course.get("has_exam")) and bool(exam_date),
        "mandatoryAttendance": _mandatory_attendance(course),
        "prerequisites": [
            str(p.get("course_number"))
            for p in (course.get("prerequisites") or [])
            if p.get("course_number")
        ],
        # course_number -> Hebrew name, so the UI can label a prerequisite even
        # when that course is not itself in the catalogue (avoids bare-ID dead-ends).
        "prerequisiteNames": {
            str(p["course_number"]): (p.get("name_he") or p.get("name_en") or "")
            for p in (course.get("prerequisites") or [])
            if p.get("course_number") and (p.get("name_he") or p.get("name_en"))
        },
        "description": course.get("name_en") or course.get("remark") or "",
    }


def serialize_placed(placed: Dict[str, Any]) -> Dict[str, Any]:
    """A placement document (real keys) -> the frontend ``PlacedCourse`` shape."""
    return {
        "courseId": str(placed.get("course_number")),
        "semesterId": placed.get("semester_id"),
        "lectureOptionId": placed.get("lecture_option_id"),
        "recitationOptionId": placed.get("recitation_option_id"),
        "locked": bool(placed.get("locked", False)),
    }


def serialize_plan_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    """A plan-track entry (real keys) -> frontend shape (no ``locked``)."""
    return {
        "courseId": str(entry.get("course_number")),
        "semesterId": entry.get("semester_id"),
        "lectureOptionId": entry.get("lecture_option_id"),
        "recitationOptionId": entry.get("recitation_option_id"),
    }
