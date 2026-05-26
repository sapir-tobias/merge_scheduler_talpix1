"""Pydantic models that simulate MongoEngine Documents.

Mapping to Talpix MongoEngine schema:
    Course           -> Document  (collection: "courses")
    LectureOption    -> EmbeddedDocument
    LectureSlot      -> EmbeddedDocument
    PlacedCourse     -> Embedded payload referencing Course via courseId (ReferenceField simulation)
    PlanEntry        -> Embedded payload referencing Course via courseId

In real Mongo, the `id` field would live as `_id`. We keep `id` in the wire
format for direct compatibility with the existing frontend types.
"""
from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel


Faculty = Literal["cs", "math", "physics", "misc"]
DayKey = Literal["sun", "mon", "tue", "wed", "thu"]
SemesterId = Literal[1, 2, 3, 4, 5, 6]
TrackId = Literal["cs", "math", "physics"]


class LectureSlot(BaseModel):
    """EmbeddedDocument: a single weekly time slot."""
    day: DayKey
    startHour: float
    endHour: float


class LectureOption(BaseModel):
    """EmbeddedDocument: one lecture/recitation option made of N slots."""
    id: str
    slots: List[LectureSlot]


class Course(BaseModel):
    """Document (collection: "courses").

    Real-Mongo equivalents:
        id              -> _id           (ObjectId/string)
        prerequisites   -> ListField(ReferenceField(Course))
        lectureOptions  -> ListField(EmbeddedDocumentField(LectureOption))
        recitationOptions -> ListField(EmbeddedDocumentField(LectureOption))
    """
    id: str
    code: str
    name: str
    faculty: Faculty
    credits: int
    examDate: str
    prerequisites: List[str] = []
    description: str
    lectureOptions: List[LectureOption] = []
    recitationOptions: List[LectureOption] = []


class PlacedCourse(BaseModel):
    """ReferenceField(Course) + extra placement metadata."""
    courseId: str
    semesterId: SemesterId
    lectureOptionId: str
    recitationOptionId: Optional[str] = None
    locked: bool = False


class PlanEntry(BaseModel):
    """A single line item in a default-degree plan."""
    courseId: str
    semesterId: SemesterId
    lectureOptionId: str
    recitationOptionId: Optional[str] = None
