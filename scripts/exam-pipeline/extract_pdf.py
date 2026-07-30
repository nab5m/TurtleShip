#!/usr/bin/env python3
"""기출 PDF → 문항 단위 텍스트 / 정답표 추출기.

⚠️ 저작권: 문항 저작권은 국사편찬위원회, 사진 저작권은 원저작자에게 있다.
   여기서 나오는 텍스트는 시대·단원 분류를 위한 **로컬 분석용**이며 data/exams-raw/ 밖으로
   내보내지 않는다. 저장소에 커밋하는 것은 집계 수치(횟수·비율)뿐이다.

사용법:
  .venv-exam/bin/python scripts/exam-pipeline/extract_pdf.py answer <pdf>   # 정답표 → 문항별 정답
  .venv-exam/bin/python scripts/exam-pipeline/extract_pdf.py ocr    <pdf>   # 문제지 → 문항 텍스트 (OCR)
  .venv-exam/bin/python scripts/exam-pipeline/extract_pdf.py paper  <pdf>   # 문제지 → 문항 텍스트 (PDF 텍스트 레이어)
결과는 stdout 에 JSON 으로 출력한다.

왜 OCR 이 기본인가:
  - 22회차 중 14회차(78·74·73·69·68·67·66·65·64·63·61·60·59·57)는 문제지가 이미지로만 되어
    있어 텍스트 레이어가 아예 없다.
  - 텍스트 레이어가 있는 8회차도 2단 편집 + 폼 XObject 때문에 글자 좌표가 일부 (0,0)/음수로
    나와 "지문이 어느 문항 것인지" 붙이기가 불안정하다.
  - macOS Vision(ko-KR) OCR 은 줄 단위 bounding box 를 주므로 단(column) 분리와 문항 경계를
    좌표로 정확히 나눌 수 있다. 22회차 전부 같은 방법으로 처리해 회차 간 편차를 없앤다.
  - Vision 은 pip 로만 설치되는 pyobjc 로 호출한다(시스템 패키지 설치 없음).
    tesseract/poppler 같은 시스템 바이너리는 이 저장소 작업 범위에서 설치하지 않는다.
"""
import json
import re
import sys

CIRCLED = "①②③④⑤"

# ---------------------------------------------------------------- 정답표

# 심화 정답표는 5열 × 10행 표이고, 읽기 순서는 1, 11, 21, 31, 41, 2, 12, ... 순이다.
ANSWER_ORDER = [row + 10 * col for row in range(1, 11) for col in range(5)]


def parse_answer_table(raw):
    """정답표 텍스트 → {문항번호: 정답(1~5)}.

    추출 텍스트는 회차마다 형태가 다르다(원문자 ①~⑤ / 맨숫자 1~5, 구분 공백 있음/없음).
    표 순서를 알고 있으므로 "다음 문항번호 → 정답 → 배점" 을 순서대로 소비하며 파싱하고,
    배점 합계가 100점인지로 검증한다(심화 = 50문항 100점). 시작 위치는 앞머리 잡음
    (머리글·양식 표시)을 건너뛰기 위해 순차 탐색한다.
    """
    s = re.sub(r"\s+", "", raw)

    def attempt(start):
        i = start
        answers = {}
        points = 0
        for no in ANSWER_ORDER:
            token = str(no)
            if not s.startswith(token, i):
                return None
            i += len(token)
            if s.startswith("없음", i):  # 문항 이의심사로 '정답 없음' 처리된 문항
                i += 2
                answer = None
            elif i < len(s) and s[i] in CIRCLED:
                answer = CIRCLED.index(s[i]) + 1
                i += 1
            elif i < len(s) and s[i] in "12345":
                answer = int(s[i])
                i += 1
            else:
                return None
            if i >= len(s) or s[i] not in "123":  # 배점 1~3점
                return None
            points += int(s[i])
            i += 1
            if answer:
                answers[no] = answer
        return (answers, points) if points == 100 else None

    for start in range(0, min(len(s), 400)):
        got = attempt(start)
        if got:
            return got
    return ({}, 0)


