import json
import os
import re
from datetime import datetime
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

_BASE_URL = 'https://kakaoapi.aligo.in'
_BUSINESS_NAME = '마이스터 모터스'
_STORE_PHONE = '010-5313-5801'

_RSLT_MAP = {
    'Y': '수신 성공',
    'X': '수신 실패',
    'U': '메시지 불일치',
    '2': '카카오 인식불가 번호',
    '3': '카카오 인식가능',
}


def _load_env() -> dict:
    try:
        return {
            'apikey': os.environ['ALIGO_API_KEY'],
            'userid': os.environ['ALIGO_USER_ID'],
            'senderkey': os.environ['ALIGO_SENDER_KEY'],
            'tpl_code': os.environ['ALIGO_TPL_CODE'],
            'sender': re.sub(r'[-\s]', '', os.environ['SENDER_PHONE']),
        }
    except KeyError as e:
        raise RuntimeError(f"환경변수가 설정되지 않았습니다: {e}")


def _fmt_date(dt: datetime) -> str:
    return f'{dt.year}년 {dt.month}월 {dt.day}일'


def _fmt_time(dt: datetime) -> str:
    if dt.minute == 0:
        return f'{dt.hour}시'
    return f'{dt.hour}시 {dt.minute}분'


def _get_token(apikey: str, userid: str) -> str:
    """알리고 API 토큰 발급 (유효시간 30초)"""
    url = 'https://kakaoapi.aligo.in/akv10/token/create/30/s/'
    resp = requests.post(url, data={'apikey': apikey, 'userid': userid})
    resp.raise_for_status()
    data = resp.json()
    if data.get('code') != 0:
        raise RuntimeError(f"토큰 발급 실패: [{data.get('code')}] {data.get('message', '')}")
    return data.get('token')


def get_template_list() -> list[dict]:
    env = _load_env()
    payload = {
        'apikey': env['apikey'],
        'userid': env['userid'],
        'senderkey': env['senderkey'],
    }
    resp = requests.post(f'{_BASE_URL}/akv10/template/list/', data=payload)
    resp.raise_for_status()
    data = resp.json()
    if data.get('code') != 0:
        raise RuntimeError(
            f"템플릿 목록 조회 실패: [{data.get('code')}] {data.get('message', '')}"
        )
    templates = data.get('list', [])
    return [
        {
            'tpl_code': t.get('templtCode', ''),
            'tpl_name': t.get('templtName', ''),
            'status': t.get('status', ''),
            'inspStatus': t.get('inspStatus', ''),
            'tpl_content': t.get('templtContent', ''),
            'tpl_image_url': t.get('templtImageUrl', ''),
            'tpl_em_type': t.get('templateEmType', ''),
            'buttons': t.get('buttons', []),
        }
        for t in templates
        if t.get('inspStatus') == 'APR' and t.get('status') == 'A'
    ]


def build_message(car_num: str, dtstart: datetime) -> str:
    date_str = _fmt_date(dtstart)
    time_str = _fmt_time(dtstart)
    template = (
        '[{업체명} 예악 안내]\n\n'
        '안녕하세요. {업체명}입니다.\n'
        '{차량번호}님. {날짜} {시간}의 예약하신 방문 일정을 안내드립니다.\n\n'
        '■ 예약자 : {차량번호}\n'
        '■ 예약 일자 : {날짜} {시간}\n\n'
        '예약 변경 또는 취소가 필요하신 경우, 방문 전날까지 전화로 연락 주시면 감사하겠습니다. '
        '전화 연결이 어려우실 때는 {가게연락처}로 문자 남겨주세요.\n\n'
        '항상 좋은 서비스로 맞이하겠습니다. 감사합니다 :)'
    )
    return template.format(
        업체명=_BUSINESS_NAME,
        차량번호=car_num,
        날짜=date_str,
        시간=time_str,
        가게연락처=_STORE_PHONE,
    )


def _save_sent_log(mid: int, reservations: list[dict], sent_at: datetime) -> None:
    log_file = Path(f'sent_log_{sent_at.strftime("%Y%m%d")}.json')
    existing = []
    if log_file.exists():
        try:
            existing = json.loads(log_file.read_text(encoding='utf-8'))
        except Exception:
            existing = []
    for res in reservations:
        existing.append({
            'mid': mid,
            'phone': res['phone'],
            'car_num': res['car_num'],
            'sent_at': sent_at.strftime('%Y-%m-%d %H:%M:%S'),
        })
    log_file.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding='utf-8')


