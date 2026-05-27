"""Endpoint integration tests via FastAPI's TestClient.

Mirrors Talpix's view validation flow: hit each route, assert status + payload
shape, and confirm the Talpix-style decorator stack is attached to every view.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import main
from web_features.scheduler import logic_scheduler
from web_features.scheduler.decorators import (
    IsAuthenticated,
    TalpiotJWTAuthentication,
)


@pytest.fixture(scope="module")
def client():
    return TestClient(main.app)


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_list_courses(client):
    res = client.get("/api/scheduler/courses")
    assert res.status_code == 200
    courses = res.json()["courses"]
    assert len(courses) > 0
    first = courses[0]
    assert {"id", "name", "faculty", "lectureOptions"} <= set(first)


def test_get_course_roundtrip(client):
    number = client.get("/api/scheduler/courses").json()["courses"][0]["id"]
    res = client.get(f"/api/scheduler/courses/{number}")
    assert res.status_code == 200
    assert res.json()["course"]["id"] == number


def test_get_course_404(client):
    assert client.get("/api/scheduler/courses/__nope__").status_code == 404


def test_initial_placed(client):
    res = client.get("/api/scheduler/initial-placed")
    assert res.status_code == 200
    placed = res.json()["placed"]
    assert len(placed) > 0
    assert {"courseId", "semesterId", "lectureOptionId"} <= set(placed[0])


def test_plans_list_and_detail(client):
    assert set(client.get("/api/scheduler/plans").json()["tracks"]) >= {"cs", "math", "physics"}
    cs = client.get("/api/scheduler/plans/cs")
    assert cs.status_code == 200
    assert cs.json()["track"] == "cs"
    assert len(cs.json()["entries"]) > 0
    assert client.get("/api/scheduler/plans/__nope__").status_code == 404


def test_save_placement_roundtrip(client):
    placed = client.get("/api/scheduler/initial-placed").json()["placed"]
    res = client.post("/api/scheduler/initial-placed", json={"placed": placed})
    assert res.status_code == 200
    assert len(res.json()["placed"]) == len(placed)


def test_save_placement_bad_request(client):
    assert client.post("/api/scheduler/initial-placed", json={"bad": 1}).status_code == 400


@pytest.mark.parametrize(
    "view",
    [
        logic_scheduler.list_courses,
        logic_scheduler.get_course,
        logic_scheduler.get_initial_placed,
        logic_scheduler.list_plans,
        logic_scheduler.get_plan,
        logic_scheduler.save_placement,
    ],
)
def test_views_carry_talpix_decorator_stack(view):
    """Every view must expose the @api_view/@authentication/@permission/@restrict_roles metadata."""
    assert hasattr(view, "_allowed_methods")
    assert view._authentication_classes == [TalpiotJWTAuthentication]
    assert view._permission_classes == [IsAuthenticated]
    assert view._restricted_roles == ["Cadet", "Sagab", "Sagaz", "Kamat"]
