/**
 * 성과지표(KPI) 달성률
 */
import type { Kpi } from '@/lib/types'

/**
 * 달성률 % 를 구합니다.
 * 목표가 없거나 0이면 계산할 수 없으므로 null을 돌려줍니다.
 */
export function kpiRate(kpi: Kpi): number | null {
  if (kpi.target === null || kpi.target === 0) return null
  if (kpi.actual === null) return null
  return Math.round((kpi.actual / kpi.target) * 100)
}

/** 달성률에 따른 색 (100% 이상이면 초록) */
export function kpiRateStyle(rate: number | null): string {
  if (rate === null) return 'text-[#9c9a92]'
  if (rate >= 100) return 'text-[#0f6e56]'
  if (rate >= 70) return 'text-[#854f0b]'
  return 'text-[#993c1d]'
}
