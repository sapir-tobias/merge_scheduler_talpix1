"""Settings loader — mirrors Talpix's ``apps.settings.load_settings()`` hierarchy.

Priority (highest first):
    1. Environment variables (via ``_ENV_OVERRIDES``)
    2. ``secret_settings.json``  — local-only, git-ignored
    3. ``settings.json``        — committed defaults

In real Talpix this hydrates the singleton ``TalpiotSettings`` (Mongo creds,
bot token …). Here it returns a plain dict scoped to the Scheduler feature so
``repository.py`` resolves its data directory and mock flag through one unified
config chain instead of hardcoding filesystem paths.
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict

CURR_DIR = Path(__file__).resolve().parent
SETTINGS_JSON = CURR_DIR / "settings.json"
SECRET_SETTINGS_JSON = CURR_DIR / "secret_settings.json"

logger = logging.getLogger(__name__)

# Environment variable name -> the settings key it overrides (highest priority).
_ENV_OVERRIDES = {
    "SCHEDULER_DATA_DIR": "scheduler_data_dir",
    "SCHEDULER_USE_MOCK": "scheduler_use_mock",
}

_cache: Dict[str, Any] | None = None


def _coerce(value: Any) -> Any:
    """Env vars arrive as strings — coerce obvious booleans."""
    if isinstance(value, str) and value.lower() in {"true", "false"}:
        return value.lower() == "true"
    return value


def load_settings() -> Dict[str, Any]:
    """Return the merged settings dict (cached after first load)."""
    global _cache
    if _cache is not None:
        return _cache

    filename = SETTINGS_JSON
    if SECRET_SETTINGS_JSON.is_file():
        logger.info(json.dumps({"event": "settings.using_secret_json"}, ensure_ascii=False))
        filename = SECRET_SETTINGS_JSON

    data: Dict[str, Any] = json.loads(filename.read_text(encoding="utf-8")) if filename.is_file() else {}

    overrides = {
        key: _coerce(os.environ[env_name])
        for env_name, key in _ENV_OVERRIDES.items()
        if os.environ.get(env_name) is not None
    }
    if overrides:
        logger.info(json.dumps({"event": "settings.env_overrides", "keys": list(overrides)}, ensure_ascii=False))
        data.update(overrides)

    _cache = data
    return data
