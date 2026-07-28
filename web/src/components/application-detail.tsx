'use client'

/**
 * 관리자 — 참여자 상세
 *
 * 5단계를 탭으로 오가고, 5축 진단은 점수를 바꾸는 즉시 분류가 다시 계산됩니다.
 * 원본 프로토타입에서도 이 "실시간 재분류"가 좋았던 부분이라 살렸습니다.
 */
import { useState } from 'react'
import Link from 'next/link'
import type { Application, Call, Classification, Score } from '@/lib/types'
import { ClassBadge, Empty, Field, KindTag, Panel } from '@/components/ui'
import { ALL_CLASSES, AXES, CLASS_GUIDE, classify, SCORE_LABEL } from '@/lib/domain/classify'
import { STAGES, stageIndex, stageLabel } from '@/lib/domain/stage'
import {
  formatMoney,
  isSettlementPoor,
  SETTLE_AXES,
  SETTLE_STATUS_LABEL,
  settlementTotals,
} from '@/lib/domain/settlement'
import { kpiRate, kpiRateStyle } from '@/lib/domain/kpi'

export function ApplicationDetail({ app, call }: { app: Application; call?: Call }) {
  const [tab, setTab] = useState(stageIndex(app.stage))

  // 5축 점수는 화면에서 바꿔볼 수 있게 상태로 들고 있습니다.
  // (저장 기능은 DB를 붙일 때 만듭니다)
  const [scores, setScores] = useState(app.scores)
  const [manual, setManual] = useState<Classification | ''>(app.classificationManual ?? '')

  const auto = classify(scores)
  const shown: Classification = manual || auto.label
  const totals = settlementTotals(app.settlement)

  return (
    <>
      <Link
        href="/applications"
        className="text-[13px] text-muted hover:text-text inline-block mb-3"
      >
        ← 참여자 목록
      </Link>

      {/* 머리 정보 */}
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <h1 className="text-[21px] font-semibold tracking-[-0.3px]">{app.applicant.name}</h1>
        <KindTag kind={app.applicant.kind} />
        <ClassBadge label={shown} />
        {isSettlementPoor(app.settlement) && (
          <span className="text-[11.5px] px-2 py-[3px] rounded-md bg-[#faece7] text-[#993c1d] font-medium">
            정산 부실
          </span>
        )}
      </div>
      <p className="text-muted text-[13.5px] mb-[22px]">
        {app.displayNo} · {call?.title ?? '—'} · 신청일 {app.createdAt}
        {app.manager && ` · 담당 ${app.manager}`}
      </p>

      {/* 단계 탭 */}
      <div className="flex gap-1 mb-3.5 overflow-x-auto">
        {STAGES.map((s, i) => {
          const done = i < stageIndex(app.stage)
          const current = i === tab
          return (
            <button
              key={s.key}
              onClick={() => setTab(i)}
              className={`flex-1 min-w-[92px] rounded-[7px] border px-3 py-2.5 text-[13px] transition-colors ${
                current
                  ? 'border-accent bg-accent-bg text-accent font-medium'
                  : done
                    ? 'border-line bg-surface text-muted'
                    : 'border-line bg-surface text-faint'
              }`}
            >
              {done && <span className="mr-1">✓</span>}
              {s.label}
            </button>
          )
        })}
      </div>

      {/* 단계별 내용 */}
      {tab === 0 && (
        <Panel title="신청">
          <div className="grid sm:grid-cols-2 gap-x-6">
            <Field label="기관·개인명" value={app.applicant.name} />
            <Field label="세부 유형" value={app.applicant.type} />
            <Field label="사업 분야" value={app.applicant.sector} />
            <Field
              label={app.applicant.kind === 'individual' ? '소속' : '대표자'}
              value={
                app.applicant.kind === 'individual' ? app.applicant.affiliation : app.applicant.rep
              }
            />
            <Field label="이메일" value={app.applicant.email} />
            <Field label="연락처" value={app.applicant.contact} />
            <Field
              label="지역"
              value={[app.applicant.sido, app.applicant.sigungu].filter(Boolean).join(' ')}
            />
            <Field
              label={app.applicant.kind === 'individual' ? '연령대' : '규모'}
              value={app.applicant.ageBand ?? app.applicant.scaleBand}
            />
            <Field
              label="요청 예산"
              value={app.requestedBudget && `${formatMoney(app.requestedBudget)} 원`}
            />
          </div>
          <Field label="신청 동기 · 욕구" value={app.motive} />
          <Field
            label="첨부파일"
            value={
              app.attachments.length
                ? app.attachments.map((f) => f.name).join(', ')
                : undefined
            }
          />
          <Field
            label="개인정보 동의"
            value={
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['collect', '수집·이용'],
                    ['thirdParty', '제3자 제공'],
                    ['research', '연구활용'],
                    ['followup', '후속지원'],
                    ['survey', '조사참여'],
                  ] as const
                ).map(([key, label]) => (
                  <span
                    key={key}
                    className={`text-[12px] px-2 py-[3px] rounded-md ${
                      app.applicant.consents[key]
                        ? 'bg-accent-bg text-accent'
                        : 'bg-[#f1efe8] text-faint'
                    }`}
                  >
                    {label} {app.applicant.consents[key] ? '✓' : '✕'}
                  </span>
                ))}
              </div>
            }
          />
        </Panel>
      )}

      {tab === 1 && (
        <Panel title="심사">
          <div className="grid sm:grid-cols-2 gap-x-6">
            <Field label="서류 점수" value={app.docScore} />
            <Field label="면접 점수" value={app.interviewScore} />
            <Field label="심사 결과" value={app.reviewResult} />
          </div>
          <Field label="평가위원 의견" value={app.reviewOpinion} />
        </Panel>
      )}

      {tab === 2 && (
        <Panel title="사업진행">
          <div className="grid sm:grid-cols-2 gap-x-6">
            <Field label="멘토링" value={app.mentoring} />
            <Field label="집행률" value={app.execRate !== null ? `${app.execRate}%` : undefined} />
            <Field label="현장점검" value={app.inspection} />
          </div>
          <Field label="특이사항" value={app.issue} />
        </Panel>
      )}

      {tab === 3 && (
        <>
          <Panel title="종료 · 결과보고">
            <Field
              label="결과보고 상태"
              value={
                {
                  none: '미제출',
                  submitted: '제출',
                  approved: '승인',
                  rejected: '반려',
                }[app.reportStatus]
              }
            />
            {app.reportStatus === 'rejected' && (
              <Field label="반려 사유" value={app.reportRejectReason} />
            )}
            <Field label="결과 요약" value={app.reportSummary} />
            <Field label="핵심 성과" value={app.performance} />
            <Field
              label="제출 파일"
              value={
                app.resultFiles.length ? app.resultFiles.map((f) => f.name).join(', ') : undefined
              }
            />
          </Panel>

          <Panel title="성과지표">
            {app.kpis.length === 0 ? (
              <Empty>등록된 성과지표가 없습니다.</Empty>
            ) : (
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="text-muted text-[12.5px] border-b border-line">
                    <th className="text-left font-medium pb-2">지표</th>
                    <th className="text-right font-medium pb-2">목표</th>
                    <th className="text-right font-medium pb-2">실적</th>
                    <th className="text-right font-medium pb-2">달성률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {app.kpis.map((k, i) => {
                    const rate = kpiRate(k)
                    return (
                      <tr key={i}>
                        <td className="py-2">{k.name}</td>
                        <td className="py-2 text-right">{k.target ?? '—'}</td>
                        <td className="py-2 text-right">{k.actual ?? '—'}</td>
                        <td className={`py-2 text-right font-medium ${kpiRateStyle(rate)}`}>
                          {rate === null ? '—' : `${rate}%`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </Panel>
        </>
      )}

      {tab === 4 && (
        <>
          {/* 5축 진단 — 점수를 바꾸면 아래 분류가 즉시 바뀝니다 */}
          <Panel title="5축 진단">
            <div className="space-y-2.5 mb-4">
              {AXES.map((axis) => (
                <div key={axis.key} className="flex items-center gap-3">
                  <label className="text-[13.5px] w-[110px] shrink-0">{axis.label}</label>
                  <div className="flex gap-1">
                    {([0, 1, 2, 3] as Score[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => setScores((s) => ({ ...s, [axis.key]: v }))}
                        className={`px-2.5 py-1.5 rounded-md text-[12.5px] border transition-colors ${
                          scores[axis.key] === v
                            ? 'border-accent bg-accent-bg text-accent font-medium'
                            : 'border-line bg-surface text-muted hover:border-line2'
                        }`}
                      >
                        {SCORE_LABEL[v]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#faf9f6] border border-line rounded-[7px] px-4 py-3.5">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <ClassBadge label={shown} />
                <span className="text-[12.5px] text-muted">
                  안정성 <b className="text-text">{auto.stability ?? '-'}</b>/6
                </span>
                <span className="text-[12.5px] text-muted">
                  잠재력 <b className="text-text">{auto.potential ?? '-'}</b>/9
                </span>
                {manual && (
                  <span className="text-[11.5px] text-[#854f0b] bg-[#faeeda] px-2 py-[2px] rounded">
                    수동 지정 (자동 판정: {auto.label})
                  </span>
                )}
              </div>
              <p className="text-[13px] text-muted">{CLASS_GUIDE[shown]}</p>
            </div>

            <div className="mt-3.5">
              <label className="block text-[12.5px] text-muted mb-1.5">
                분류 수동 지정 (비워두면 자동 판정)
              </label>
              <select
                value={manual}
                onChange={(e) => setManual(e.target.value as Classification | '')}
                className="border border-line rounded-[7px] px-2.5 py-2 text-[13px] bg-surface"
              >
                <option value="">자동 판정 사용</option>
                {ALL_CLASSES.filter((c) => c !== '미분류').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </Panel>

          <Panel title="사후관리">
            <div className="grid sm:grid-cols-2 gap-x-6">
              <Field label="후속지원" value={app.followupSupport} />
              <Field label="재단 연계" value={app.followupLinkage} />
              <Field label="다음 접촉 예정" value={app.nextContact} />
              <Field label="담당자" value={app.manager} />
            </div>
          </Panel>

          <Panel title="활동 이력">
            {app.activities.length === 0 ? (
              <Empty>기록된 활동이 없습니다.</Empty>
            ) : (
              <ul className="divide-y divide-line -my-1">
                {[...app.activities]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((act, i) => (
                    <li key={i} className="flex gap-3 py-2.5 text-[13.5px]">
                      <span className="text-muted w-[86px] shrink-0">{act.date}</span>
                      <span className="text-[12px] px-1.5 py-[2px] rounded bg-[#f1efe8] text-muted h-fit shrink-0">
                        {act.type}
                      </span>
                      <span className="flex-1">{act.note}</span>
                    </li>
                  ))}
              </ul>
            )}
          </Panel>
        </>
      )}

      {/* 정산은 어느 단계에서든 보이게 둡니다 */}
      <Panel title={`정산 — ${SETTLE_STATUS_LABEL[app.settlement.status]}`}>
        {app.settlement.items.length === 0 ? (
          <Empty>등록된 정산 항목이 없습니다.</Empty>
        ) : (
          <>
            <table className="w-full text-[13.5px] mb-4">
              <thead>
                <tr className="text-muted text-[12.5px] border-b border-line">
                  <th className="text-left font-medium pb-2">항목</th>
                  <th className="text-right font-medium pb-2">계획</th>
                  <th className="text-right font-medium pb-2">집행</th>
                  <th className="text-left font-medium pb-2 pl-4">증빙</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {app.settlement.items.map((it, i) => (
                  <tr key={i}>
                    <td className="py-2">{it.name}</td>
                    <td className="py-2 text-right tabular-nums">{formatMoney(it.planned)}</td>
                    <td className="py-2 text-right tabular-nums">{formatMoney(it.spent)}</td>
                    <td className="py-2 pl-4 text-muted">{it.proof || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-line font-semibold">
                  <td className="pt-2.5">
                    합계
                    {totals.rate !== null && (
                      <span className="ml-2 font-normal text-muted text-[12.5px]">
                        집행률 {totals.rate}%
                      </span>
                    )}
                  </td>
                  <td className="pt-2.5 text-right tabular-nums">{formatMoney(totals.planned)}</td>
                  <td className="pt-2.5 text-right tabular-nums">{formatMoney(totals.spent)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>

            <div className="border-t border-line pt-3.5">
              <div className="text-[12.5px] text-muted mb-2.5">정산 평가</div>
              <div className="grid sm:grid-cols-3 gap-2.5">
                {SETTLE_AXES.map((axis) => {
                  const value = app.settlement[axis.key]
                  return (
                    <div key={axis.key} className="border border-line rounded-[7px] px-3 py-2.5">
                      <div className="text-[12px] text-muted mb-1">{axis.label}</div>
                      <div
                        className={`text-[13.5px] font-medium ${
                          value === 'poor' ? 'text-[#993c1d]' : value ? '' : 'text-faint'
                        }`}
                      >
                        {value ? axis.options[value] : '미평가'}
                      </div>
                    </div>
                  )
                })}
              </div>
              {app.settlement.note && (
                <p className="text-[13px] text-muted mt-2.5">{app.settlement.note}</p>
              )}
            </div>
          </>
        )}
      </Panel>

      <p className="text-faint text-[12.5px] text-center mt-4">
        ※ 화면 확인용입니다. 점수를 바꿔도 저장되지 않고, 새로고침하면 되돌아갑니다.
      </p>
    </>
  )
}
