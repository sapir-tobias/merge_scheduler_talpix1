"""One-shot converter: reads the legacy TypeScript course data from
frontend/src/data/ and emits the JSON files consumed by the mock backend.

Re-run this whenever the upstream TS data changes. It only touches
backend/web_features/scheduler/data/.
"""
from __future__ import annotations

import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC_DATA = ROOT / "frontend" / "src" / "data"
OUT = ROOT / "backend" / "web_features" / "scheduler" / "data"
OUT.mkdir(parents=True, exist_ok=True)


def _extract(text: str, declaration_re: str, open_char: str) -> str:
    m = re.search(declaration_re, text)
    if not m:
        raise SystemExit(f"declaration not found: {declaration_re!r}")
    i = m.end()
    while i < len(text) and text[i] != open_char:
        i += 1
    if i >= len(text):
        raise SystemExit(f"open char {open_char!r} not found")
    close_char = "]" if open_char == "[" else "}"
    depth = 0
    j = i
    while j < len(text):
        c = text[j]
        if c == open_char:
            depth += 1
        elif c == close_char:
            depth -= 1
            if depth == 0:
                return text[i : j + 1]
        j += 1
    raise SystemExit("unbalanced brackets")


def _js_to_json(s: str) -> str:
    s = re.sub(r"//[^\n]*", "", s)
    s = re.sub(r"\s+as\s+const", "", s)
    s = s.replace("'", '"')
    s = re.sub(
        r"(?P<pre>[{,]\s*)(?P<key>[a-zA-Z_][a-zA-Z0-9_]*)\s*:",
        r'\g<pre>"\g<key>":',
        s,
    )
    s = re.sub(r",(\s*[}\]])", r"\1", s)
    return s


def convert_array(text: str, declaration_re: str):
    return json.loads(_js_to_json(_extract(text, declaration_re, "[")))


def convert_object(text: str, declaration_re: str):
    return json.loads(_js_to_json(_extract(text, declaration_re, "{")))


def main() -> None:
    courses_ts = (SRC_DATA / "courses.ts").read_text(encoding="utf-8")
    plans_ts = (SRC_DATA / "plans.ts").read_text(encoding="utf-8")

    courses = convert_array(courses_ts, r"export const COURSES[^=]*=")
    initial = convert_array(courses_ts, r"export const INITIAL_PLACED\s*=")
    plans = convert_object(plans_ts, r"const PLANS[^=]*=")

    (OUT / "courses.json").write_text(json.dumps(courses, indent=2), encoding="utf-8")
    (OUT / "initial_placed.json").write_text(
        json.dumps(initial, indent=2), encoding="utf-8"
    )
    (OUT / "plans.json").write_text(json.dumps(plans, indent=2), encoding="utf-8")

    print(
        f"wrote {len(courses)} courses, "
        f"{len(initial)} initial_placed entries, "
        f"{len(plans)} plan tracks"
    )


if __name__ == "__main__":
    main()
