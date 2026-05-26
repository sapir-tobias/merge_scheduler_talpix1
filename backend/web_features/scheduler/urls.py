"""Scheduler feature routes.

Path convention mirrors Talpix: every feature exposes its routes through an
APIRouter, mounted under /api/<feature> by the main app.
"""
from __future__ import annotations

from fastapi import APIRouter

from .decorators import (
    IsAuthenticated,
    IsStudent,
    JsonResponse,
    SessionAuthentication,
    api_view,
    authentication_classes,
    permission_classes,
)
from .logic import (
    fetch_all_courses,
    fetch_course_by_id,
    fetch_initial_placed,
    fetch_plan,
    list_track_ids,
)

router = APIRouter(prefix="/api/scheduler", tags=["scheduler"])


@router.get("/courses")
@api_view(["GET"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated, IsStudent])
def list_courses():
    return JsonResponse({"courses": fetch_all_courses()}, status=200)


@router.get("/courses/{course_id}")
@api_view(["GET"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated, IsStudent])
def get_course(course_id: str):
    course = fetch_course_by_id(course_id)
    if course is None:
        return JsonResponse({"detail": "Course not found"}, status=404)
    return JsonResponse({"course": course}, status=200)


@router.get("/initial-placed")
@api_view(["GET"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated, IsStudent])
def get_initial_placed():
    return JsonResponse({"placed": fetch_initial_placed()}, status=200)


@router.get("/plans")
@api_view(["GET"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated, IsStudent])
def list_plans():
    return JsonResponse({"tracks": list_track_ids()}, status=200)


@router.get("/plans/{track_id}")
@api_view(["GET"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated, IsStudent])
def get_plan(track_id: str):
    plan = fetch_plan(track_id)
    if plan is None:
        return JsonResponse({"detail": f"Unknown track '{track_id}'"}, status=404)
    return JsonResponse({"track": track_id, "entries": plan}, status=200)
