// 자동 생성 파일 — scripts/gen-exam-frequency.ts 가 생성합니다. 직접 수정하지 마세요.
// 한국사능력검정시험 '심화' 기출의 '정답 선택지'에 각 학습 카드 주제가 출제된 횟수.
// stars = 총 출제횟수(최대 5). rounds 는 최신순. (정답이 아닌 오답 선택지는 제외)
//
// ⚠️ 커버리지: 아래 8개 회차만 반영 (문제지가 텍스트로 추출 가능한 회차).
//    제77회(26년 1회), 제76회(25년 4회), 제75회(25년 3회), 제72회(24년 4회), 제71회(24년 3회), 제70회(24년 2회), 제62회(22년 6회), 제58회(22년 2회)
//    스캔 이미지로만 제공되는 회차(2022~2023 다수 등)는 OCR 도입 시 추가 예정.
export interface ExamFreq { stars: number; total: number; rounds: { label: string; hoe: number; count: number }[] }
export const EXAM_COVERAGE = {"examCount": 8, "rounds": ["26년 1회", "25년 4회", "25년 3회", "24년 4회", "24년 3회", "24년 2회", "22년 6회", "22년 2회"], "hoe": [77, 76, 75, 72, 71, 70, 62, 58], "note": "한국사능력검정시험 심화 기출 중 텍스트 추출이 가능한 회차만 반영(스캔 이미지 회차는 추후 OCR 예정)."} as const;
export const EXAM_FREQUENCY: Record<string, ExamFreq> = {
"d03-c05": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d05-c16": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d05-c20": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d12-c20": {
"stars": 5,
"total": 6,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "25년 3회",
"hoe": 75,
"count": 2
},
{
"label": "22년 6회",
"hoe": 62,
"count": 2
},
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d24-c08": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d31-c09": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d31-c13": {
"stars": 3,
"total": 3,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
},
{
"label": "24년 4회",
"hoe": 72,
"count": 1
},
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d33-c05": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d41-c09": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d41-c10": {
"stars": 4,
"total": 4,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
},
{
"label": "24년 2회",
"hoe": 70,
"count": 1
},
{
"label": "22년 6회",
"hoe": 62,
"count": 1
},
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d45-c22": {
"stars": 3,
"total": 3,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
},
{
"label": "22년 6회",
"hoe": 62,
"count": 1
},
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d48-c06": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d49-c10": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d50-c05": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
},
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d53-c15": {
"stars": 3,
"total": 3,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
},
{
"label": "22년 6회",
"hoe": 62,
"count": 1
},
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d55-c07": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d60-c13": {
"stars": 5,
"total": 5,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 2
},
{
"label": "25년 3회",
"hoe": 75,
"count": 1
},
{
"label": "24년 4회",
"hoe": 72,
"count": 1
},
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d67-c18": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d67-c19": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d73-c11": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d75-c08": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
},
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d78-c21": {
"stars": 3,
"total": 3,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
},
{
"label": "24년 3회",
"hoe": 71,
"count": 1
},
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d79-c03": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
},
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d81-c21": {
"stars": 3,
"total": 3,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
},
{
"label": "24년 4회",
"hoe": 72,
"count": 1
},
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d88-c08": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d89-c10": {
"stars": 4,
"total": 4,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
},
{
"label": "24년 4회",
"hoe": 72,
"count": 1
},
{
"label": "24년 3회",
"hoe": 71,
"count": 1
},
{
"label": "22년 2회",
"hoe": 58,
"count": 1
}
]
},
"d08-c11": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d13-c20": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d15-c06": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d16-c05": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d19-c05": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d21-c14": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d21-c15": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d22-c12": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
},
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d23-c07": {
"stars": 3,
"total": 3,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 2
},
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d30-c04": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d31-c20": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
},
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d32-c04": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
},
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d33-c11": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d37-c12": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d43-c19": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d44-c20": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d47-c14": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
},
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d48-c11": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
},
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d48-c14": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
},
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d48-c19": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d53-c06": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d54-c16": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d66-c17": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
},
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d68-c09": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d70-c06": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d74-c04": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
},
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d81-c19": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d84-c12": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
},
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d85-c13": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
},
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d86-c05": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d88-c20": {
"stars": 5,
"total": 6,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 2
},
{
"label": "25년 4회",
"hoe": 76,
"count": 1
},
{
"label": "25년 3회",
"hoe": 75,
"count": 1
},
{
"label": "24년 2회",
"hoe": 70,
"count": 1
},
{
"label": "22년 6회",
"hoe": 62,
"count": 1
}
]
},
"d03-c12": {
"stars": 3,
"total": 3,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "24년 4회",
"hoe": 72,
"count": 1
},
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d07-c18": {
"stars": 3,
"total": 3,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "25년 3회",
"hoe": 75,
"count": 1
},
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d08-c07": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d13-c05": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
},
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d23-c18": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d29-c18": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d34-c19": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d35-c05": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d42-c06": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d46-c24": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d47-c05": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
},
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d51-c12": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d52-c03": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d52-c06": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
},
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d53-c16": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d56-c04": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
},
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d56-c09": {
"stars": 5,
"total": 5,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
},
{
"label": "24년 4회",
"hoe": 72,
"count": 1
},
{
"label": "24년 3회",
"hoe": 71,
"count": 1
},
{
"label": "24년 2회",
"hoe": 70,
"count": 2
}
]
},
"d57-c15": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d57-c16": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d62-c08": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d65-c06": {
"stars": 3,
"total": 3,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
},
{
"label": "24년 4회",
"hoe": 72,
"count": 1
},
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d69-c13": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d74-c07": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d74-c21": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d82-c14": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d84-c01": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d84-c07": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d84-c09": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d85-c05": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
},
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d85-c10": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 2회",
"hoe": 70,
"count": 1
}
]
},
"d01-c09": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
},
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d07-c03": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d08-c12": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d12-c04": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d12-c17": {
"stars": 3,
"total": 3,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 2
},
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d14-c16": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d14-c17": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
},
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d16-c16": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d18-c20": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d28-c13": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d29-c09": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d33-c12": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d36-c16": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d38-c19": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d40-c11": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d41-c01": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d42-c14": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d44-c06": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d45-c17": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
},
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d55-c14": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d56-c13": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d57-c18": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d63-c05": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d65-c01": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d66-c18": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d68-c03": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d68-c22": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d70-c23": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d71-c10": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d71-c12": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d73-c07": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d73-c22": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d73-c23": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d74-c03": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d74-c10": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d74-c11": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d74-c20": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d74-c22": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d75-c09": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d75-c18": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d75-c23": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d80-c07": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
},
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d83-c03": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d83-c05": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d87-c02": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 3회",
"hoe": 71,
"count": 1
}
]
},
"d09-c09": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d24-c19": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d26-c02": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d35-c15": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d35-c18": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d44-c18": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d45-c05": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d46-c01": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d46-c19": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d50-c02": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d52-c05": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d56-c21": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d57-c12": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d59-c06": {
"stars": 3,
"total": 3,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "25년 4회",
"hoe": 76,
"count": 1
},
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d59-c10": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d60-c07": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d66-c16": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d67-c15": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d71-c09": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d73-c15": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d74-c09": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d80-c09": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d80-c10": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d80-c18": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d88-c15": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "24년 4회",
"hoe": 72,
"count": 1
}
]
},
"d07-c17": {
"stars": 3,
"total": 3,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "25년 4회",
"hoe": 76,
"count": 1
},
{
"label": "25년 3회",
"hoe": 75,
"count": 1
}
]
},
"d10-c22": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
}
]
},
"d26-c06": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "25년 3회",
"hoe": 75,
"count": 1
}
]
},
"d35-c06": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
}
]
},
"d36-c05": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "25년 3회",
"hoe": 75,
"count": 1
}
]
},
"d39-c08": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
}
]
},
"d43-c04": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
}
]
},
"d44-c11": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
}
]
},
"d56-c06": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "25년 3회",
"hoe": 75,
"count": 1
}
]
},
"d60-c17": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
}
]
},
"d69-c14": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
}
]
},
"d73-c06": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
}
]
},
"d75-c14": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
}
]
},
"d85-c04": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
}
]
},
"d86-c14": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
}
]
},
"d88-c16": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 3회",
"hoe": 75,
"count": 1
}
]
},
"d02-c11": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d23-c09": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d25-c17": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d29-c19": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d35-c04": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d36-c11": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d38-c12": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d47-c03": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d47-c04": {
"stars": 2,
"total": 2,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
},
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d48-c09": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d49-c05": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d49-c07": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d50-c07": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d50-c11": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d50-c13": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d59-c08": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d66-c08": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d68-c08": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d75-c04": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d81-c17": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d88-c11": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "25년 4회",
"hoe": 76,
"count": 1
}
]
},
"d05-c13": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d07-c01": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d07-c20": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d08-c08": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d17-c08": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d18-c10": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d18-c11": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d34-c07": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d35-c11": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d35-c12": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d36-c08": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d36-c13": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d37-c06": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d42-c18": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d44-c03": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d45-c13": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d46-c08": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d47-c06": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d52-c08": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d52-c09": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d58-c18": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d58-c22": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d60-c09": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d61-c05": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d61-c14": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d63-c01": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d68-c20": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d75-c10": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d80-c20": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d81-c04": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d88-c19": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
},
"d89-c01": {
"stars": 1,
"total": 1,
"rounds": [
{
"label": "26년 1회",
"hoe": 77,
"count": 1
}
]
}
};
