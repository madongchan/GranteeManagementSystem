/**
 * 사업 보고서 만들기
 *
 * 담당자가 "내가 맡은 사업이 지금 어떤 상태인지"를 한 장으로 정리해
 * 재단 내부 보고나 결산 자료로 쓸 수 있게 하는 것이 목적입니다.
 *
 * 무엇을 담을지는 아래 원칙으로 정했습니다.
 *   1. 숫자로 답할 수 있는 것 — 몇 곳이 신청했고 얼마를 집행했나
 *   2. 판단이 필요한 것 — 어디를 더 챙겨야 하나 (분류·정산 부실·지연)
 *   3. 성과 — 목표 대비 얼마나 달성했나
 *
 * 화면 표시용과 CSV 내려받기용을 같은 데이터에서 만들어냅니다.
 */
import type { Application, Call } from '@/lib/types'
import { ALL_CLASSES, effectiveClass } from '@/lib/domain/classify'
import { isSettlementPoor, settlementTotals } from '@/lib/domain/settlement'
import { kpiRate } from '@/lib/domain/kpi'
import { STAGES, stageLabel } from '@/lib/domain/stage'
import { kindLabel } from '@/lib/taxonomy'

export interface Report {
  call: Call | null
  generatedAt: string

  /** 1. 개요 */
  summary: {
    total: number
    selected: number
    rejected: number
    reviewing: number
    byKind: { label: string; count: number }[]
    bySector: { label: string; count: number }[]
    byStage: { label: string; count: number }[]
  }

  /** 2. 예산 */
  budget: {
    requested: number
    planned: number
    spent: number
    execRate: number | null
    settledDone: number
    settledInProgress: number
    settledNone: number
  }

  /** 3. 사후관리 판단 */
  aftercare: {
    byClass: { label: string; count: number }[]
    poorSettlement: Application[]
    overdueContact: Application[]
    rejectedReport: Application[]
  }

  /** 4. 성과 */
  performance: {
    kpiCount: number
    kpiAchieved: number
    achievementRate: number | null
    highlights: { name: string; org: string; rate: number }[]
  }

  /** 5. 개별 목록 */
  rows: Application[]
}

/**
 * 보고서를 만듭니다.
 * @param apps 대상 신청서 (사업별로 걸러서 넘깁니다)
 * @param call 대상 공모사업. 전체 사업이면 null
 */
export function buildReport(apps: Application[], call: Call | null): Report {
  const today = new Date().toISOString().slice(0, 10)

  // ── 1. 개요
  const countBy = (get: (a: Application) => string) => {
    const map = new Map<string, number>()
    apps.forEach((a) => {
      const key = get(a)
      if (key) map.set(key, (map.get(key) ?? 0) + 1)
    })
    return [...map.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((x, y) => y.count - x.count)
  }

  // ── 2. 예산
  const requested = apps.reduce((sum, a) => sum + (a.requestedBudget ?? 0), 0)
  let planned = 0
  let spent = 0
  apps.forEach((a) => {
    const t = settlementTotals(a.settlement)
    planned += t.planned
    spent += t.spent
  })

  // ── 4. 성과 — 목표가 있는 지표만 셉니다
  const allKpis = apps.flatMap((a) =>
    a.kpis
      .map((k) => ({ kpi: k, org: a.applicant.name, rate: kpiRate(k) }))
      .filter((x): x is { kpi: typeof x.kpi; org: string; rate: number } => x.rate !== null),
  )
  const achieved = allKpis.filter((x) => x.rate >= 100)

  return {
    call,
    generatedAt: today,

    summary: {
      total: apps.length,
      selected: apps.filter((a) => a.status === 'selected').length,
      rejected: apps.filter((a) => a.status === 'rejected').length,
      reviewing: apps.filter((a) => a.status === 'reviewing').length,
      byKind: countBy((a) => kindLabel(a.applicant.kind)),
      bySector: countBy((a) => a.applicant.sector),
      byStage: STAGES.map((s) => ({
        label: s.label,
        count: apps.filter((a) => a.stage === s.key).length,
      })),
    },

    budget: {
      requested,
      planned,
      spent,
      execRate: planned > 0 ? Math.round((spent / planned) * 100) : null,
      settledDone: apps.filter((a) => a.settlement.status === 'done').length,
      settledInProgress: apps.filter((a) => a.settlement.status === 'in_progress').length,
      settledNone: apps.filter((a) => a.settlement.status === 'none').length,
    },

    aftercare: {
      byClass: ALL_CLASSES.map((label) => ({
        label,
        count: apps.filter((a) => effectiveClass(a) === label).length,
      })),
      poorSettlement: apps.filter((a) => isSettlementPoor(a.settlement)),
      overdueContact: apps
        .filter((a) => a.nextContact && a.nextContact < today)
        .sort((a, b) => a.nextContact.localeCompare(b.nextContact)),
      rejectedReport: apps.filter((a) => a.reportStatus === 'rejected'),
    },

    performance: {
      kpiCount: allKpis.length,
      kpiAchieved: achieved.length,
      achievementRate:
        allKpis.length > 0 ? Math.round((achieved.length / allKpis.length) * 100) : null,
      highlights: allKpis
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 5)
        .map((x) => ({ name: x.kpi.name, org: x.org, rate: x.rate })),
    },

    rows: apps,
  }
}

