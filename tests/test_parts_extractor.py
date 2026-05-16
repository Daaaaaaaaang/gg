import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.parts.extractor import extract_parts, PART_KEYWORDS, PART_BLACKLIST


class TestExtractParts(unittest.TestCase):
    def test_engine_mount(self):
        self.assertIn("마운트세트", extract_parts("마운트세트 교체 작업"))

    def test_timing_chain_cover(self):
        self.assertTrue(len(extract_parts("타이밍체인커버 누유 수리")) > 0)

    def test_water_pump(self):
        self.assertTrue(len(extract_parts("워터펌프 교체")) > 0)

    def test_hub_bearing(self):
        self.assertIn("허브베어링", extract_parts("허브베어링 교체"))

    def test_belt_set(self):
        self.assertIn("벨트세트", extract_parts("벨트세트 교환 작업"))

    def test_no_parts(self):
        self.assertEqual(extract_parts("일반 점검 작업"), [])

    def test_empty_title(self):
        self.assertEqual(extract_parts(""), [])

    def test_multiple_parts(self):
        self.assertGreaterEqual(len(extract_parts("마운트세트 및 벨트세트 교체")), 2)

    def test_blacklist_dct_mission_oil(self):
        self.assertNotIn("DCT미션오일", extract_parts("DCT미션오일 교환"))

    def test_blacklist_brake_pad(self):
        self.assertNotIn("브레이크패드", extract_parts("브레이크패드 교환"))

    def test_no_duplicate_substrings(self):
        parts = extract_parts("마운트세트 마운트 세트 작업")
        labels = [p.lower() for p in parts]
        for i, a in enumerate(labels):
            for j, b in enumerate(labels):
                if i != j:
                    self.assertFalse(a in b or b in a, f"중복 서브셋: {a!r} / {b!r}")


class TestKeywordsAndBlacklist(unittest.TestCase):
    def test_keywords_not_empty(self):
        self.assertTrue(len(PART_KEYWORDS) > 0)

    def test_blacklist_not_empty(self):
        self.assertTrue(len(PART_BLACKLIST) > 0)

    def test_keywords_are_strings(self):
        self.assertTrue(all(isinstance(k, str) for k in PART_KEYWORDS))

    def test_blacklist_are_strings(self):
        self.assertTrue(all(isinstance(b, str) for b in PART_BLACKLIST))


if __name__ == "__main__":
    unittest.main()
