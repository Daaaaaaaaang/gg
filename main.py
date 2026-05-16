"""
main.py - 통합 진입점

1. sync.py   → 네이버 캘린더 ICS 다운로드 → calendar.ics
2. ical_to_html.py → ICS 파싱 + HTML 생성 → index.html

실행:
  python main.py
"""

import sys
from pathlib import Path
from datetime import datetime

from sync import download_ics
from ical_to_html import generate_html

BASE_DIR = Path(__file__).parent
ICS_PATH = BASE_DIR / "calendar.ics"
HTML_PATH = BASE_DIR / "index.html"


def main() -> None:
    print(f"{'='*52}")
    print(f" 정비 일정 동기화 시작: {datetime.now():%Y-%m-%d %H:%M:%S}")
    print(f"{'='*52}")

    # 1단계: ICS 다운로드
    print("\n[1/2] 네이버 캘린더 다운로드")
    if not download_ics(ICS_PATH):
        print("[실패] ICS 다운로드에 실패했습니다. 중단합니다.")
        sys.exit(1)

    # 2단계: HTML 생성
    print("\n[2/2] HTML 생성")
    if not generate_html(ICS_PATH, HTML_PATH):
        print("[실패] HTML 생성에 실패했습니다. 중단합니다.")
        sys.exit(1)

    print(f"\n{'='*52}")
    print(f" 완료: {datetime.now():%Y-%m-%d %H:%M:%S}")
    print(f" 결과: {HTML_PATH}")
    print(f"{'='*52}")


if __name__ == "__main__":
    main()
