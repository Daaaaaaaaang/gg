"""
auto_send.py - 내일 예약자 알림톡 발송

main.py에서 import해서 사용하거나, 단독 실행도 가능합니다.
  python auto_send.py
"""

import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytz
from dotenv import load_dotenv

from aligo_client import get_template_list, send_alimtalk
from ics_parser import parse_ics

KST = pytz.timezone('Asia/Seoul')

_REQUIRED_KEYS = [
    'ALIGO_API_KEY', 'ALIGO_USER_ID', 'ALIGO_SENDER_KEY',
    'ALIGO_TPL_CODE', 'SENDER_PHONE',
]


def _load_env() -> None:
    """로컬은 .env, GitHub Actions는 os.environ에서 읽는다."""
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=False)
        print('[INFO] .env file loaded')
    else:
        print('[INFO] No .env file, using environment variables')


def _fmt_phone(phone: str) -> str:
    if len(phone) == 11:
        return f'{phone[:3]}-{phone[3:7]}-{phone[7:]}'
    return phone


def _fmt_time(dt: datetime) -> str:
    if dt.minute == 0:
        return f'{dt.hour}시'
    return f'{dt.hour}시 {dt.minute}분'


def run(ics_path: str | Path = None) -> None:
    """
    내일 예약자를 알림톡으로 발송한다.

    Args:
        ics_path: ICS 파일 경로. None이면 프로젝트 루트의 calendar.ics를 사용.
    """
    _load_env()

    # 환경변수 확인
    missing = [k for k in _REQUIRED_KEYS if not os.environ.get(k)]
    if missing:
        print(f'[ERROR] Missing environment variables: {missing}')
        sys.exit(1)

    print(f"[INFO] ALIGO_USER_ID: {os.environ.get('ALIGO_USER_ID', 'NOT SET')}")
    print(f"[INFO] ALIGO_TPL_CODE: {os.environ.get('ALIGO_TPL_CODE', 'NOT SET')}")
    print(f"[INFO] SENDER_PHONE: {os.environ.get('SENDER_PHONE', 'NOT SET')}")
    print(f"[INFO] TEST_MODE: {os.environ.get('TEST_MODE', 'NOT SET')}")

    # ICS 파일 경로 결정 (고정: 프로젝트 루트의 calendar.ics)
    if ics_path is None:
        ics_path = Path(__file__).parent / 'calendar.ics'
    ics_path = Path(ics_path)

    if not ics_path.exists():
        print(f'[ERROR] ICS 파일을 찾을 수 없습니다: {ics_path}')
        sys.exit(1)
    print(f'[INFO] ICS file: {ics_path}')

    # 이틀 후 날짜 파싱
    target_date = (datetime.now(KST) + timedelta(days=2)).date()
    print(f'[INFO] Target date: {target_date.strftime("%Y-%m-%d")}')

    try:
        reservations = parse_ics(str(ics_path), target_date)
    except Exception as e:
        print(f'[ERROR] Failed to parse ICS file: {e}')
        sys.exit(1)

    if not reservations:
        print(f'[INFO] No reservations for {target_date.strftime("%Y-%m-%d")}. Exiting.')
        return

    # 발송 대상 출력
    print(f'\n=== Send targets ({target_date.strftime("%Y-%m-%d")} reservations) ===')
    for i, res in enumerate(reservations, 1):
        print(
            f'[{i}] {res["car_num"]}  |  {_fmt_phone(res["phone"])}'
            f'  |  {_fmt_time(res["dtstart"])}  |  {res["work"]}'
        )
    print(f'Total: {len(reservations)} person(s) -> Sending now')

    # 승인된 템플릿 가져오기
    try:
        templates = get_template_list()
    except Exception as e:
        print(f'[ERROR] Failed to fetch template list: {e}')
        sys.exit(1)

    if not templates:
        print('[ERROR] No approved templates found. Please check Aligo dashboard.')
        sys.exit(1)

    selected = templates[0]
    print(f'[INFO] Template: [{selected.get("tpl_code")}] {selected.get("tpl_name", "")}')
    os.environ['ALIGO_TPL_CODE'] = selected.get('tpl_code', os.environ.get('ALIGO_TPL_CODE', ''))

    # 발송
    test_mode = os.environ.get('TEST_MODE', 'Y').upper() != 'N'
    print(f'[INFO] Mode: {"TEST" if test_mode else "LIVE"}')

    try:
        result = send_alimtalk(reservations, test_mode=test_mode, immediate=True, template=selected)
        info = result.get('info', {})
        mid = info.get('mid') if isinstance(info, dict) else result.get('mid')
        if mid is None:
            mid = 'unknown'
        print(f'[SUCCESS] Sent! MID: {mid}')
    except Exception as e:
        print(f'[ERROR] Send failed: {e}')
        sys.exit(1)


if __name__ == '__main__':
    run()
