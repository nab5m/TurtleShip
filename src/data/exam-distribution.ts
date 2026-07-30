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
      "eraId": "paleolithic",
      "name": "구석기",
      "questions": 6,
      "percent": 0.5
    },
    {
      "eraId": "neolithic",
      "name": "신석기",
      "questions": 7,
      "percent": 0.6
    },
    {
      "eraId": "bronze",
      "name": "청동기",
      "questions": 11,
      "percent": 1
    },
    {
      "eraId": "iron",
      "name": "철기",
      "questions": 1,
      "percent": 0.1
    },
    {
      "eraId": "gojoseon",
      "name": "고조선",
      "questions": 12,
      "percent": 1.1
    },
    {
      "eraId": "confederacy",
      "name": "연맹왕국",
      "questions": 20,
      "percent": 1.8
    },
    {
      "eraId": "three-kingdoms",
      "name": "삼국시대",
      "questions": 89,
      "percent": 8.1
    },
    {
      "eraId": "north-south",
      "name": "남북국시대",
      "questions": 67,
      "percent": 6.1
    },
    {
      "eraId": "later-three",
      "name": "후삼국시대",
      "questions": 22,
      "percent": 2
    },
    {
      "eraId": "goryeo",
      "name": "고려",
      "questions": 179,
      "percent": 16.4
    },
    {
      "eraId": "early-joseon",
      "name": "조선전기",
      "questions": 110,
      "percent": 10.1
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
      "questions": 144,
      "percent": 13.2
    },
    {
      "eraId": "colonial",
      "name": "일제강점기",
      "questions": 174,
      "percent": 15.9
    },
    {
      "eraId": "modern",
      "name": "현대",
      "questions": 136,
      "percent": 12.4
    }
  ],
  "byStage": [
    {
      "stageId": "prehistory",
      "name": "선사 시대",
      "questions": 25,
      "percent": 2.3
    },
    {
      "stageId": "gojoseon-confederacy",
      "name": "고조선과 연맹 왕국",
      "questions": 32,
      "percent": 2.9
    },
    {
      "stageId": "three-kingdoms",
      "name": "삼국 시대",
      "questions": 89,
      "percent": 8.1
    },
    {
      "stageId": "north-south",
      "name": "남북국 시대",
      "questions": 67,
      "percent": 6.1
    },
    {
      "stageId": "goryeo",
      "name": "후삼국과 고려",
      "questions": 201,
      "percent": 18.4
    },
    {
      "stageId": "early-joseon",
      "name": "조선 전기",
      "questions": 110,
      "percent": 10.1
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
      "questions": 144,
      "percent": 13.2
    },
    {
      "stageId": "colonial",
      "name": "일제 강점기",
      "questions": 174,
      "percent": 15.9
    },
    {
      "stageId": "modern",
      "name": "현대",
      "questions": 136,
      "percent": 12.4
    }
  ],
  "premodern": {
    "questions": 639,
    "percent": 58.5
  },
  "modern": {
    "questions": 454,
    "percent": 41.5
  },
  "byUnit": {
    "1": 8,
    "2": 7,
    "3": 12,
    "4": 1,
    "5": 6,
    "6": 8,
    "7": 9,
    "8": 13,
    "9": 6,
    "10": 5,
    "11": 5,
    "12": 8,
    "13": 1,
    "14": 6,
    "15": 5,
    "16": 6,
    "17": 4,
    "18": 16,
    "19": 2,
    "20": 19,
    "21": 10,
    "22": 11,
    "23": 9,
    "24": 9,
    "25": 6,
    "26": 10,
    "27": 12,
    "28": 11,
    "29": 13,
    "30": 5,
    "31": 14,
    "32": 9,
    "33": 3,
    "34": 13,
    "35": 15,
    "36": 16,
    "37": 9,
    "38": 12,
    "39": 5,
    "40": 8,
    "41": 15,
    "42": 15,
    "43": 32,
    "44": 10,
    "45": 10,
    "46": 14,
    "47": 17,
    "48": 6,
    "49": 20,
    "50": 9,
    "51": 4,
    "53": 10,
    "54": 12,
    "55": 21,
    "56": 7,
    "57": 16,
    "58": 7,
    "59": 14,
    "60": 5,
    "61": 9,
    "62": 16,
    "63": 5,
    "64": 16,
    "65": 1,
    "66": 18,
    "67": 14,
    "68": 12,
    "69": 8,
    "70": 15,
    "71": 16,
    "72": 22,
    "73": 42,
    "74": 11,
    "75": 27,
    "76": 12,
    "77": 5,
    "78": 6,
    "79": 8,
    "80": 42,
    "81": 23,
    "82": 21,
    "83": 14,
    "84": 18,
    "85": 16,
    "86": 13,
    "87": 13,
    "88": 28,
    "89": 19,
    "90": 32
  }
};
