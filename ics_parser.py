import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Optional

import pytz
from icalendar import Calendar

KST = pytz.timezone('Asia/Seoul')


def find_ics_file(directory: str = ".") -> str:
    files = sorted(Path(directory).glob("*.ics"))
    if not files:
        print("ICS 파일을 찾을 수 없습니다. 파일을 같은 폴더에 넣어주세요.")
        sys.exit(1)
    if len(files) == 1:
        return str(files[0])
    print(f"ICS 파일이 여러 개 있습니다. 사용할 파일을 선택하세요:")
    for i, f in enumerate(files, 1):
        print(f"[{i}] {f.name}")
    while True:
        try:
            choice = int(input(f"선택 (1-{len(files)}): ").strip())
            if 1 <= choice <= len(files):
                return str(files[choice - 1])
            print(f"1~{len(files)} 사이의 번호를 입력하세요.")
        except ValueError:
            print("숫자를 입력하세요.")

_PHONE_RE = re.compile(r'010[-\s]?\d{4}[-\s]?\d{4}')
_CAR_NUM_RE = re.compile(r'\d{2,3}[가-힣]\d{4}')
_MODEL_RE = re.compile(r'[A-Za-z]\d{2,3}[A-Za-z]?\d*')
_LOCATION_RE = re.compile(r'\([가-힣]*\)')


def _extract_phone(text: str) -> Optional[str]:
    match = _PHONE_RE.search(text)
    if match:
        return re.sub(r'[-\s]', '', match.group())
    return None


def _extract_car_num(text: str) -> Optional[str]:
    match = _CAR_NUM_RE.search(text)
    return match.group() if match else None


def _extract_work(summary: str) -> str:
    work = summary.replace('\n', ' ').replace('\r', ' ')
    work = _PHONE_RE.sub('', work)
    work = _CAR_NUM_RE.sub('', work)
    work = _MODEL_RE.sub('', work)
    work = _LOCATION_RE.sub('', work)
    work = work.replace('.', ' ').replace('\\', '')
    work = re.sub(r'\s*,\s*', ', ', work)
    work = re.sub(r',\s*$', '', work)
    work = re.sub(r'^\s*,\s*', '', work)
    work = re.sub(r'\s+', ' ', work)
    return work.strip()


def _to_kst(dt) -> datetime:
    if isinstance(dt, datetime):
        if dt.tzinfo is None:
            dt = KST.localize(dt)
        return dt.astimezone(KST)
    return KST.localize(datetime(dt.year, dt.month, dt.day, 0, 0, 0))


def _event_date(dtstart) -> date:
    if isinstance(dtstart, datetime):
        if dtstart.tzinfo is None:
            return KST.localize(dtstart).date()
        return dtstart.astimezone(KST).date()
    return dtstart


def _is_valid_phone(phone: str) -> bool:
    """010으로 시작하는 11자리 숫자인지 확인"""
    if not phone:
        return False
    return bool(re.match(r'^010\d{8}$', phone))


def _is_valid_car_num(car_num: str) -> bool:
    """숫자2~3자리 + 한글1자 + 숫자4자리 형식인지 확인"""
    if not car_num:
        return False
    return bool(re.match(r'^\d{2,3}[가-힣]\d{4}$', car_num))


def _is_valid_hour(dt: datetime) -> bool:
    """예약 시간이 오전 6시 ~ 오후 9시 사이인지 확인"""
    return 6 <= dt.hour <= 21


