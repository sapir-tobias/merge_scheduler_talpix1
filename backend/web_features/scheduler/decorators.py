"""Talpix-style API view layer (simulated).

Mirrors the Django REST Framework idioms used in Talpix:
    @api_view(["GET"])
    @authentication_classes([SessionAuthentication])
    @permission_classes([IsAuthenticated, IsStudent])
    def view(...): ...

In this mock layer the decorators only attach metadata; FastAPI handles
the actual request lifecycle. The shape exists so the call sites already
look like Talpix views and will port cleanly later.
"""
from __future__ import annotations

from typing import Any, Callable, Iterable

from fastapi.responses import JSONResponse


class SessionAuthentication:
    """Mock of DRF SessionAuthentication."""


class TokenAuthentication:
    """Mock of DRF TokenAuthentication."""


class IsAuthenticated:
    """Mock of DRF IsAuthenticated."""


class IsStudent:
    """Talpix role gate (student users)."""


class IsAdmin:
    """Talpix role gate (admin users)."""


def api_view(methods: Iterable[str]) -> Callable:
    def decorator(func: Callable) -> Callable:
        func._allowed_methods = list(methods)
        return func
    return decorator


def authentication_classes(classes: Iterable[type]) -> Callable:
    def decorator(func: Callable) -> Callable:
        func._authentication_classes = list(classes)
        return func
    return decorator


def permission_classes(classes: Iterable[type]) -> Callable:
    def decorator(func: Callable) -> Callable:
        func._permission_classes = list(classes)
        return func
    return decorator


def JsonResponse(data: Any, status: int = 200) -> JSONResponse:
    """Django-style JsonResponse, backed by FastAPI's JSONResponse."""
    return JSONResponse(content=data, status_code=status)
