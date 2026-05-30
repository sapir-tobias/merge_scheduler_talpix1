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
    DateTimeField,
    DictField,
    Document,
    EmbeddedDocument,
    EmbeddedDocumentListField,
    FloatField,
    IntField,
    ListField,
    ReferenceField,
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


class AssignmentSummary(EmbeddedDocument):
    """One row of ``assignments_summary[]`` — the flat assessment overview
    (``test_dates`` is the exam-only flattening of the same data)."""

    name = StringField()        # "מבחן מסכם", "תרגיל בית"…
    type = StringField()        # "מבחן", "עבודה"…
    weight = FloatField()       # percentage
    period = StringField()      # "סמסטר א'"…
    is_master = BooleanField(default=False)


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
    # Full raw assessment payload from the upstream API. Deeply nested
    # (assignments[].schedules[].rooms[].building.campus) — stored verbatim
    # as free-form dicts so the JSON ingest is a 1:1 passthrough; the typed
    # ``test_dates`` + ``assignments_summary`` views are what the app reads.
    assignments = ListField(DictField())
    assignments_summary = EmbeddedDocumentListField(AssignmentSummary)
    test_dates = EmbeddedDocumentListField(TestDate)
    syllabus_url_he = StringField()
    syllabus_url_en = StringField()
    moodle_url = StringField()
    groups = EmbeddedDocumentListField(CourseGroup)
    num_groups = IntField(default=0)
    prerequisites_source = StringField()            # provenance, e.g. "api"
    # Recursive AND/OR/COURSE DAG: {type, children?, courseCode?, courseName?, minGrade?}.
    # Free-form dict (MongoEngine has no native recursive embedded type).
    prerequisites_tree = DictField()
    prerequisites = EmbeddedDocumentListField(PrerequisiteRef)
    required_by = ListField(StringField())

    meta = {"collection": "courses"}

    # Fields whose JSON value is a list of dicts that must be wrapped in their
    # EmbeddedDocument types; everything else accepts the JSON value verbatim.
    _EMBEDDED_LIST_FIELDS = ("groups", "test_dates", "prerequisites", "assignments_summary")

    @classmethod
    def from_shnaton_dict(cls, doc):
        """Build a Course from a raw shnaton JSON dict (the canonical ingest path).

        The writer branch calls ``Course.from_shnaton_dict(doc).save()``. The
        reader branch never needs this — Mongo round-trips return Course
        instances directly. Returns an unsaved instance so callers can mutate
        or attach extra fields before persisting.
        """
        scalars = {k: v for k, v in doc.items() if k not in cls._EMBEDDED_LIST_FIELDS}
        return cls(
            **scalars,
            groups=[
                CourseGroup(
                    **{k: v for k, v in g.items() if k != "schedule"},
                    schedule=[ScheduleMeeting(**m) for m in (g.get("schedule") or [])],
                )
                for g in (doc.get("groups") or [])
            ],
            test_dates=[TestDate(**t) for t in (doc.get("test_dates") or [])],
            prerequisites=[PrerequisiteRef(**p) for p in (doc.get("prerequisites") or [])],
            assignments_summary=[
                AssignmentSummary(**a) for a in (doc.get("assignments_summary") or [])
            ],
        )

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


class SavedBlocker(EmbeddedDocument):
    """A personal unavailable time block on a saved schedule."""

    label = StringField()
    day = StringField()          # sun..thu
    start_hour = FloatField()
    end_hour = FloatField()
    semester_id = IntField()


class SavedSchedule(Document):
    """A student's saved board (collection: ``scheduler_saved_schedules``).

    Bound to the authenticated user via ``ReferenceField(User)`` so each saved
    schedule ties directly to ``request.user``. ``User`` lives in
    ``apps.TalpiotAPIs`` and is referenced lazily by name, so this module
    imports cleanly without the Talpix user model present locally.
    """

    student = ReferenceField("User", required=True, unique=True)
    placed = EmbeddedDocumentListField(PlanEntry)
    exemptions = ListField(StringField())
    blockers = EmbeddedDocumentListField(SavedBlocker)
    updated_at = DateTimeField()

    meta = {"collection": "scheduler_saved_schedules"}

    def __str__(self) -> str:
        return f"SavedSchedule(student={self.student}, {len(self.placed)} placed)"