def extract_answer(path):
    from pypdf import PdfReader

    reader = PdfReader(path)
    raw = "\n".join((p.extract_text() or "") for p in reader.pages)
    answers, points = parse_answer_table(raw)
    return {
        "answers": answers,
        "totalPoints": points,  # 100 이면 정상 파싱
        "textLength": len(raw.replace("\n", "").strip()),
    }


# ---------------------------------------------------------------- 문제지 (OCR)

# 문항 머리: "12." / "12," (OCR 이 마침표를 쉼표로 읽는 경우가 있다) + 곧바로 한글/괄호로 시작하는 발문.
# 배점 표시가 같은 줄에 붙어 나오는 경우가 있어("[1점] 49. 다음 …") 줄 중간도 찾는다.
Q_HEAD = re.compile(r"(?:^|[\s\]})])(\d{1,2})\s*[.,]\s*(?=[^\d\s])")
# 머리글·꼬리말(모든 페이지 반복) 제거용
NOISE = re.compile(r"한국사능력검정시험|^\s*\d{1,2}\s*$|^\s*\[\d점\]\s*$|^\s*[(\[]\d점[)\]]\s*$")


def render_page(pdf_path, pageno, scale):
    import Quartz
    from Foundation import NSURL

    url = NSURL.fileURLWithPath_(pdf_path)
    doc = Quartz.CGPDFDocumentCreateWithURL(url)
    if doc is None:
        raise RuntimeError(f"PDF 열기 실패: {pdf_path}")
    page = Quartz.CGPDFDocumentGetPage(doc, pageno)
    rect = Quartz.CGPDFPageGetBoxRect(page, Quartz.kCGPDFMediaBox)
    width = int(rect.size.width * scale)
    height = int(rect.size.height * scale)
    space = Quartz.CGColorSpaceCreateDeviceRGB()
    ctx = Quartz.CGBitmapContextCreate(
        None, width, height, 8, 0, space, Quartz.kCGImageAlphaNoneSkipLast
    )
    Quartz.CGContextSetRGBFillColor(ctx, 1, 1, 1, 1)
    Quartz.CGContextFillRect(ctx, Quartz.CGRectMake(0, 0, width, height))
    Quartz.CGContextScaleCTM(ctx, scale, scale)
    Quartz.CGContextDrawPDFPage(ctx, page)
    return Quartz.CGBitmapContextCreateImage(ctx), Quartz.CGPDFDocumentGetNumberOfPages(doc)


def ocr_lines(cgimage):
    """이미지 → [(문자열, x, y, w)] (좌표는 좌하단 원점 정규화 0~1)."""
    import Vision

    request = Vision.VNRecognizeTextRequest.alloc().init()
    request.setRecognitionLevel_(0)  # 0 = accurate
    request.setRecognitionLanguages_(["ko-KR", "en-US"])
    request.setUsesLanguageCorrection_(True)
    handler = Vision.VNImageRequestHandler.alloc().initWithCGImage_options_(cgimage, None)
    handler.performRequests_error_([request], None)
    lines = []
    for observation in request.results() or []:
        box = observation.boundingBox()
        candidate = observation.topCandidates_(1)
        if not candidate:
            continue
        lines.append(
            (candidate[0].string(), box.origin.x, box.origin.y, box.size.width)
        )
    return lines


def crop(cgimage, left_ratio, right_ratio):
    import Quartz

    width = Quartz.CGImageGetWidth(cgimage)
    height = Quartz.CGImageGetHeight(cgimage)
    x0 = int(width * left_ratio)
    x1 = int(width * right_ratio)
    return Quartz.CGImageCreateWithImageInRect(
        cgimage, Quartz.CGRectMake(x0, 0, x1 - x0, height)
    )


# 단(column) 경계 — 문제지는 좌우 2단이고 가운데 여백이 이 비율 근처에 있다.
GUTTER = 0.495


