"""Talpix-style API view layer (simulated).

Mirrors the Django REST Framework idioms used in Talpix:
    @api_view(["GET"])
    @authentication_classes([TalpiotJWTAuthentication])
    @permission_classes([IsAuthenticated])
    @restrict_roles(["Cadet", "Sagab", "Sagaz", "Kamat"])
    def view(...): ...

In this mock layer the decorators only attach metadata; FastAPI handles the
actual request lifecycle (there is no live JWT/role backend on localhost). The
call sites are therefore byte-for-byte identical to a real Talpix view, so the
feature ports to Django/DRF by deleting this shim and importing the real
``TalpiotJWTAuthentication`` / ``restrict_roles`` from
``server_side.infastructure.auth`` — no view edits required.
"""
from __future__ import annotations

from functools import wraps
from typing import Any, Callable, Iterable, List

from fastapi.responses import JSONResponse


class SessionAuthentication:
    """Mock of DRF SessionAuthentication."""


class TokenAuthentication:
    """Mock of DRF TokenAuthentication."""


class TalpiotJWTAuthentication:
    """Mock of Talpix's JWT authentication class (server_side.infastructure.auth)."""


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


def restrict_roles(roles: Iterable[str]) -> Callable:
    """Mirror of ``server_side.infastructure.auth.roles.restrict_roles``.

    In production this 403s callers lacking one of ``roles``. Locally there is
    no authenticated session, so it records the allow-list as metadata and lets
    the request through — keeping the decorator stack identical to Talpix.
    """
    allowed: List[str] = list(roles)

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            return func(*args, **kwargs)

        wrapper._restricted_roles = allowed
        return wrapper

    return decorator


def JsonResponse(data: Any, status: int = 200) -> JSONResponse:
    """Django-style JsonResponse, backed by FastAPI's JSONResponse."""
    return JSONResponse(content=data, status_code=status)
