/**
 * 정산 계산과 평가
 */
import type { Grade, Settlement } from '@/lib/types'

/** 정산 3축 평가 항목과 선택지 */
export const SETTLE_AXES = [
  {
    key: 'evalSchedule',
    label: '정산 일정 준수',
    options: { good: '기간 내 진행', fair: '1~2회 독촉 후 진행', poor: '3회 이상 독촉 후 진행' },
  },
  {
    key: 'evalFaithfulness',
    label: '정산 충실도',
    options: { good: '충실히 진행', fair: '추가 요청 후 진행', poor: '진행이 미흡' },
  },
  {
    key: 'evalCommunication',
    label: '소통 원활성',
    options: { good: '매우 원활', fair: '비교적 원활', poor: '어려움 있음' },
  },
] as const

export const SETTLE_STATUS_LABEL: Record<Settlement['status'], string> = {
  none: '미정산',
  in_progress: '정산중',
  done: '정산완료',
}

/** 계획·집행 총액과 집행률 */
export function settlementTotals(s: Settlement) {
  const planned = s.items.reduce((sum, it) => sum + it.planned, 0)
  const spent = s.items.reduce((sum, it) => sum + it.spent, 0)
  // 계획이 0이면 나눗셈이 무한대가 되므로 null로 둡니다.
  const rate = planned > 0 ? Math.round((spent / planned) * 100) : null
  return { planned, spent, rate }
}

/**
 * 정산 부실 여부.
 * 3축 중 하나라도 최하 등급이면 부실로 봅니다.
 * 아직 평가하지 않은 항목(null)은 부실이 아닙니다.
 */
export function isSettlementPoor(s: Settlement): boolean {
  const grades: (Grade | null)[] = [s.evalSchedule, s.evalFaithfulness, s.evalCommunication]
  return grades.some((g) => g === 'poor')
}

/** 금액을 "12,000,000" 형태로 */
export function formatMoney(n: number | null): string {
  if (n === null || Number.isNaN(n)) return '-'
  return n.toLocaleString('ko-KR')
}

/**
 * 사용자가 입력한 금액 문자열을 숫자로.
 * "12,000,000원" 같은 입력도 받아냅니다.
 * 원본 프로토타입은 이걸 문자열 그대로 저장해서 계산할 때마다 파싱했는데,
 * 여기서는 입력 시점에 한 번만 숫자로 바꿉니다.
 */
export function parseMoney(input: string): number {
  const cleaned = input.replace(/[^0-9.-]/g, '')
  const n = Number.parseFloat(cleaned)
  return Number.isNaN(n) ? 0 : n
}
