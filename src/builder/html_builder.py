import json
from pathlib import Path

_TEMPLATES = Path(__file__).parent.parent / "templates"

# js/ 폴더 안 파일을 이 순서대로 이어붙임
_JS_FILES = [
    "js/supabase.js",
    "js/state.js",
    "js/parser.js",
    "js/render.js",
    "js/modal.js",
    "js/ui.js",
]


def _load(filename):
    return (_TEMPLATES / filename).read_text(encoding="utf-8")


def _load_js(jobs_js: str) -> str:
    """js/ 파일들을 순서대로 이어붙이고 __JOBS__ 플레이스홀더를 치환한다."""
    parts = []
    for fname in _JS_FILES:
        parts.append(_load(fname))
    combined = "\n".join(parts)
    return combined.replace("__JOBS__", jobs_js)


def jobs_to_js(jobs):
    rows = []
    for j in jobs:
        row = (
            "  {date:" + json.dumps(j["date"], ensure_ascii=False)
            + ",endDate:" + json.dumps(j.get("endDate", ""), ensure_ascii=False)
            + ",time:" + json.dumps(j["time"], ensure_ascii=False)
            + ",model:" + json.dumps(j["model"], ensure_ascii=False)
            + ",plate:" + json.dumps(j["plate"], ensure_ascii=False)
            + ",region:" + json.dumps(j.get("region", ""), ensure_ascii=False)
            + ",title:" + json.dumps(j["title"], ensure_ascii=False)
            + ",parts:" + json.dumps(j["parts"], ensure_ascii=False)
            + ",phone:" + json.dumps(j["phone"], ensure_ascii=False)
            + ",note:" + json.dumps(j["note"], ensure_ascii=False)
            + ",done:" + ("true" if j["done"] else "false")
            + ",cancelled:" + ("true" if j["cancelled"] else "false")
            + "},"
        )
        rows.append(row)
    return "\n".join(rows)


def build_html(jobs):
    css = _load("style.css")
    body = _load("body.html")
    js_final = _load_js(jobs_to_js(jobs))
    return (
        '<!DOCTYPE html>\n<html lang="ko">\n<head>\n'
        '<meta charset="UTF-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
        '<title>정비 일정 관리</title>\n'
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">\n'
        '<script src="https://unpkg.com/@primer/octicons@latest/build/build.js"></script>\n'
        "<style>\n" + css + "\n</style>\n</head>\n"
        "<body>\n" + body + "\n"
        "<script>\n" + js_final + "\n</script>\n"
        "</body>\n</html>"
    )