def send_alimtalk(reservations: list[dict], test_mode: bool = True, immediate: bool = False, template: dict = None) -> dict:
    if not reservations:
        raise ValueError('발송 대상이 없습니다.')

    env = _load_env()
    log_at = datetime.now() if immediate else reservations[0]['send_at']
    final_result = {}
    batch_size = 500

    for batch_start in range(0, len(reservations), batch_size):
        batch = reservations[batch_start:batch_start + batch_size]

        token = _get_token(env['apikey'], env['userid'])
        payload = {
            'apikey': env['apikey'],
            'userid': env['userid'],
            'token': token,
            'senderkey': env['senderkey'],
            'tpl_code': env['tpl_code'],
            'sender': env['sender'],
            'failover': 'Y',
            'testMode': 'Y' if test_mode else 'N',
        }
        if not immediate:
            payload['senddate'] = reservations[0]['send_at'].strftime('%Y%m%d%H%M%S')
        for i, res in enumerate(batch, 1):
            msg = build_message(res['car_num'], res['dtstart'])
            payload[f'receiver_{i}'] = res['phone']
            payload[f'recvname_{i}'] = res['car_num']
            payload[f'subject_{i}'] = '예약 안내'
            payload[f'message_{i}'] = msg
            buttons = (template or {}).get('buttons', [])
            if buttons:
                button_info = json.dumps({'button': [
                    {
                        'name': b.get('name', ''),
                        'linkType': b.get('linkType', ''),
                        'linkTypeName': b.get('linkTypeName', ''),
                        'linkMo': b.get('linkMo', ''),
                        'linkPc': b.get('linkPc', ''),
                        'linkIos': b.get('linkIos', ''),
                        'linkAnd': b.get('linkAnd', ''),
                    }
                    for b in buttons
                ]}, ensure_ascii=False)
                payload[f'button_{i}'] = button_info
            payload[f'fsubject_{i}'] = '예약 안내'
            payload[f'fmessage_{i}'] = msg

        resp = requests.post(f'{_BASE_URL}/akv10/alimtalk/send/', data=payload)
        resp.raise_for_status()
        result = resp.json()

        if result.get('code') != 0:
            raise RuntimeError(
                f"알림톡 발송 실패: [{result.get('code')}] {result.get('message', '알 수 없는 오류')}"
            )

        final_result = result
        info = result.get('info', {})
        if isinstance(info, dict):
            mid = info.get('mid')
        else:
            mid = result.get('mid')
        if mid:
            _save_sent_log(mid, batch, log_at)
        if mid is None:
            mid = '알 수 없음'

    return final_result


def get_send_result(mid: int) -> list[dict]:
    env = _load_env()
    payload = {
        'apikey': env['apikey'],
        'userid': env['userid'],
        'mid': mid,
        'page': 1,
        'limit': 500,
    }
    resp = requests.post(f'{_BASE_URL}/akv10/history/detail/', data=payload)
    resp.raise_for_status()
    data = resp.json()
    if data.get('code') != 0:
        raise RuntimeError(
            f"전송 결과 조회 실패: [{data.get('code')}] {data.get('message', '')}"
        )
    items = data.get('list', [])
    for item in items:
        rslt = item.get('rslt', '')
        item['rslt_kr'] = _RSLT_MAP.get(rslt, rslt)
    return items


def get_balance() -> dict:
    env = _load_env()
    payload = {
        'apikey': env['apikey'],
        'userid': env['userid'],
    }
    resp = requests.post(f'{_BASE_URL}/akv10/heartinfo/', data=payload)
    resp.raise_for_status()
    data = resp.json()
    if data.get('code', 0) < 0:
        raise RuntimeError(
            f"잔여량 조회 실패: [{data.get('code')}] {data.get('message', '')}"
        )
    return data


def cancel_reservation(mid: int) -> bool:
    print('경고: 발송 5분 전까지만 취소 가능합니다. 이후에는 취소가 불가능할 수 있습니다.')
    env = _load_env()
    payload = {
        'apikey': env['apikey'],
        'userid': env['userid'],
        'mid': mid,
    }
    resp = requests.post(f'{_BASE_URL}/akv10/cancel/', data=payload)
    resp.raise_for_status()
    data = resp.json()
    if data.get('code') != 0:
        print(f"취소 실패: [{data.get('code')}] {data.get('message', '')}")
        return False
    return True
