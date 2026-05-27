"""Regenerate the demo placement + default tracks from the real course data.

After ``courses.json`` was switched to the live shnaton scrape, the old
``initial_placed.json`` / ``plans.json`` (which referenced synthetic ids like
``cs-intro``) no longer matched any real course. This one-shot script rebuilds
both fixtures from ``courses.json`` so every entry references a real
``course_number`` and a real lecture ``group_id`` that the serializer actually
emits — keeping the whole pipeline (data -> repository -> serializer ->
frontend) internally consistent.

Run from the ``backend/`` directory:  python _seed_demo_plan.py
"""
from __future__ import annotations

import json
from pathlib import Path

from web_features.scheduler import serializers

DATA = Path(__file__).resolve().parent / "web_features" / "scheduler" / "data"

TRACK_FACULTY = {"cs": "cs", "math": "math", "physics": "physics"}
COURSES_PER_SEM = 4          # plans: 4 courses x 6 semesters
INITIAL_SEMESTERS = 5        # initial_placed: pre-fill semesters 1..5
INITIAL_PER_SEM = 3


def _renderable_pool(courses, faculty):
    """Courses of a faculty that have at least one schedulable lecture option."""
    pool = []
    for course in courses:
        wire = serializers.serialize_course(course)
        if wire["faculty"] != faculty or not wire["lectureOptions"]:
            continue
        pool.append((course["course_number"], wire))
    pool.sort(key=lambda t: t[0])           # deterministic
    return pool


def _entry(course_number, wire, semester_id):
    lecture_id = wire["lectureOptions"][0]["id"]
    recitations = wire["recitationOptions"]
    return {
        "course_number": course_number,
        "semester_id": semester_id,
        "lecture_option_id": lecture_id,
        "recitation_option_id": recitations[0]["id"] if recitations else None,
    }


def build_plan(pool, courses_per_sem, semesters):
    entries = []
    idx = 0
    for sem in range(1, semesters + 1):
        for _ in range(courses_per_sem):
            if idx >= len(pool):
                break
            course_number, wire = pool[idx]
            entries.append(_entry(course_number, wire, sem))
            idx += 1
    return entries


def main() -> None:
    courses = json.loads((DATA / "courses.json").read_text(encoding="utf-8"))

    plans = {}
    for track, faculty in TRACK_FACULTY.items():
        pool = _renderable_pool(courses, faculty)
        plans[track] = build_plan(pool, COURSES_PER_SEM, 6)

    # initial_placed: a starter board from the CS pool, semesters 1..5, unlocked.
    cs_pool = _renderable_pool(courses, "cs")
    initial = [
        {**e, "locked": False}
        for e in build_plan(cs_pool, INITIAL_PER_SEM, INITIAL_SEMESTERS)
    ]

    (DATA / "plans.json").write_text(
        json.dumps(plans, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (DATA / "initial_placed.json").write_text(
        json.dumps(initial, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(
        "wrote plans: "
        + ", ".join(f"{t}={len(e)}" for t, e in plans.items())
        + f"; initial_placed={len(initial)}"
    )


if __name__ == "__main__":
    main()
