"""
ical_to_html.py  —  정비 일정 HTML 생성기

함수로 import해서 사용하거나, CLI로 직접 실행할 수 있습니다.

  # import 방식 (main.py에서 사용)
  from ical_to_html import generate_html
  generate_html("calendar.ics", "index.html")

  # CLI 방식
  python ical_to_html.py                      # 현재 폴더 ics 자동 감지
  python ical_to_html.py ./폴더경로           # 폴더 지정
  python ical_to_html.py ./폴더 -o 결과.html  # 출력 파일명 지정
"""

import sys
import os
import argparse
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

from src.parser.ics_parser import load_ics_folder
from src.builder.html_builder import build_html


def generate_html(ics_path: str | Path, output_path: str | Path = "index.html") -> bool:
    """
    ics_path의 ics 파일을 파싱해 output_path에 HTML을 생성한다.

    Args:
        ics_path:    ICS 파일 경로 (파일 또는 폴더 경로 모두 허용)
        output_path: 출력 HTML 경로 (기본값: index.html)

    Returns:
        True  - 성공
        False - 파싱된 일정 없음 또는 경로 오류
    """
    ics_path = Path(ics_path)
    output_path = Path(output_path)

    # 파일이 주어지면 그 파일이 있는 폴더를 사용
    if ics_path.is_file():
        folder = str(ics_path.parent)
    elif ics_path.is_dir():
        folder = str(ics_path)
    else:
        print(f"[오류] '{ics_path}'를 찾을 수 없습니다.")
        return False

    jobs = load_ics_folder(folder)
    if not jobs:
        print(f"[오류] '{folder}'에서 파싱된 일정이 없습니다.")
        return False

    html = build_html(jobs)
    output_path.write_text(html, encoding="utf-8")

    print(f"[HTML] 완료: {output_path} ({len(jobs)}개 일정)")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="ical → 정비 일정 HTML 생성기",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
사용 예:
  python ical_to_html.py                        # 현재 폴더 ics 자동 감지
  python ical_to_html.py C:/Users/me/calendar   # 폴더 지정
  python ical_to_html.py ./cal -o 4월일정.html  # 출력 파일명 지정
        """,
    )
    parser.add_argument(
        "folder",
        nargs="?",
        default=".",
        help="ics 파일 폴더 (기본값: 현재 폴더)",
    )
    parser.add_argument(
        "-o",
        "--output",
        default="index.html",
        help="출력 HTML 파일명",
    )
    args = parser.parse_args()

    if not os.path.isdir(args.folder):
        print("[오류] '%s'는 유효한 폴더가 아닙니다." % args.folder)
        sys.exit(1)

    if not generate_html(args.folder, args.output):
        sys.exit(1)

    print("\n✅ 완료! → " + args.output)
    print("   브라우저로 열거나 gh-pages에 배포하세요.")


if __name__ == "__main__":
    main()
