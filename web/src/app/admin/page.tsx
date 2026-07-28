/**
 * 관리자 대시보드
 *
 * "지금 손봐야 할 것"이 한눈에 보이는 것이 목적입니다.
 * 단순 집계보다 경고(검토 대기·지연·정산 부실)를 위에 둡니다.
 */
import Link from 'next/link'
import { getApplications, getCall } from '@/lib/mock-data'
import { ClassBadge, Empty, Metric, PageTitle, Panel } from '@/components/ui'
import { ALL_CLASSES, effectiveClass } from '@/lib/domain/classify'
import { isSettlementPoor } from '@/lib/domain/settlement'
import { STAGES, stageLabel } from '@/lib/domain/stage'

export default function DashboardPage() {
  const apps = getApplications()
  const today = new Date().toISOString().slice(0, 10)

  // 참여자 포털로 막 들어온 건 — 아직 아무도 안 본 신청
  const pending = apps.filter((a) => a.stage === 'applied')

  // 다음 접촉 예정일이 지났는데 아직 안 챙긴 건
  const overdue = apps
    .filter((a) => a.nextContact && a.nextContact < today)
    .sort((a, b) => a.nextContact.localeCompare(b.nextContact))

  // 정산 3축 중 하나라도 최하 등급
  const poorSettlement = apps.filter((a) => isSettlementPoor(a.settlement))

  // 결과보고 반려 상태로 멈춰 있는 건
  const rejectedReports = apps.filter((a) => a.reportStatus === 'rejected')

  // 분류별 분포
  const distribution = ALL_CLASSES.map((label) => ({
    label,
    count: apps.filter((a) => effectiveClass(a) === label).length,
  }))
  const maxCount = Math.max(1, ...distribution.map((d) => d.count))

  return (
    <>
      <PageTitle title="대시보드" sub={`전체 ${apps.length}건 · 오늘 ${today}`} />

      {/* 단계별 현황 — 누르면 그 단계만 걸러진 목록으로 갑니다 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3.5">
        {STAGES.map((s) => (
          <Metric
            key={s.key}
            label={s.label}
            value={apps.filter((a) => a.stage === s.key).length}
            unit="건"
            href={`/applications?stage=${s.key}`}
          />
        ))}
      </div>

      {/* 챙겨야 할 것 */}
      <div className="grid sm:grid-cols-2 gap-3.5">
        <Panel title={`검토 대기 ${pending.length}건`} className="mb-0">
          {pending.length === 0 ? (
            <Empty>새로 접수된 신청이 없습니다.</Empty>
          ) : (
            <ul className="divide-y divide-line -my-1">
              {pending.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/applications/${a.id}`}
                    className="flex items-center gap-2 py-2.5 hover:text-accent"
                  >
                    <span className="flex-1 text-[13.5px]">{a.applicant.name}</span>
                    <span className="text-[12.5px] text-faint">{a.createdAt}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={`지연 후속관리 ${overdue.length}건`} className="mb-0">
          {overdue.length === 0 ? (
            <Empty>기한이 지난 후속관리가 없습니다.</Empty>
          ) : (
            <ul className="divide-y divide-line -my-1">
              {overdue.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/applications/${a.id}`}
                    className="flex items-center gap-2 py-2.5 hover:text-accent"
                  >
                    <span className="flex-1 text-[13.5px]">{a.applicant.name}</span>
                    <span className="text-[12.5px] text-[#993c1d]">{a.nextContact} 예정</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={`정산 부실 ${poorSettlement.length}건`} className="mb-0">
          {poorSettlement.length === 0 ? (
            <Empty>정산 부실 건이 없습니다.</Empty>
          ) : (
            <ul className="divide-y divide-line -my-1">
              {poorSettlement.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/applications/${a.id}`}
                    className="flex items-center gap-2 py-2.5 hover:text-accent"
                  >
                    <span className="flex-1 text-[13.5px]">{a.applicant.name}</span>
                    <span className="text-[12.5px] text-faint">{stageLabel(a.stage)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={`결과보고 반려 ${rejectedReports.length}건`} className="mb-0">
          {rejectedReports.length === 0 ? (
            <Empty>반려 상태인 결과보고가 없습니다.</Empty>
          ) : (
            <ul className="divide-y divide-line -my-1">
              {rejectedReports.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/applications/${a.id}`}
                    className="block py-2.5 hover:text-accent"
                  >
                    <span className="text-[13.5px]">{a.applicant.name}</span>
                    <span className="block text-[12.5px] text-faint truncate">
                      {a.reportRejectReason}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="분류 분포" className="mt-3.5">
        <div className="space-y-2.5">
          {distribution.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <div className="w-[92px] shrink-0">
                <ClassBadge label={d.label} />
              </div>
              <div className="flex-1 h-2 bg-[#f1efe8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${(d.count / maxCount) * 100}%` }}
                />
              </div>
              <div className="w-9 text-right text-[13px] tabular-nums">{d.count}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="공모사업별 신청">
        <ul className="divide-y divide-line -my-1">
          {[...new Set(apps.map((a) => a.callId))].map((callId) => {
            const call = getCall(callId)
            const count = apps.filter((a) => a.callId === callId).length
            return (
              <li key={callId} className="flex items-center gap-2 py-2.5 text-[13.5px]">
                <span className="flex-1">{call?.title ?? callId}</span>
                <span className="text-muted">{count}건</span>
              </li>
            )
          })}
        </ul>
      </Panel>
    </>
  )
}
