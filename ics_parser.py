"""
ics_parser.py - 표준 라이브러리만으로 ICS 파싱
(icalendar 라이브러리의 +0900 타임존 호환성 문제 회피)
"""

import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Optional

import pytz

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


_PHONE_RE    = re.compile(r'010[-\s]?\d{4}[-\s]?\d{4}')
_CAR_NUM_RE  = re.compile(r'\d{2,3}[가-힣]\d{4}')
_MODEL_RE    = re.compile(r'[A-Za-z]\d{2,3}[A-Za-z]?\d*')
_LOCATION_RE = re.compile(r'\([가-힣]*\)')


def _extract_phone(text: str) -> Optional[str]:
    m = _PHONE_RE.search(text)
    return re.sub(r'[-\s]', '', m.group()) if m else None


def _extract_car_num(text: str) -> Optional[str]:
    m = _CAR_NUM_RE.search(text)
    return m.group() if m else None


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


def _is_valid_phone(phone: str) -> bool:
    return bool(phone) and bool(re.match(r'^010\d{8}$', phone))


def _is_valid_car_num(car_num: str) -> bool:
    return bool(car_num) and bool(re.match(r'^\d{2,3}[가-힣]\d{4}$', car_num))


def _is_valid_hour(dt: datetime) -> bool:
    return 6 <= dt.hour <= 21


def _unfold_ics(text: str) -> str:
    """ICS line folding 처리: 줄 첫글자가 공백/탭이면 이전 줄과 합친다."""
    lines = text.replace('\r\n', '\n').replace('\r', '\n').split('\n')
    result = []
    for line in lines:
        if line and line[0] in (' ', '\t') and result:
            result[-1] += line[1:]
        else:
            result.append(line)
    return '\n'.join(result)


def _unescape(value: str) -> str:
    """ICS escape sequences 해제: \\n, \\,, \\;, \\\\ 처리."""
    return (value
            .replace('\\n', '\n').replace('\\N', '\n')
            .replace('\\,', ',')
            .replace('\\;', ';')
            .replace('\\\\', '\\'))


def _parse_dt(value: str, tzid: Optional[str] = None):
    """
    ICS 날짜/시간 문자열을 파싱한다.
    Returns: (datetime, has_time) - has_time=False이면 종일 일정
    """
    value = value.strip()
    # 트레일링 타임존 오프셋 제거: 20260518T100000+0900 → 20260518T100000
    value = re.sub(r'[+-]\d{4}$', '', value)
    # Z (UTC) 제거
    is_utc = value.endswith('Z')
    if is_utc:
        value = value[:-1]

    # YYYYMMDDTHHMMSS
    if 'T' in value:
        try:
            dt = datetime.strptime(value, '%Y%m%dT%H%M%S')
            if is_utc:
                dt = pytz.utc.localize(dt).astimezone(KST)
            else:
                dt = KST.localize(dt)
            return dt, True
        except ValueError:
            pass

    # YYYYMMDD (종일)
    try:
        dt = datetime.strptime(value, '%Y%m%d')
        return KST.localize(dt), False
    except ValueError:
        return None, False


def _parse_property(line: str):
    """
    'DTSTART;TZID=Asia/Seoul:20260518T100000' → ('DTSTART', {'TZID': 'Asia/Seoul'}, '20260518T100000')
    """
    if ':' not in line:
        return None, {}, ''
    head, _, value = line.partition(':')
    parts = head.split(';')
    name = parts[0].upper()
    params = {}
    for p in parts[1:]:
        if '=' in p:
            k, _, v = p.partition('=')
            params[k.upper()] = v
    return name, params, value


def _parse_events(text: str):
    """텍스트에서 VEVENT 블록을 추출해 dict 리스트로 반환."""
    text = _unfold_ics(text)
    events = []
    current = None
    for line in text.split('\n'):
        line = line.rstrip()
        if line == 'BEGIN:VEVENT':
            current = {}
        elif line == 'END:VEVENT':
            if current is not None:
                events.append(current)
            current = None
        elif current is not None and line:
            name, params, value = _parse_property(line)
            if not name:
                continue
            # 동일 키가 여러 번 나올 수 있음(예: EXDATE) - 첫 번째만 사용
            if name not in current:
                current[name] = {'params': params, 'value': value}
    return events


def parse_ics(filepath: str, target_date: date, debug: bool = False) -> list[dict]:
    """target_date 날짜의 예약을 추출한다."""
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        text = f.read()

    all_events = _parse_events(text)
    if debug:
        print(f'Total events in ICS: {len(all_events)}')

    results = []
    for ev in all_events:
        summary = _unescape(ev.get('SUMMARY', {}).get('value', ''))

        # 취소/완료 필터링
        if '취소' in summary or '완료' in summary:
            if debug:
                print(f'[SKIP] 취소/완료 → {summary[:40]}')
            continue

        completed = ev.get('X-NAVER-COMPLETED', {}).get('value', '').upper()
        if completed == 'TRUE':
            if debug:
                print(f'[SKIP] X-NAVER-COMPLETED:TRUE → {summary[:40]}')
            continue

        # 반복 일정 제외
        if 'RRULE' in ev:
            continue

        # DTSTART 파싱
        dtstart_info = ev.get('DTSTART')
        if not dtstart_info:
            continue
        dtstart, has_time = _parse_dt(
            dtstart_info['value'],
            dtstart_info['params'].get('TZID'),
        )
        if dtstart is None:
            continue

        # 날짜 비교
        if dtstart.date() != target_date:
            continue

        # 전화번호 / 차량번호 / 작업내용 추출
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

        if not has_time:
            print(f'[SKIP] 종일 일정 → {summary[:40]}')
            continue

        if not _is_valid_hour(dtstart):
            print(f'[SKIP] 시간 오류 → {dtstart.hour}시 | {summary[:40]}')
            continue

        send_date = target_date - timedelta(days=1)
        send_at = KST.localize(
            datetime(send_date.year, send_date.month, send_date.day, 9, 0, 0)
        )

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
