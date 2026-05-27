"""Scheduler feature routes.

Path convention mirrors Talpix: the feature exposes its routes through a single
router that the main app mounts under ``/api/scheduler``. The router only wires
paths to the view controllers in ``logic_scheduler`` — all logic lives there,
exactly as a Talpix ``urls.py`` only calls ``path("...", view)``.
"""
from __future__ import annotations

from fastapi import APIRouter

from .logic_scheduler import (
    get_course,
    get_initial_placed,
    get_plan,
    list_courses,
    list_plans,
    save_placement,
)

router = APIRouter(prefix="/api/scheduler", tags=["scheduler"])

# The views return a Django-style ``JsonResponse`` (a Starlette ``JSONResponse``
# under the hood), so there is no Pydantic response model to infer.
router.add_api_route("/courses", list_courses, methods=["GET"], response_model=None)
router.add_api_route("/courses/{course_id}", get_course, methods=["GET"], response_model=None)
router.add_api_route("/initial-placed", get_initial_placed, methods=["GET"], response_model=None)
router.add_api_route("/initial-placed", save_placement, methods=["POST"], response_model=None)
router.add_api_route("/plans", list_plans, methods=["GET"], response_model=None)
router.add_api_route("/plans/{track_id}", get_plan, methods=["GET"], response_model=None)