def _preprocess_ics(content: bytes) -> bytes:
    """
    네이버 캘린더 ICS의 타임존 형식 문제를 파싱 전에 보정한다.
    icalendar 라이브러리가 +0900 형식의 UTC 오프셋을 거부하므로:
    1. VTIMEZONE 블록 전체 제거 (pytz로 대체)
    2. DTSTART/DTEND의 TZID 파라미터 제거 (floating time으로 처리)
    3. 인라인 UTC 오프셋 제거
    """
    import re as _re
    text = content.decode('utf-8', errors='replace')

    # 1. VTIMEZONE 블록 전체 제거
    text = _re.sub(r'BEGIN:VTIMEZONE.*?END:VTIMEZONE\r?\n?', '', text, flags=_re.DOTALL)

    # 2. DTSTART;TZID=...:YYYYMMDDTHHMMSS → DTSTART:YYYYMMDDTHHMMSS
    text = _re.sub(r'(DTSTART|DTEND);TZID=[^:]+:(\d{8}T\d{6})', r'\1:\2', text)

    # 3. DTSTART:YYYYMMDDTHHMMSS+0900 → DTSTART:YYYYMMDDTHHMMSS
    text = _re.sub(r'(DTSTART|DTEND):(\d{8}T\d{6})[+-]\d{4}', r'\1:\2', text)

    return text.encode('utf-8')


def parse_ics(filepath: str, target_date: date, debug: bool = False) -> list[dict]:
    with open(filepath, 'rb') as f:
        raw = f.read()
    cal = Calendar.from_ical(_preprocess_ics(raw))

    all_events = [c for c in cal.walk() if c.name == 'VEVENT']

    if debug:
        print(f'Total events in ICS: {len(all_events)}')
        for comp in all_events:
            summary = str(comp.get('SUMMARY', ''))
            dtstart_prop = comp.get('DTSTART')
            event_date = _event_date(dtstart_prop.dt) if dtstart_prop else '(no date)'
            print(f'[EVENT] {event_date} | {summary}')
        print(f'Target date: {target_date}')

    date_candidates = []
    for comp in all_events:
        summary = str(comp.get('SUMMARY', ''))

        # 취소/완료 필터링
        if '취소' in summary:
            if debug:
                print(f'[SKIP] 취소 포함 → {summary[:40]}')
            continue

        if '완료' in summary:
            if debug:
                print(f'[SKIP] 완료 포함 → {summary[:40]}')
            continue

        naver_completed = comp.get('X-NAVER-COMPLETED')
        if naver_completed and str(naver_completed).upper() == 'TRUE':
            if debug:
                print(f'[SKIP] X-NAVER-COMPLETED:TRUE → {summary[:40]}')
            continue

        if comp.get('RRULE'):
            continue
        dtstart_prop = comp.get('DTSTART')
        if dtstart_prop is None:
            continue
        if _event_date(dtstart_prop.dt) != target_date:
            continue
        date_candidates.append(comp)

    if debug:
        print(f'Events on target date: {len(date_candidates)}')

    results = []
    for comp in date_candidates:
        summary = str(comp.get('SUMMARY', ''))
        dtstart_val = comp.get('DTSTART').dt
        phone = _extract_phone(summary)
        car_num = _extract_car_num(summary) or ''
        work = _extract_work(summary)

        if debug:
            print(f'[PARSE] {car_num} | phone={phone or "없음"} | work={work}')

        if not phone:
            continue

        if not _is_valid_phone(phone):
            print(f'[SKIP] 전화번호 오류 → {summary[:40]}')
            continue

        if not _is_valid_car_num(car_num):
            print(f'[SKIP] 차량번호 오류 → car_num={car_num!r} | {summary[:40]}')
            continue

        dtstart = _to_kst(dtstart_val)

        if not _is_valid_hour(dtstart):
            print(f'[SKIP] 시간 오류 → {dtstart.hour}시 | {summary[:40]}')
            continue

        send_date = target_date - timedelta(days=1)
        send_at = KST.localize(datetime(send_date.year, send_date.month, send_date.day, 9, 0, 0))

        results.append({
            'phone': phone,
            'car_num': car_num,
            'work': work,
            'dtstart': dtstart,
            'send_at': send_at,
        })

    if debug:
        print(f'Final count: {len(results)}')

    return results
