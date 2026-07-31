// 자동 생성 파일 — scripts/gen-exam-frequency.ts 가 생성합니다. 직접 수정하지 마세요.
// 한국사능력검정시험 '심화' 기출의 시대별·단계별 출제 비율 (실측).
//
// 측정 대상: 심화 22개 회차 1093문항 (78회, 77회, 76회, 75회, 74회, 73회, 72회, 71회, 70회, 69회, 68회, 67회, 66회, 65회, 64회, 63회, 62회, 61회, 60회, 59회, 58회, 57회).
// 방법: 문제지를 OCR(macOS Vision, ko-KR)로 읽어 문항 단위로 자르고, 앱의 단원 제목·topics·
//      카드 제목·keywords 로 만든 사전에 키워드 매칭해 시대(ERAS)·단계(STAGES)에 배정한다.
//      발문·지문에 가장 큰 가중치, 정답 선택지에 그 다음, 오답 선택지에 가장 작은 가중치를 준다.
//      percent 는 분류에 성공한 문항(classified) 대비 비율이다.
// 한계: 여러 시대를 한 문항에서 묻는 통합형은 한쪽으로만 집계되고, 사진·지도만으로 성립하는
//      문항은 분류되지 않을 수 있다(unclassified).
//
// 출처: 국사편찬위원회 한국사능력검정시험 시험 자료실(historyexam.go.kr) '심화' 기출.
// 문항 저작권은 국사편찬위원회, 사진 저작권은 원저작자에게 있다. 개인적인 학습 목적 외의
// 영리 목적(출판·온라인 이용 등) 이용은 사단법인 한국복제전송저작권협회와 협의가 필요하다.
// → 그래서 원본 PDF·문항 지문·선택지 텍스트는 저장소에 두지 않고(data/exams-raw/ 는 gitignore),
//   이 파일처럼 횟수·비율만 남긴 집계 데이터만 커밋한다.
import type { EraId, StageId } from "@/lib/types";

export interface ExamEraShare { eraId: EraId; name: string; questions: number; percent: number }
export interface ExamStageShare { stageId: StageId; name: string; questions: number; percent: number }
export interface ExamGroupShare { questions: number; percent: number }
export interface ExamDistribution {
  examCount: number;
  rounds: string[];
  hoe: number[];
  questionTotal: number;
  classified: number;
  unclassified: number;
  byEra: ExamEraShare[];
  byStage: ExamStageShare[];
  premodern: ExamGroupShare;
  modern: ExamGroupShare;
  byUnit: Record<number, number>;
}

