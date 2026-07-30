#!/usr/bin/env python3
"""기출 PDF → 문항 단위 텍스트 추출기 (pypdf).

⚠️ 저작권: 문항 저작권은 국사편찬위원회, 사진 저작권은 원저작자에게 있다.
   여기서 나오는 텍스트는 로컬 분석(시대·단원 분류)용이며 data/exams-raw/ 밖으로 나가지 않는다.
   저장소에 커밋하는 것은 집계 수치뿐이다.

사용법:
  .venv-exam/bin/python scripts/exam-pipeline/extract_pdf.py paper  <pdf>   # 문제지 → 문항 텍스트
  .venv-exam/bin/python scripts/exam-pipeline/extract_pdf.py answer <pdf>   # 정답표 → 문항별 정답

결과는 stdout 에 JSON 한 덩어리로 출력한다.

문제지는 2단 편집이라 PDF 스트림 순서대로 읽으면 지문이 엉뚱한 문항에 붙는다.
그래서 글자마다 좌표를 받아 (단 → y 내림 → x 오름) 순으로 다시 정렬해 읽기 순서를 복원한다.
"""
import json
import re
import sys

from pypdf import PdfReader

CIRCLED = "①②③④⑤"
# 문항 시작 표시: 줄머리의 "12." (뒤에 공백/탭). 연도("1971년")·소수점과 겹치지 않게 뒤를 공백류로 제한한다.
Q_MARK = re.compile(r"(?:^|\n)\s*(\d{1,2})\.[ \t ]")


def page_reading_order(page):
    """페이지의 글자를 좌표 기반으로 읽기 순서(왼단 → 오른단)로 재배열한 문자열."""
    chunks = []  # (col, -y, x, text)
    width = float(page.mediabox.width)
    mid = width / 2

    def visitor(text, cm, tm, font_dict, font_size):
        if not text or not text.strip():
            return
        x, y = tm[4], tm[5]
        chunks.append((x, y, text))

    page.extract_text(visitor_text=visitor)
    if not chunks:
        return ""
    # y 를 줄 단위로 뭉갠다(같은 줄의 글자가 미세하게 다른 baseline 을 갖는 경우가 있다).
    out = []
    for x, y, text in chunks:
        col = 0 if x < mid else 1
        out.append((col, -round(y / 3), x, text))
    out.sort(key=lambda t: (t[0], t[1], t[2]))
    lines = []
    prev = None
    buf = []
    for col, ny, x, text in out:
        key = (col, ny)
        if prev is not None and key != prev:
            lines.append("".join(buf))
            buf = []
        buf.append(text)
        prev = key
    if buf:
        lines.append("".join(buf))
    return "\n".join(lines)


def extract_paper(path):
    reader = PdfReader(path)
    pages = []
    for page in reader.pages:
        pages.append(page_reading_order(page))
    body = "\n".join(pages)
    text_len = len(body.replace("\n", "").strip())

    # 문항 분할 — 번호가 1부터 증가하는 순서만 채택한다(지문 속 숫자에 오탐하지 않도록).
    marks = []
    expected = 1
    for m in Q_MARK.finditer(body):
        no = int(m.group(1))
        if no == expected:
            marks.append((no, m.start(1)))
            expected += 1
    questions = []
    for i, (no, start) in enumerate(marks):
        end = marks[i + 1][1] if i + 1 < len(marks) else len(body)
        questions.append({"no": no, "text": body[start:end].strip()})
    return {
        "pageCount": len(reader.pages),
        "textLength": text_len,
        "questions": questions,
    }


def extract_answer(path):
    reader = PdfReader(path)
    raw = "\n".join((p.extract_text() or "") for p in reader.pages)
    # 정답표는 5열 표라 추출 텍스트가 "1③111④221④2..." 처럼 붙어 나온다.
    # (문항번호)(정답 ①~⑤)(배점) 세 쪽을 순서대로 훑는다. 빈도표 부분은 잘라낸다.
    cut = min(
        (i for i in (raw.find("빈도표"), raw.find("답지번호별")) if i > 0),
        default=len(raw),
    )
    head = raw[:cut]
    answers = {}
    for m in re.finditer(r"(\d{1,2})([" + CIRCLED + r"])(\d)?", head):
        no = int(m.group(1))
        if 1 <= no <= 50 and no not in answers:
            answers[no] = CIRCLED.index(m.group(2)) + 1
    return {"answers": answers, "textLength": len(raw.replace("\n", "").strip())}


def main():
    mode, path = sys.argv[1], sys.argv[2]
    result = extract_paper(path) if mode == "paper" else extract_answer(path)
    json.dump(result, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