// ---------------------------------------------------------------------
// CSV 내보내기용 컬럼 정의
// 여기에 한 줄 추가하면 내려받는 파일에도 자동으로 들어갑니다.
// ---------------------------------------------------------------------
export const REPORT_COLUMNS: { header: string; get: (a: Application) => unknown }[] = [
  { header: '접수번호', get: (a) => a.displayNo },
  { header: '신청자명', get: (a) => a.applicant.name },
  { header: '구분', get: (a) => kindLabel(a.applicant.kind) },
  { header: '세부유형', get: (a) => a.applicant.type },
  { header: '사업분야', get: (a) => a.applicant.sector },
  { header: '지역', get: (a) => [a.applicant.sido, a.applicant.sigungu].filter(Boolean).join(' ') },
  { header: '이메일', get: (a) => a.applicant.email },
  { header: '연락처', get: (a) => a.applicant.contact },
  { header: '신청일', get: (a) => a.createdAt },
  { header: '단계', get: (a) => stageLabel(a.stage) },
  { header: '심사결과', get: (a) => a.reviewResult },
  { header: '서류점수', get: (a) => a.docScore },
  { header: '면접점수', get: (a) => a.interviewScore },
  { header: '요청예산', get: (a) => a.requestedBudget },
  { header: '정산계획', get: (a) => settlementTotals(a.settlement).planned },
  { header: '정산집행', get: (a) => settlementTotals(a.settlement).spent },
  { header: '집행률(%)', get: (a) => settlementTotals(a.settlement).rate },
  { header: '정산부실', get: (a) => (isSettlementPoor(a.settlement) ? 'Y' : '') },
  { header: '회계·행정', get: (a) => a.scores.accounting || '' },
  { header: '사업수행', get: (a) => a.scores.execution || '' },
  { header: '성과달성', get: (a) => a.scores.outcome || '' },
  { header: '자립가능', get: (a) => a.scores.sustainability || '' },
  { header: '재단연계', get: (a) => a.scores.linkage || '' },
  { header: '분류', get: (a) => effectiveClass(a) },
  { header: '결과보고', get: (a) => ({ none: '미제출', submitted: '제출', approved: '승인', rejected: '반려' })[a.reportStatus] },
  { header: '핵심성과', get: (a) => a.performance },
  { header: '다음접촉예정', get: (a) => a.nextContact },
  { header: '담당자', get: (a) => a.manager },
]

export function reportRows(apps: Application[]): unknown[][] {
  return apps.map((a) => REPORT_COLUMNS.map((c) => c.get(a)))
}
