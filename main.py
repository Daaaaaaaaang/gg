"""
main.py - 통합 진입점

① sync.py      → 네이버 캘린더 ICS 다운로드  → calendar.ics
② ical_to_html → ICS 파싱 + HTML 생성        → index.html
③ auto_send    → 내일 예약자 알림톡 발송

실행:
  python main.py
"""

import sys
from pathlib import Path
from datetime import datetime

from sync import download_ics
from ical_to_html import generate_html
from auto_send import run as send_notifications

BASE_DIR = Path(__file__).parent
ICS_PATH  = BASE_DIR / "calendar.ics"
HTML_PATH = BASE_DIR / "index.html"


def main() -> None:
    print(f"{'='*54}")
    print(f" 정비 일정 동기화 시작: {datetime.now():%Y-%m-%d %H:%M:%S}")
    print(f"{'='*54}")

    # ① ICS 다운로드
    print("\n[1/3] 네이버 캘린더 다운로드")
    if not download_ics(ICS_PATH):
        print("[실패] ICS 다운로드에 실패했습니다. 중단합니다.")
        sys.exit(1)

    # ② HTML 생성
    print("\n[2/3] HTML 생성")
    if not generate_html(ICS_PATH, HTML_PATH):
        print("[실패] HTML 생성에 실패했습니다. 중단합니다.")
        sys.exit(1)

    # ③ 알림톡 발송
    print("\n[3/3] 알림톡 발송")
    send_notifications(ICS_PATH)

    print(f"\n{'='*54}")
    print(f" 완료: {datetime.now():%Y-%m-%d %H:%M:%S}")
    print(f"{'='*54}")


if __name__ == "__main__":
    main()
