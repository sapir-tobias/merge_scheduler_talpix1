"""MongoEngine schemas for the Scheduler feature.

These are the production documents that the Scheduler drops into when it runs
against the live Talpix Mongo cluster. Field names mirror the university
``shnaton`` payload exactly (``course_number``, ``name_he``, ``groups``,
``test_dates`` …) so that the same dictionaries flow through the repository,
serializers and views whether they originate from a JSON fixture (local dev)
or a ``Course.objects`` query (production) — no view rewrites required.

Identity primary key is ``course_number`` (the real shnaton key), not a
synthetic ``id``. See ``web_features.scheduler.repository`` for the adapter
that maps incoming ``course_id`` lookups onto this field locally.

Nothing in the local FastAPI runtime imports this module — it is exercised
only when wired to Mongo. ``mongoengine`` is therefore an optional install
(see ``requirements.txt``); the JSON repository keeps localhost running
without a database.
"""
from __future__ import annotations

from mongoengine import (
    BooleanField,
    Document,
    EmbeddedDocument,
    EmbeddedDocumentListField,
    FloatField,
    IntField,
    ListField,
    StringField,
)


class ScheduleMeeting(EmbeddedDocument):
    """A single weekly meeting of a group (``groups[].schedule[]``)."""

    day = StringField()        # Hebrew weekday, e.g. "ראשון"
    hours = StringField()      # "11:00-13:45"
    location = StringField()
    semester = StringField()   # "סמסטר א'"


class CourseGroup(EmbeddedDocument):
    """A registration group (``groups[]``): lecture / recitation / lab …"""

    group_id = StringField()
    lesson_type = StringField()                  # "שעור", "תרגיל", "מעבדה" …
    lecturers = ListField(StringField())
    schedule = EmbeddedDocumentListField(ScheduleMeeting)


class TestDate(EmbeddedDocument):
    """A normalized exam sitting (``test_dates[]``)."""

    start = StringField()      # ISO datetime
    end = StringField()
    moed = IntField()          # 1 / 2 / 3
    period = IntField()
    period_name = StringField()
    rooms = StringField()


class PrerequisiteRef(EmbeddedDocument):
    """A resolved prerequisite course (``prerequisites[]``)."""

    course_number = StringField()
    name_he = StringField()
    name_en = StringField()
    credits = FloatField()
    dept_code = StringField()
    department = StringField()
    semester = StringField()
    resolved = BooleanField(default=False)
    min_grade = IntField()


class Course(Document):
    """Document (collection: ``courses``) — the shnaton course record.

    ``course_number`` is the primary key, matching the real upstream payload.
    """

    course_number = StringField(primary_key=True)
    name_he = StringField(required=True)
    name_en = StringField()
    department = StringField()
    department_en = StringField()
    faculty_code = StringField()
    faculty_name = StringField()
    faculty_name_en = StringField()
    dept_code = StringField()
    credits = FloatField()
    hours_per_week = FloatField()
    semester = StringField()           # "סמסטר א" / "סמסטר ב" / "שנתי" …
    language = StringField()
    held_this_year = BooleanField(default=True)
    course_type = StringField()
    has_exam = BooleanField(default=False)
    exam_info = StringField()
    exam_duration_hours = FloatField()
    exam_dates = ListField(StringField())
    remark = StringField()
    test_dates = EmbeddedDocumentListField(TestDate)
    syllabus_url_he = StringField()
    syllabus_url_en = StringField()
    moodle_url = StringField()
    groups = EmbeddedDocumentListField(CourseGroup)
    num_groups = IntField(default=0)
    prerequisites = EmbeddedDocumentListField(PrerequisiteRef)
    required_by = ListField(StringField())

    meta = {"collection": "courses"}

    def __str__(self) -> str:
        return f"{self.course_number} {self.name_he}"


class PlacedCourse(Document):
    """A course a student has placed into a semester (collection: ``scheduler_placed``)."""

    course_number = StringField(required=True)   # ReferenceField(Course) in spirit
    semester_id = IntField(required=True)         # 1..6
    lecture_option_id = StringField()             # CourseGroup.group_id
    recitation_option_id = StringField()
    locked = BooleanField(default=False)

    meta = {"collection": "scheduler_placed"}

    def __str__(self) -> str:
        return f"{self.course_number}@sem{self.semester_id}"


class PlanEntry(EmbeddedDocument):
    """One line of a default-degree track."""

    course_number = StringField(required=True)
    semester_id = IntField(required=True)
    lecture_option_id = StringField()
    recitation_option_id = StringField()


class PlanTrack(Document):
    """A default 6-semester track (collection: ``scheduler_plans``)."""

    track_id = StringField(primary_key=True)      # "cs" / "math" / "physics"
    entries = EmbeddedDocumentListField(PlanEntry)

    meta = {"collection": "scheduler_plans"}

    def __str__(self) -> str:
        return f"track:{self.track_id} ({len(self.entries)} entries)"
