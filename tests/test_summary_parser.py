import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.parser.summary_parser import parse_summary


class TestNewPlateFormats(unittest.TestCase):
    def test_new_plate_two_digit_prefix(self):
        model, plate, _, _, _, _ = parse_summary("F56.24버9127(은평)야근예정", "")
        self.assertEqual(model, "F56")
        self.assertEqual(plate, "24버9127")

    def test_new_plate_two_digit_prefix_variant(self):
        model, plate, _, _, _, _ = parse_summary("F54.54마9693(일산)야근예정", "")
        self.assertEqual(model, "F54")
        self.assertEqual(plate, "54마9693")

    def test_legacy_three_digit_prefix(self):
        model, plate, _, _, _, _ = parse_summary("F54 123가4567 타이밍체인커버 누유", "")
        self.assertEqual(model, "F54")
        self.assertEqual(plate, "123가4567")

    def test_plate_not_in_title(self):
        _, plate, _, _, title, _ = parse_summary("F56.24버9127 엔진오일 교환", "")
        self.assertEqual(plate, "24버9127")
        self.assertNotIn("24버9127", title)

    def test_no_plate(self):
        _, plate, _, _, _, _ = parse_summary("일반 점검", "")
        self.assertEqual(plate, "")


if __name__ == "__main__":
    unittest.main()