def page_blocks(cgimage):
    """페이지를 좌·우 단으로 잘라 각각 OCR 한 뒤 읽기 순서로 이어 붙인다.

    페이지 전체를 한 번에 OCR 하면 Vision 이 좌우 단의 같은 높이 줄을 한 줄로 합쳐 버려
    ("5. …옳은 것은? [2점] 8. 다음 자료에…") 문항 경계가 무너진다. 단별로 잘라서 넘긴다.
    (실측: 머리글을 빼면 좌우 단을 가로지르는 줄은 없다 — 869줄 중 0줄)
    """
    lines = []
    for left, right in ((0.0, GUTTER), (GUTTER, 1.0)):
        column = [
            (text.strip(), y)
            for text, x, y, w in ocr_lines(crop(cgimage, left, right))
            if text.strip() and 0.02 < y < 0.965
        ]
        column.sort(key=lambda t: -t[1])
        lines.extend(text for text, _ in column)
    return lines


def extract_ocr(path, scale=2.0):
    _, page_count = render_page(path, 1, scale)
    all_lines = []
    for pageno in range(1, page_count + 1):
        image, _ = render_page(path, pageno, scale)
        all_lines.extend(page_blocks(image))

    # 문항 분할 — 번호가 증가하는 머리만 채택한다(자료 속 숫자에 오탐하지 않도록).
    # OCR 이 머리 한 개를 놓치면(예: "32.~@에 대한…") 그 뒤 문항이 전부 밀리므로
    # 다음 번호까지 3칸 앞서는 것은 허용하고, 건너뛴 번호는 missing 으로 기록한다.
    questions = []
    missing = []
    expected = 1
    current = None
    for line in all_lines:
        rest = line
        while rest:
            head = next(
                (
                    m
                    for m in Q_HEAD.finditer(rest)
                    if expected <= int(m.group(1)) <= min(expected + 3, 50)
                ),
                None,
            )
            if head is None:
                if current is not None and not NOISE.search(rest):
                    current["lines"].append(rest)
                break
            before = rest[: head.start()].strip()
            if before and current is not None and not NOISE.search(before):
                current["lines"].append(before)
            no = int(head.group(1))
            if no > expected:  # 머리를 놓친 문항 — 그 본문은 앞 문항에 섞여 들어간다
                missing.extend(range(expected, no))
                if current is not None:
                    current["merged"] = True
            current = {"no": no, "lines": [], "merged": False}
            questions.append(current)
            expected = no + 1
            rest = rest[head.end() :].strip()  # 남은 부분은 다음 회전에서 처리(한 줄에 머리 2개도 대응)
    if expected <= 50:  # 마지막 문항들의 머리를 놓친 경우
        missing.extend(range(expected, 51))
        if current is not None:
            current["merged"] = True
    return {
        "pageCount": page_count,
        "lineCount": len(all_lines),
        "missing": missing,
        "questions": [
            {"no": q["no"], "text": "\n".join(q["lines"]).strip(), "merged": q["merged"]}
            for q in questions
        ],
    }


# ---------------------------------------------------------------- 문제지 (텍스트 레이어)


def extract_paper_text(path):
    """PDF 텍스트 레이어에서 문항을 뽑는다 (OCR 결과 교차 검증용).

    스트림 순서는 "문항 머리 + 선택지 5개" 가 붙어 나오고 지문 상자는 그 뒤에 따라온다.
    지문이 다른 문항 블록에 섞일 수 있어 정확도가 OCR 경로보다 낮다.
    """
    from pypdf import PdfReader

    reader = PdfReader(path)
    body = "\n".join((p.extract_text() or "") for p in reader.pages)
    body = body.replace("\t", " ")
    marks = []
    expected = 1
    for m in re.finditer(r"(?:^|\n)\s*(\d{1,2})\.\s", body):
        if int(m.group(1)) == expected:
            marks.append(m.start(1))
            expected += 1
    questions = []
    for i, start in enumerate(marks):
        end = marks[i + 1] if i + 1 < len(marks) else len(body)
        questions.append({"no": i + 1, "text": body[start:end].strip()})
    return {
        "pageCount": len(reader.pages),
        "textLength": len(body.replace("\n", "").strip()),
        "questions": questions,
    }


def main():
    mode, path = sys.argv[1], sys.argv[2]
    if mode == "answer":
        result = extract_answer(path)
    elif mode == "ocr":
        result = extract_ocr(path)
    elif mode == "paper":
        result = extract_paper_text(path)
    else:
        raise SystemExit(f"알 수 없는 모드: {mode}")
    json.dump(result, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
