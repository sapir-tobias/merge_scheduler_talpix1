"""Scheduler view controllers (Talpix DRF style).

Each endpoint takes ``request`` as its first argument and carries the exact
Talpix decorator stack — ``@api_view`` -> ``@authentication_classes`` ->
``@permission_classes`` -> ``@restrict_roles`` — talks only to the
``repository`` abstraction (never to the filesystem directly), projects
documents through ``serializers`` and returns a ``JsonResponse``.

Logging is scoped to this module (``logging.getLogger(__name__)``) and every
record is a JSON string, mirroring Talpix's structured logging so a Grafana
LogQL pipeline can parse fields straight out of the message
(``| json | event="scheduler.list_courses"``).
"""
from __future__ import annotations

import json
import logging
from typing import Any

from . import repository, serializers
from .decorators import (
    IsAuthenticated,
    JsonResponse,
    Request,
    TalpiotJWTAuthentication,
    api_view,
    authentication_classes,
    permission_classes,
    restrict_roles,
)

logger = logging.getLogger(__name__)

#: Roles permitted to use the Scheduler (cadets and their commanders).
SCHEDULER_ROLES = ["Cadet", "Sagab", "Sagaz", "Kamat"]


def _log(event: str, **fields: Any) -> None:
    """Emit one JSON log line for Grafana LogQL ingestion."""
    logger.info(json.dumps({"event": event, **fields}, ensure_ascii=False))


@api_view(["GET"])
@authentication_classes([TalpiotJWTAuthentication])
@permission_classes([IsAuthenticated])
@restrict_roles(SCHEDULER_ROLES)
def list_courses(request: Request):
    """GET /api/scheduler/courses — the full course catalogue."""
    courses = [serializers.serialize_course(c) for c in repository.all_courses()]
    _log("scheduler.list_courses", count=len(courses))
    return JsonResponse({"courses": courses}, status=200)


@api_view(["GET"])
@authentication_classes([TalpiotJWTAuthentication])
@permission_classes([IsAuthenticated])
@restrict_roles(SCHEDULER_ROLES)
def get_course(request: Request, course_id: str):
    """GET /api/scheduler/courses/{course_id} — one course by course_number."""
    course = repository.get_course(course_id)
    if course is None:
        _log("scheduler.get_course.not_found", course_id=course_id)
        return JsonResponse({"detail": "Course not found"}, status=404)
    _log("scheduler.get_course", course_id=course_id)
    return JsonResponse({"course": serializers.serialize_course(course)}, status=200)


@api_view(["GET"])
@authentication_classes([TalpiotJWTAuthentication])
@permission_classes([IsAuthenticated])
@restrict_roles(SCHEDULER_ROLES)
def get_initial_placed(request: Request):
    """GET /api/scheduler/initial-placed — the canonical starter placement."""
    placed = [serializers.serialize_placed(p) for p in repository.all_placed()]
    _log("scheduler.get_initial_placed", count=len(placed))
    return JsonResponse({"placed": placed}, status=200)


@api_view(["GET"])
@authentication_classes([TalpiotJWTAuthentication])
@permission_classes([IsAuthenticated])
@restrict_roles(SCHEDULER_ROLES)
def list_plans(request: Request):
    """GET /api/scheduler/plans — the available default-track ids."""
    tracks = repository.list_track_ids()
    _log("scheduler.list_plans", tracks=tracks)
    return JsonResponse({"tracks": tracks}, status=200)


@api_view(["GET"])
@authentication_classes([TalpiotJWTAuthentication])
@permission_classes([IsAuthenticated])
@restrict_roles(SCHEDULER_ROLES)
def get_plan(request: Request, track_id: str):
    """GET /api/scheduler/plans/{track_id} — one default 6-semester track."""
    plan = repository.get_plan(track_id)
    if plan is None:
        _log("scheduler.get_plan.not_found", track_id=track_id)
        return JsonResponse({"detail": f"Unknown track '{track_id}'"}, status=404)
    entries = [serializers.serialize_plan_entry(e) for e in plan]
    _log("scheduler.get_plan", track_id=track_id, count=len(entries))
    return JsonResponse({"track": track_id, "entries": entries}, status=200)


@api_view(["POST"])
@authentication_classes([TalpiotJWTAuthentication])
@permission_classes([IsAuthenticated])
@restrict_roles(SCHEDULER_ROLES)
async def save_placement(request: Request):
    """POST /api/scheduler/initial-placed — persist a placement set.

    Expects ``{"placed": [{courseId, semesterId, lectureOptionId, ...}]}`` in
    the frontend wire shape (Talpix would read it as ``request.data``); stored
    back in the document (real-key) shape.
    """
    try:
        body = await request.json()
    except Exception:
        _log("scheduler.save_placement.bad_request", reason="invalid_json")
        return JsonResponse({"detail": "Invalid JSON body"}, status=400)

    wire = body.get("placed") if isinstance(body, dict) else None
    if not isinstance(wire, list):
        _log("scheduler.save_placement.bad_request")
        return JsonResponse({"detail": "Expected 'placed' to be a list"}, status=400)

    documents = [
        {
            "course_number": str(item.get("courseId")),
            "semester_id": item.get("semesterId"),
            "lecture_option_id": item.get("lectureOptionId"),
            "recitation_option_id": item.get("recitationOptionId"),
            "locked": bool(item.get("locked", False)),
        }
        for item in wire
    ]
    repository.save_placed(documents)
    _log("scheduler.save_placement", count=len(documents))
    return JsonResponse({"placed": [serializers.serialize_placed(d) for d in documents]}, status=200)
