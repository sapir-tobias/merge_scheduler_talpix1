"""Pytest bootstrap: put the backend package root on sys.path.

Lets the scheduler tests ``import main`` and ``from web_features.scheduler …``
regardless of the directory pytest is launched from.
"""
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))
