/**
 * 5축 진단 → 4분류 자동 판정
 *
 * 이 시스템에서 가장 중요한 로직입니다. 의뢰자가 실무에서 만든 규칙이라
 * 숫자(임계값 5, 7)를 함부로 바꾸면 안 됩니다.
 *
 *   안정성 = 회계·행정 + 자립 가능성        (0~6점, 5점 이상이면 '높음')
 *   잠재력 = 사업수행 + 성과 + 재단연계관심  (0~9점, 7점 이상이면 '높음')
 *
 *                  잠재력 높음      잠재력 낮음
 *   안정성 높음     성장연계         일반 모니터링
 *   안정성 낮음     집중관리         관찰
 */
import type { Application, Classification, Score } from '@/lib/types'

/** 5축의 정의. 화면에서 이 목록을 그대로 돌려 입력칸을 만듭니다. */
export const AXES = [
  { key: 'accounting', label: '회계·행정 역량' },
  { key: 'execution', label: '사업수행 역량' },
  { key: 'outcome', label: '성과 달성도' },
  { key: 'sustainability', label: '자립 가능성' },
  { key: 'linkage', label: '재단 연계 관심' },
] as const

export const SCORE_LABEL: Record<Score, string> = {
  0: '미입력',
  1: '미흡',
  2: '보통',
  3: '우수',
}

/** 안정성 임계값 (6점 만점 중) */
const STABILITY_THRESHOLD = 5
/** 잠재력 임계값 (9점 만점 중) */
const POTENTIAL_THRESHOLD = 7

export interface ClassifyResult {
  label: Classification
  stability: number | null
  potential: number | null
  /** 5축을 모두 입력했는지 */
  filled: boolean
}

/** 5축 점수로 분류를 계산합니다. 하나라도 미입력(0)이면 '미분류'. */
export function classify(scores: Application['scores']): ClassifyResult {
  const filled = AXES.every((a) => scores[a.key] > 0)

  if (!filled) {
    return { label: '미분류', stability: null, potential: null, filled: false }
  }

  const stability = scores.accounting + scores.sustainability
  const potential = scores.execution + scores.outcome + scores.linkage

  const stableHigh = stability >= STABILITY_THRESHOLD
  const potentialHigh = potential >= POTENTIAL_THRESHOLD

  const label: Classification = stableHigh
    ? potentialHigh
      ? '성장연계'
      : '일반 모니터링'
    : potentialHigh
      ? '집중관리'
      : '관찰'

  return { label, stability, potential, filled: true }
}

/**
 * 실제로 화면에 표시할 분류.
 * 관리자가 손으로 지정한 값이 있으면 자동 판정보다 우선합니다.
 */
export function effectiveClass(app: Application): Classification {
  return app.classificationManual ?? classify(app.scores).label
}

/** 분류별 대응 지침. 의뢰자가 작성한 문구를 그대로 옮겼습니다. */
export const CLASS_GUIDE: Record<Classification, string> = {
  성장연계:
    '안정적이고 잠재력이 높습니다. 재단 타사업 연계, 우수사례·네트워크 허브, 모금 스토리 대상으로 권장합니다.',
  집중관리:
    '잠재력은 높으나 안정성이 낮습니다. 멘토·회계사 연계와 분기 점검 등 후속지원을 우선 배정합니다.',
  '일반 모니터링':
    '안정적이며 추가 욕구가 적습니다. 반기 1회 안부·콘텐츠 제공 수준으로 관리합니다.',
  관찰: '안정성·잠재력이 모두 낮습니다. 기본 모니터링과 필요 시 역량강화 지원을 검토합니다.',
  미분류: '5축 진단을 모두 입력하면 자동으로 분류됩니다.',
}

/** 분류별 배지 색 (Tailwind 클래스) */
export const CLASS_STYLE: Record<Classification, string> = {
  성장연계: 'bg-[#faece7] text-[#993c1d]',
  집중관리: 'bg-[#faeeda] text-[#854f0b]',
  '일반 모니터링': 'bg-[#e1f5ee] text-[#0f6e56]',
  관찰: 'bg-[#f1efe8] text-[#5f5e5a]',
  미분류: 'bg-[#f1efe8] text-[#5f5e5a]',
}

/** 화면 필터 등에서 쓸 전체 분류 목록 */
export const ALL_CLASSES: Classification[] = [
  '성장연계',
  '집중관리',
  '일반 모니터링',
  '관찰',
  '미분류',
]
