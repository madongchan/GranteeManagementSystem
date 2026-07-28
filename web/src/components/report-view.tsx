'use client'

/**
 * 사업 보고서 화면
 *
 * 사업을 고르면 그 사업의 현황이 한 장으로 정리됩니다.
 * 인쇄(PDF 저장)와 엑셀 내려받기를 지원합니다.
 */
import { useMemo, useState } from 'react'
import type { Application, Call } from '@/lib/types'
import { Panel } from '@/components/ui'
import { buildReport, REPORT_COLUMNS, reportRows } from '@/lib/domain/report'
import { formatMoney } from '@/lib/domain/settlement'
import { downloadCsv, today, toCsv } from '@/lib/csv'
import { CLASS_STYLE } from '@/lib/domain/classify'

export function ReportView({ apps, calls }: { apps: Application[]; calls: Call[] }) {
  const [callId, setCallId] = useState('all')
  const [manager, setManager] = useState('all')

  const managers = useMemo(
    () => [...new Set(apps.map((a) => a.manager).filter(Boolean))],
    [apps],
  )

  const scoped = useMemo(
    () =>
      apps.filter((a) => {
        if (callId !== 'all' && a.callId !== callId) return false
        if (manager !== 'all' && a.manager !== manager) return false
        return true
      }),
    [apps, callId, manager],
  )

  const call = callId === 'all' ? null : (calls.find((c) => c.id === callId) ?? null)
  const report = useMemo(() => buildReport(scoped, call), [scoped, call])

  const title = call ? call.title : '전체 사업'

  function exportCsv() {
    const headers = REPORT_COLUMNS.map((c) => c.header)
    downloadCsv(`사업보고서_${title}_${today()}`, toCsv(headers, reportRows(scoped)))
  }

  return (
    <>
      {/* 인쇄할 때는 이 막대가 안 나오게 합니다 */}
      <div className="print:hidden">
        <Panel>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={callId}
              onChange={(e) => setCallId(e.target.value)}
              className="border border-line rounded-[7px] px-2.5 py-2 text-[13px] bg-surface focus:outline-none focus:border-accent"
            >
              <option value="all">전체 사업</option>
              {calls.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <select
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              className="border border-line rounded-[7px] px-2.5 py-2 text-[13px] bg-surface focus:outline-none focus:border-accent"
            >
              <option value="all">전체 담당자</option>
              {managers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <div className="ml-auto flex gap-2">
              <button
                onClick={() => window.print()}
                className="border border-line rounded-[7px] px-3.5 py-2 text-[13px] hover:border-line2"
              >
                인쇄 · PDF 저장
              </button>
              <button
                onClick={exportCsv}
                className="bg-accent text-white rounded-[7px] px-3.5 py-2 text-[13px] font-medium hover:opacity-90"
              >
                엑셀 내려받기
              </button>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── 보고서 본문 ── */}
      <div className="bg-surface border border-line rounded-[10px] px-8 py-7">
        <header className="border-b border-line pb-5 mb-6">
          <div className="text-[12.5px] text-muted mb-1.5">함께일하는재단 사업 보고서</div>
          <h2 className="text-[22px] font-semibold tracking-[-0.3px]">{title}</h2>
          <div className="text-[13px] text-muted mt-2">
            작성일 {report.generatedAt}
            {call && ` · 신청기간 ${call.startDate} ~ ${call.endDate}`}
            {manager !== 'all' && ` · 담당 ${manager}`}
          </div>
        </header>

        {/* 1. 개요 */}
        <Section no="1" title="신청 현황">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <Stat label="전체 신청" value={report.summary.total} unit="건" />
            <Stat label="선정" value={report.summary.selected} unit="건" />
            <Stat label="심사 중" value={report.summary.reviewing} unit="건" />
            <Stat label="미선정" value={report.summary.rejected} unit="건" />
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <MiniTable title="신청 주체별" rows={report.summary.byKind} />
            <MiniTable title="사업 분야별" rows={report.summary.bySector} />
            <MiniTable title="진행 단계별" rows={report.summary.byStage} />
          </div>
        </Section>

        {/* 2. 예산 */}
        <Section no="2" title="예산 집행">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Stat label="요청 예산 합계" value={formatMoney(report.budget.requested)} unit="원" />
            <Stat label="정산 계획" value={formatMoney(report.budget.planned)} unit="원" />
            <Stat label="정산 집행" value={formatMoney(report.budget.spent)} unit="원" />
            <Stat
              label="집행률"
              value={report.budget.execRate === null ? '—' : report.budget.execRate}
              unit={report.budget.execRate === null ? '' : '%'}
            />
          </div>
          <p className="text-[13.5px] text-muted">
            정산 완료 {report.budget.settledDone}건 · 정산 중 {report.budget.settledInProgress}건 ·
            미정산 {report.budget.settledNone}건
          </p>
        </Section>

        {/* 3. 사후관리 */}
        <Section no="3" title="사후관리 판단">
          <div className="mb-5">
            <div className="text-[13px] font-medium mb-2.5">5축 진단 분류</div>
            <div className="flex flex-wrap gap-2">
              {report.aftercare.byClass.map((c) => (
                <div
                  key={c.label}
                  className={`rounded-md px-3 py-2 text-[13px] ${CLASS_STYLE[c.label as keyof typeof CLASS_STYLE]}`}
                >
                  {c.label} <strong className="ml-1">{c.count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            <IssueList
              title="정산 부실"
              hint="정산 3축 중 최하 등급이 있는 건"
              items={report.aftercare.poorSettlement.map((a) => a.applicant.name)}
            />
            <IssueList
              title="후속관리 지연"
              hint="다음 접촉 예정일이 지난 건"
              items={report.aftercare.overdueContact.map(
                (a) => `${a.applicant.name} (${a.nextContact})`,
              )}
            />
            <IssueList
              title="결과보고 반려"
              hint="보완 후 재제출 대기 중"
              items={report.aftercare.rejectedReport.map((a) => a.applicant.name)}
            />
          </div>
        </Section>

        {/* 4. 성과 */}
        <Section no="4" title="성과지표">
          {report.performance.kpiCount === 0 ? (
            <p className="text-[13.5px] text-faint">등록된 성과지표가 없습니다.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Stat label="지표 수" value={report.performance.kpiCount} unit="개" />
                <Stat label="목표 달성" value={report.performance.kpiAchieved} unit="개" />
                <Stat
                  label="달성 비율"
                  value={report.performance.achievementRate ?? '—'}
                  unit={report.performance.achievementRate === null ? '' : '%'}
                />
              </div>
              <div className="text-[13px] font-medium mb-2">달성률 상위</div>
              <ul className="divide-y divide-line border border-line rounded-[7px]">
                {report.performance.highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-2 px-3 py-2 text-[13.5px]">
                    <span className="text-muted">{h.org}</span>
                    <span className="flex-1">{h.name}</span>
                    <strong className={h.rate >= 100 ? 'text-[#0f6e56]' : 'text-[#854f0b]'}>
                      {h.rate}%
                    </strong>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>

        {/* 5. 개별 목록 */}
        <Section no="5" title={`참여자 목록 (${report.rows.length}건)`} last>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[640px]">
              <thead>
                <tr className="text-muted text-[12px] border-b border-line">
                  <th className="text-left font-medium py-2">신청자</th>
                  <th className="text-left font-medium px-2 py-2">분야</th>
                  <th className="text-left font-medium px-2 py-2">단계</th>
                  <th className="text-left font-medium px-2 py-2">분류</th>
                  <th className="text-right font-medium px-2 py-2">집행률</th>
                  <th className="text-left font-medium px-2 py-2">담당</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((a) => {
                  const cells = REPORT_COLUMNS
                  const get = (header: string) =>
                    String(cells.find((c) => c.header === header)?.get(a) ?? '')
                  return (
                    <tr key={a.id}>
                      <td className="py-2">{a.applicant.name}</td>
                      <td className="px-2 py-2 text-muted">{a.applicant.sector || '—'}</td>
                      <td className="px-2 py-2">{get('단계')}</td>
                      <td className="px-2 py-2">{get('분류')}</td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {get('집행률(%)') ? `${get('집행률(%)')}%` : '—'}
                      </td>
                      <td className="px-2 py-2 text-muted">{a.manager || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-faint mt-3">
            ※ 엑셀 내려받기에는 위 표보다 훨씬 많은 항목(점수·정산 상세·연락처 등 {REPORT_COLUMNS.length}개
            열)이 들어갑니다.
          </p>
        </Section>
      </div>
    </>
  )
}

// ── 부품 ──────────────────────────────────────────────────────────

function Section({
  no,
  title,
  children,
  last,
}: {
  no: string
  title: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <section className={last ? '' : 'mb-8 pb-8 border-b border-line'}>
      <h3 className="text-[15px] font-semibold mb-4">
        <span className="text-accent mr-1.5">{no}.</span>
        {title}
      </h3>
      {children}
    </section>
  )
}

function Stat({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="border border-line rounded-[7px] px-3.5 py-3">
      <div className="text-[12px] text-muted mb-1">{label}</div>
      <div className="text-[19px] font-semibold tracking-[-0.3px] leading-none">
        {value}
        {unit && <small className="text-[12.5px] text-faint font-medium ml-1">{unit}</small>}
      </div>
    </div>
  )
}

function MiniTable({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const shown = rows.filter((r) => r.count > 0)
  return (
    <div>
      <div className="text-[13px] font-medium mb-2">{title}</div>
      {shown.length === 0 ? (
        <p className="text-[13px] text-faint">해당 없음</p>
      ) : (
        <ul className="divide-y divide-line border border-line rounded-[7px]">
          {shown.map((r) => (
            <li key={r.label} className="flex items-center px-3 py-1.5 text-[13px]">
              <span className="flex-1">{r.label}</span>
              <strong>{r.count}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function IssueList({ title, hint, items }: { title: string; hint: string; items: string[] }) {
  return (
    <div>
      <div className="text-[13px] font-medium">
        {title}{' '}
        <span className={items.length > 0 ? 'text-[#993c1d]' : 'text-faint'}>{items.length}</span>
      </div>
      <div className="text-[11.5px] text-faint mb-2">{hint}</div>
      {items.length === 0 ? (
        <p className="text-[13px] text-faint">없음</p>
      ) : (
        <ul className="space-y-1">
          {items.map((t, i) => (
            <li key={i} className="text-[13px]">
              · {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
