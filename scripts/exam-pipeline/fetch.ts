// 기출 문제지·정답표 PDF 수집기 (국사편찬위원회 시험 자료실).
//
// ⚠️ 저작권: 문항 저작권은 국사편찬위원회, 사진 저작권은 원저작자에게 있다.
//    개인적인 학습 목적 외의 영리 목적(출판·온라인 이용 등)은 한국복제전송저작권협회와 협의가 필요하다.
//    따라서 이 스크립트가 내려받는 PDF 와 추출 텍스트는 **로컬 분석 산출물**이며
//    `data/exams-raw/` (gitignore 됨) 밖으로 나가지 않는다. 저장소에 커밋하는 것은
//    집계 수치(횟수·분류·비율)뿐이다.
//
// 자료실은 정적 HTML 에 다운로드 링크를 노출하지 않는다. 실제 요청 흐름은 다음과 같다.
//   1) POST /pst/list.do?bbs=dat  (pageIndex, pageUnit) → 목록 HTML, 각 행에 fn_goDetail('<pst_sno>','BBS0003')
//   2) POST /pst/view.do?bbs=dat  (pst_sno) → 상세 HTML, 첨부에 fnFileDownload('<atch_file_id>')
//   3) GET  /atchFile/FileDown.do?atch_file_id=<atch_file_id> → PDF 바이트
// NetFunnel(대기열) 키는 이 세 요청에 필수가 아니라서 그대로 호출한다.
import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { EXAM_RAW_DIR, PDF_DIR, sleep, type ExamPaper } from "./shared";

const BASE = "https://www.historyexam.go.kr";
const LIST_URL = `${BASE}/pst/list.do?bbs=dat`;
const VIEW_URL = `${BASE}/pst/view.do?bbs=dat`;
const DOWN_URL = `${BASE}/atchFile/FileDown.do`;
// 예의: 순차 요청 + 요청 간 대기. 자료실은 대기열(NetFunnel)이 걸린 공공 사이트다.
const DELAY_MS = 900;
// 헤더는 ByteString 이라 한글을 넣을 수 없다(Node fetch 가 거부한다) → 영문만.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 korean-history-study-app/1.0 (personal study use)";

async function postForm(url: string, body: Record<string, string>): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: LIST_URL,
    },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) throw new Error(`POST ${url} → ${res.status}`);
  return res.text();
}

type ListRow = { sno: string; title: string };

// 목록 4페이지(총 35건, 심화·기본 혼재)에서 게시글 번호와 제목을 모은다.
async function fetchList(): Promise<ListRow[]> {
  const rows: ListRow[] = [];
  for (let page = 1; page <= 10; page++) {
    const html = await postForm(LIST_URL, {
      pst_sno: "0",
      pageIndex: String(page),
      searchCondition: "pstTitle",
      searchKeyword: "",
      pageUnit: "10",
    });
    const found = [...html.matchAll(/fn_goDetail\('(\d+)','BBS0003'\);">([^<]+)<\/a>/g)].map(
      (m) => ({ sno: m[1], title: m[2].trim() })
    );
    rows.push(...found);
    const total = /현재페이지 : \(<span class="question_con4_3">\d+<\/span> \/ (\d+)\)/.exec(html);
    const lastPage = total ? Number(total[1]) : page;
    console.log(`  목록 ${page}/${lastPage} 페이지 — ${found.length}건`);
    if (page >= lastPage) break;
    await sleep(DELAY_MS);
  }
  return rows;
}

// "제78회 한국사능력검정시험 심화 문제지와 정답표" → 78
function hoeOf(title: string): number | undefined {
  const m = /제(\d+)회/.exec(title);
  return m ? Number(m[1]) : undefined;
}

type Attachment = { id: string; name: string };

async function fetchAttachments(sno: string): Promise<Attachment[]> {
  const html = await postForm(VIEW_URL, {
    pst_sno: sno,
    pageIndex: "1",
    searchCondition: "pstTitle",
    searchKeyword: "",
    pageUnit: "10",
  });
  return [...html.matchAll(/fnFileDownload\('([^']+)'\)">\s*([^<]+?)\s*&nbsp;/g)].map((m) => ({
    id: m[1],
    name: m[2].trim(),
  }));
}

async function download(atchFileId: string, dest: string): Promise<number> {
  const res = await fetch(`${DOWN_URL}?atch_file_id=${encodeURIComponent(atchFileId)}`, {
    headers: { "User-Agent": UA, Referer: VIEW_URL },
  });
  if (!res.ok) throw new Error(`download ${atchFileId} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.subarray(0, 4).toString("latin1") !== "%PDF") {
    throw new Error(`download ${atchFileId} → PDF 아님 (${buf.length} bytes)`);
  }
  writeFileSync(dest, buf);
  return buf.length;
}

// 첨부 두 개 중 어느 쪽이 문제지이고 어느 쪽이 정답표인지 파일명으로 가른다.
// (회차마다 이름이 제각각이다: "문제지"/"시험지", "답지"/"정답지"/"정답표")
function pickPapers(files: Attachment[]): { paper?: Attachment; answer?: Attachment } {
  const paper = files.find((f) => /문제지|시험지/.test(f.name));
  const answer = files.find((f) => /답지|정답/.test(f.name));
  return { paper, answer };
}

export async function fetchExams(opts: { force: boolean }): Promise<ExamPaper[]> {
  mkdirSync(PDF_DIR, { recursive: true });
  console.log("[1/4] 시험 자료실 목록 수집");
  const rows = await fetchList();
  // 심화만. (기본은 난도·문항 구성이 달라 심화 출제 비중 분석에 섞을 수 없다)
  const deepRows = rows.filter((r) => r.title.includes("심화"));
  console.log(`  전체 ${rows.length}건 중 심화 ${deepRows.length}건`);

  const papers: ExamPaper[] = [];
  for (const row of deepRows) {
    const hoe = hoeOf(row.title);
    if (hoe === undefined) {
      console.warn(`  ! 회차 파싱 실패 — ${row.title}`);
      continue;
    }
    const paperPath = join(PDF_DIR, `${hoe}-paper.pdf`);
    const answerPath = join(PDF_DIR, `${hoe}-answer.pdf`);
    const have = (p: string) => existsSync(p) && statSync(p).size > 10_000;
    if (!opts.force && have(paperPath) && have(answerPath)) {
      papers.push({ hoe, title: row.title, paperPath, answerPath });
      console.log(`  ${hoe}회 — 이미 있음 (건너뜀)`);
      continue;
    }
    await sleep(DELAY_MS);
    const files = await fetchAttachments(row.sno);
    const { paper, answer } = pickPapers(files);
    if (!paper || !answer) {
      console.warn(`  ! ${hoe}회 첨부 인식 실패 — ${files.map((f) => f.name).join(", ")}`);
      continue;
    }
    if (!have(paperPath) || opts.force) {
      await sleep(DELAY_MS);
      const n = await download(paper.id, paperPath);
      console.log(`  ${hoe}회 문제지 ${(n / 1024 / 1024).toFixed(1)}MB`);
    }
    if (!have(answerPath) || opts.force) {
      await sleep(DELAY_MS);
      const n = await download(answer.id, answerPath);
      console.log(`  ${hoe}회 정답표 ${(n / 1024).toFixed(0)}KB`);
    }
    papers.push({ hoe, title: row.title, paperPath, answerPath });
  }
  papers.sort((a, b) => b.hoe - a.hoe);
  writeFileSync(
    join(EXAM_RAW_DIR, "papers.json"),
    JSON.stringify(papers, null, 2) + "\n",
    "utf8"
  );
  return papers;
}
