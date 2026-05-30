"""
sync.py - 네이버 캘린더 ICS 다운로드

main.py에서 import해서 사용하거나, 단독 실행도 가능합니다.
  python sync.py
"""

import os
import sys
import requests
from pathlib import Path
from datetime import datetime, timedelta

CALENDAR_ID = "48a0fc00-73a2-4333-9340-4824bd994b38"
ICS_URL = (
    "https://calendar.naver.com/ajax/ExportCalendar"
    "?calendarId={calendar_id}"
    "&periodFlag=range"
    "&startDate={start} 00:00:00"
    "&endDate={end} 23:59:59"
)


def _load_cookie() -> str:
    """
    NAVER_COOKIE를 환경변수에서 읽는다.
    로컬에서는 .env 파일을 먼저 시도하고, GitHub Actions에서는 os.environ을 사용한다.
    """
    # .env 파일이 있으면 로드 (로컬 전용, GitHub Actions에서는 없음)
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        try:
            from dotenv import load_dotenv
            load_dotenv(env_path)
        except ImportError:
            # python-dotenv가 없으면 직접 파싱
            with open(env_path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, _, val = line.partition("=")
                        os.environ.setdefault(key.strip(), val.strip())

    return os.environ.get("NAVER_COOKIE", "").strip()


def _get_date_range() -> tuple[str, str]:
    today = datetime.today()
    next_month = today + timedelta(days=31)
    return today.strftime("%Y-%m-%d"), next_month.strftime("%Y-%m-%d")


def download_ics(ics_path: str | Path) -> bool:
    """
    네이버 캘린더에서 ICS를 다운로드해 ics_path에 저장한다.

    Returns:
        True  - 성공
        False - 쿠키 만료 또는 네트워크 오류
    """
    cookie = _load_cookie()
    if not cookie:
        print("[오류] NAVER_COOKIE가 설정되지 않았습니다.")
        print("       로컬: .env 파일에 NAVER_COOKIE=<값> 추가")
        print("       GitHub Actions: Secrets에 NAVER_COOKIE 등록")
        return False

    start, end = _get_date_range()
    url = ICS_URL.format(calendar_id=CALENDAR_ID, start=start, end=end)

    print(f"[ICS] 기간: {start} ~ {end}")
    print("[ICS] 요청 중...")

    headers = {
        "Cookie": cookie,
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Referer": "https://calendar.naver.com/",
    }

    try:
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"[오류] 요청 실패: {e}")
        return False

    content = resp.text

    if not content.strip().startswith("BEGIN:VCALENDAR"):
        print("[오류] 쿠키가 만료되었습니다. NAVER_COOKIE를 갱신해주세요.")
        return False

    Path(ics_path).write_text(content, encoding="utf-8")
    print(f"[ICS] 저장 완료: {Path(ics_path).name} ({len(content):,} bytes)")
    return True


def main() -> None:
    base_dir = Path(__file__).parent
    ics_path = base_dir / "calendar.ics"

    print(f"{'='*50}")
    print(f" 네이버 캘린더 동기화 시작: {datetime.now():%Y-%m-%d %H:%M:%S}")
    print(f"{'='*50}")

    if not download_ics(ics_path):
        sys.exit(1)

    print(f"{'='*50}")
    print(f" 동기화 완료: {datetime.now():%Y-%m-%d %H:%M:%S}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