export const EXAM_DISTRIBUTION: ExamDistribution = {
  "examCount": 22,
  "rounds": [
    "26년 2회",
    "26년 1회",
    "25년 4회",
    "25년 3회",
    "25년 2회",
    "25년 1회",
    "24년 4회",
    "24년 3회",
    "24년 2회",
    "24년 1회",
    "23년 6회",
    "23년 5회",
    "23년 4회",
    "23년 3회",
    "23년 2회",
    "23년 1회",
    "22년 6회",
    "22년 5회",
    "22년 4회",
    "22년 3회",
    "22년 2회",
    "22년 1회"
  ],
  "hoe": [
    78,
    77,
    76,
    75,
    74,
    73,
    72,
    71,
    70,
    69,
    68,
    67,
    66,
    65,
    64,
    63,
    62,
    61,
    60,
    59,
    58,
    57
  ],
  "questionTotal": 1093,
  "classified": 1093,
  "unclassified": 0,
  "byEra": [
    {
      "eraId": "prehistory",
      "name": "선사",
      "questions": 24,
      "percent": 2.2
    },
    {
      "eraId": "gojoseon",
      "name": "고조선",
      "questions": 10,
      "percent": 0.9
    },
    {
      "eraId": "confederacy",
      "name": "연맹왕국",
      "questions": 23,
      "percent": 2.1
    },
    {
      "eraId": "three-kingdoms",
      "name": "삼국시대",
      "questions": 84,
      "percent": 7.7
    },
    {
      "eraId": "north-south",
      "name": "남북국시대",
      "questions": 63,
      "percent": 5.8
    },
    {
      "eraId": "later-three",
      "name": "후삼국시대",
      "questions": 19,
      "percent": 1.7
    },
    {
      "eraId": "goryeo",
      "name": "고려",
      "questions": 185,
      "percent": 16.9
    },
    {
      "eraId": "early-joseon",
      "name": "조선전기",
      "questions": 107,
      "percent": 9.8
    },
    {
      "eraId": "late-joseon",
      "name": "조선후기",
      "questions": 115,
      "percent": 10.5
    },
    {
      "eraId": "open-port",
      "name": "개항기",
      "questions": 154,
      "percent": 14.1
    },
    {
      "eraId": "colonial",
      "name": "일제강점기",
      "questions": 171,
      "percent": 15.6
    },
    {
      "eraId": "modern",
      "name": "현대",
      "questions": 138,
      "percent": 12.6
    }
  ],
  "byStage": [
    {
      "stageId": "prehistory",
      "name": "선사 시대",
      "questions": 24,
      "percent": 2.2
    },
    {
      "stageId": "gojoseon-confederacy",
      "name": "고조선과 연맹 왕국",
      "questions": 33,
      "percent": 3
    },
    {
      "stageId": "three-kingdoms",
      "name": "삼국 시대",
      "questions": 84,
      "percent": 7.7
    },
    {
      "stageId": "north-south",
      "name": "남북국 시대",
      "questions": 63,
      "percent": 5.8
    },
    {
      "stageId": "goryeo",
      "name": "후삼국과 고려",
      "questions": 204,
      "percent": 18.7
    },
    {
      "stageId": "early-joseon",
      "name": "조선 전기",
      "questions": 107,
      "percent": 9.8
    },
    {
      "stageId": "late-joseon",
      "name": "조선 후기",
      "questions": 115,
      "percent": 10.5
    },
    {
      "stageId": "open-port",
      "name": "개항기",
      "questions": 154,
      "percent": 14.1
    },
    {
      "stageId": "colonial",
      "name": "일제 강점기",
      "questions": 171,
      "percent": 15.6
    },
    {
      "stageId": "modern",
      "name": "현대",
      "questions": 138,
      "percent": 12.6
    }
  ],
  "premodern": {
    "questions": 630,
    "percent": 57.6
  },
  "modern": {
    "questions": 463,
    "percent": 42.4
  },
  "byUnit": {
    "1": 28,
    "5": 3,
    "6": 7,
    "7": 13,
    "8": 16,
    "9": 5,
    "10": 5,
    "11": 2,
    "12": 8,
    "13": 2,
    "14": 6,
    "15": 3,
    "16": 7,
    "17": 3,
    "18": 17,
    "19": 5,
    "20": 18,
    "21": 10,
    "22": 12,
    "23": 9,
    "24": 10,
    "25": 6,
    "26": 9,
    "27": 8,
    "28": 9,
    "29": 14,
    "30": 6,
    "31": 11,
    "32": 7,
    "33": 4,
    "34": 12,
    "35": 14,
    "36": 17,
    "37": 13,
    "38": 11,
    "39": 4,
    "40": 8,
    "41": 16,
    "42": 19,
    "43": 29,
    "44": 9,
    "45": 8,
    "46": 15,
    "47": 15,
    "48": 4,
    "49": 20,
    "50": 12,
    "51": 3,
    "53": 14,
    "54": 10,
    "55": 22,
    "56": 7,
    "57": 15,
    "58": 7,
    "59": 14,
    "60": 5,
    "61": 9,
    "62": 16,
    "63": 5,
    "64": 17,
    "65": 1,
    "66": 18,
    "67": 13,
    "68": 14,
    "69": 10,
    "70": 15,
    "71": 12,
    "72": 25,
    "73": 48,
    "74": 9,
    "75": 29,
    "76": 11,
    "77": 7,
    "78": 6,
    "79": 7,
    "80": 41,
    "81": 21,
    "82": 19,
    "83": 15,
    "84": 16,
    "85": 17,
    "86": 13,
    "87": 13,
    "88": 25,
    "89": 21,
    "90": 34
  }
};
