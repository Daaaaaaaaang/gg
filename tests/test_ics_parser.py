import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.parser.ics_parser import parse_ics_raw, parse_dt_str
from src.parser.summary_parser import clean_text, parse_summary


class TestParseDtStr(unittest.TestCase):
    def test_with_time(self):
        date, time = parse_dt_str("20260415T100000")
        self.assertEqual(date, "4/15")
        self.assertEqual(time, "10:00")

    def test_all_day(self):
        date, time = parse_dt_str("20260415")
        self.assertEqual(date, "4/15")
        self.assertEqual(time, "종일")

    def test_empty(self):
        self.assertEqual(parse_dt_str(""), ("", ""))

    def test_none(self):
        self.assertEqual(parse_dt_str(None), ("", ""))

    def test_single_digit_month_day(self):
        date, time = parse_dt_str("20260101T090000")
        self.assertEqual(date, "1/1")
        self.assertEqual(time, "09:00")

    def test_tzid_colon_prefix(self):
        date, time = parse_dt_str("Asia/Seoul:20260428T150000")
        self.assertEqual(date, "4/28")
        self.assertEqual(time, "15:00")

    def test_tzid_colon_prefix_allday(self):
        date, time = parse_dt_str("Asia/Seoul:20260428")
        self.assertEqual(date, "4/28")
        self.assertEqual(time, "종일")


class TestParseIcsRaw(unittest.TestCase):
    def test_basic_event(self):
        ics = (
            "BEGIN:VCALENDAR\r\n"
            "BEGIN:VEVENT\r\n"
            "UID:test@example.com\r\n"
            "DTSTART:20260415T100000\r\n"
            "SUMMARY:F54 123가1234 엔진오일 교환\r\n"
            "END:VEVENT\r\n"
            "END:VCALENDAR"
        )
        events = parse_ics_raw(ics)
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["UID"], "test@example.com")
        self.assertEqual(events[0]["DTSTART"], "20260415T100000")

    def test_line_folding_crlf(self):
        ics = "BEGIN:VEVENT\r\nSUMMARY:Long\r\n Text\r\nEND:VEVENT"
        events = parse_ics_raw(ics)
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["SUMMARY"], "LongText")

    def test_line_folding_lf(self):
        ics = "BEGIN:VEVENT\nSUMMARY:Long\n Text\nEND:VEVENT"
        events = parse_ics_raw(ics)
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["SUMMARY"], "LongText")

    def test_multiple_events(self):
        ics = (
            "BEGIN:VEVENT\nUID:a\nDTSTART:20260401T090000\nSUMMARY:A\nEND:VEVENT\n"
            "BEGIN:VEVENT\nUID:b\nDTSTART:20260402T100000\nSUMMARY:B\nEND:VEVENT"
        )
        self.assertEqual(len(parse_ics_raw(ics)), 2)

    def test_first_value_wins_for_duplicate_keys(self):
        ics = "BEGIN:VEVENT\nSUMMARY:First\nSUMMARY:Second\nEND:VEVENT"
        self.assertEqual(parse_ics_raw(ics)[0]["SUMMARY"], "First")

    def test_property_with_params(self):
        ics = "BEGIN:VEVENT\nDTSTART;TZID=Asia/Seoul:20260415T100000\nEND:VEVENT"
        self.assertEqual(parse_ics_raw(ics)[0]["DTSTART"], "20260415T100000")

    def test_value_leading_space_stripped(self):
        ics = "BEGIN:VEVENT\nSUMMARY: F56.24버9127 야근예정\nEND:VEVENT"
        self.assertEqual(parse_ics_raw(ics)[0]["SUMMARY"], "F56.24버9127 야근예정")


class TestCleanText(unittest.TestCase):
    def test_newline_escape(self):
        # ICS literal backslash-n (two chars), not actual newline
        self.assertEqual(clean_text("Hello\\nWorld"), "Hello World")

    def test_comma_escape(self):
        self.assertEqual(clean_text("A\\,B"), "A,B")

    def test_semicolon_escape(self):
        self.assertEqual(clean_text("A\\;B"), "A;B")

    def test_strip_whitespace(self):
        self.assertEqual(clean_text("  spaces  "), "spaces")

    def test_empty_string(self):
        self.assertEqual(clean_text(""), "")

    def test_none(self):
        self.assertEqual(clean_text(None), "")

    def test_carriage_return(self):
        self.assertEqual(clean_text("line\rtext"), "linetext")


class TestParseSummary(unittest.TestCase):
    def test_model_and_plate(self):
        model, plate, vin, phone, title, note = parse_summary(
            "F54 123가4567 타이밍체인커버 누유", ""
        )
        self.assertEqual(model, "F54")
        self.assertEqual(plate, "123가4567")

    def test_phone_number_removed_from_title(self):
        _, _, _, _, title, _ = parse_summary("R56 010-1234-5678 에어컨 점검", "")
        self.assertNotIn("010", title)

    def test_no_model(self):
        model, _, _, _, _, _ = parse_summary("일반 점검", "")
        self.assertEqual(model, "")

    def test_description_becomes_note(self):
        _, _, _, _, _, note = parse_summary("F54 123가4567 점검", "특이사항\\n없음")
        self.assertEqual(note, "특이사항 없음")


if __name__ == "__main__":
    unittest.main()
