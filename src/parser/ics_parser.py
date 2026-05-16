import os
import sys
import glob
from datetime import datetime

from src.parser.summary_parser import clean_text, parse_summary
from src.parts.extractor import extract_parts


def parse_ics_raw(text):
    text = text.replace("\r\n ", "").replace("\r\n\t", "")
    text = text.replace("\n ", "").replace("\n\t", "")
    events, current = [], None
    for line in text.splitlines():
        line = line.strip()
        if line == "BEGIN:VEVENT":
            current = {}
        elif line == "END:VEVENT":
            if current is not None:
                events.append(current)
            current = None
        elif current is not None and ":" in line:
            key_part, _, value = line.partition(":")
            key = key_part.split(";")[0].upper()
            if key not in current:
                current[key] = value.strip()
    return events


def parse_dt_str(dtstr):
    if not dtstr:
        return ("", "")
    dtstr = dtstr.strip()
    # TZID 등으로 "Asia/Seoul:20260428T150000" 형태가 들어올 때 날짜 부분만 추출
    if ":" in dtstr:
        dtstr = dtstr.split(":")[-1]
    if not dtstr:
        return ("", "")
    if "T" in dtstr:
        try:
            dt = datetime.strptime(dtstr[:15], "%Y%m%dT%H%M%S")
            return ("%d/%d" % (dt.month, dt.day), dt.strftime("%H:%M"))
        except Exception:
            pass
    else:
        try:
            d = datetime.strptime(dtstr[:8], "%Y%m%d")
            return ("%d/%d" % (d.month, d.day), "종일")
        except Exception:
            pass
    return ("", "")


def _sort_key(j):
    try:
        m, d = j["date"].split("/")
        h, mn = j["time"].split(":") if ":" in j["time"] else ("99", "0")
        return int(m) * 100000 + int(d) * 1000 + int(h) * 10 + int(mn)
    except Exception:
        return 9999999


def load_ics_folder(folder):
    ics_files = glob.glob(os.path.join(folder, "*.ics"))
    if not ics_files:
        print("[오류] '%s' 폴더에 .ics 파일이 없습니다." % folder)
        sys.exit(1)
    print("[발견] %d개 .ics 파일:" % len(ics_files))
    for f in ics_files:
        print("  - " + f)
    jobs, seen = [], set()
    for ics_path in ics_files:
        try:
            with open(ics_path, "r", encoding="utf-8", errors="replace") as fh:
                raw = fh.read()
        except Exception as e:
            print("[경고] %s 읽기 실패: %s" % (ics_path, e))
            continue
        for ev in parse_ics_raw(raw):
            summary = clean_text(ev.get("SUMMARY", ""))
            if not summary or "청소 시간" in summary:
                continue
            dedup_key = ev.get("UID", "") + ev.get("RECURRENCE-ID", "")
            if dedup_key in seen:
                continue
            seen.add(dedup_key)
            date_str, time_str = parse_dt_str(ev.get("DTSTART", ""))
            end_date_str, _ = parse_dt_str(ev.get("DTEND", ""))
            if end_date_str == date_str:
                end_date_str = ""
            if not date_str:
                continue
            is_done = bool(ev.get("X-NAVER-COMPLETED", ""))
            is_cancelled = "취소" in summary
            description = clean_text(ev.get("DESCRIPTION", ""))
            model, plate, vin, phone, title, note = parse_summary(summary, description)
            parts = extract_parts(title)
            jobs.append({
                "date": date_str,
                "endDate": end_date_str,
                "time": time_str or "종일",
                "model": model,
                "plate": plate,
                "region": vin,
                "title": title,
                "parts": parts,
                "phone": phone,
                "note": note,
                "done": is_done,
                "cancelled": is_cancelled,
            })
    jobs.sort(key=_sort_key)
    print("[완료] 총 %d개 일정 파싱" % len(jobs))
    return jobs
