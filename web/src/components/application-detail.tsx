'use client'

/**
 * 관리자 — 참여자 상세 (편집)
 *
 * 5단계 값을 한 폼에 담아 한 번에 저장합니다(Server Action).
 * 5축 점수는 바꾸는 즉시 아래 분류가 다시 계산됩니다(저장 전 미리보기).
 * 목록형 데이터(성과지표·활동이력·정산 항목)는 프로토타입에서는 보기 전용입니다.
 */
import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Application, Call, Classification, Score } from '@/lib/types'
import { ClassBadge, Empty, Field, KindTag, Panel } from '@/components/ui'
import { saveApplication, type FormResult } from '@/lib/actions'
import { ALL_CLASSES, AXES, CLASS_GUIDE, classify, SCORE_LABEL } from '@/lib/domain/classify'
import { STAGES, stageIndex } from '@/lib/domain/stage'
import {
  formatMoney,
  isSettlementPoor,
  SETTLE_AXES,
  SETTLE_STATUS_LABEL,
  settlementTotals,
} from '@/lib/domain/settlement'
import { kpiRate, kpiRateStyle } from '@/lib/domain/kpi'

const initial: FormResult = { ok: false }
const inputCls =
  'w-full border border-line rounded-[7px] px-3 py-2 text-[13.5px] bg-surface focus:outline-none focus:border-accent'

export function ApplicationDetail({ app, call }: { app: Application; call?: Call }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(saveApplication, initial)
  const [tab, setTab] = useState(stageIndex(app.stage))
  const [scores, setScores] = useState(app.scores)
  const [manual, setManual] = useState<Classification | ''>(app.classificationManual ?? '')

  useEffect(() => {
    if (state.ok) router.refresh()
  }, [state, router])

  const auto = classify(scores)
  const shown: Classification = manual || auto.label
  const totals = settlementTotals(app.settlement)

  return (
    <form action={action}>
      <input type="hidden" name="id" value={app.id} />
      {(['accounting', 'execution', 'outcome', 'sustainability', 'linkage'] as const).map((k) => (
        <input key={k} type="hidden" name={`score_${k}`} value={scores[k]} />
      ))}

      <Link href="/applications" className="text-[13px] text-muted hover:text-text inline-block mb-3">
        ← 참여자 목록
      </Link>

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
      </p>

      {/* 진행 상태 — 항상 보이는 핵심 조작부 */}
      <Panel title="진행 상태">
        <div className="grid sm:grid-cols-2 gap-x-5">
          <label className="block mb-3.5">
            <span className="block text-[12.5px] text-muted mb-1.5">관리자 단계</span>
            <select name="stage" defaultValue={app.stage} className={inputCls}>
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block mb-3.5">
            <span className="block text-[12.5px] text-muted mb-1.5">참여자 노출 상태</span>
            <select name="status" defaultValue={app.status} className={inputCls}>
              <option value="received">접수 완료</option>
              <option value="reviewing">심사 중</option>
              <option value="selected">선정</option>
              <option value="rejected">미선정</option>
            </select>
          </label>
        </div>
      </Panel>

      {/* 단계 탭 (표시 전환용 — 입력은 모두 폼 안에 살아있습니다) */}
      <div className="flex gap-1 mb-3.5 overflow-x-auto">
        {STAGES.map((s, i) => {
          const done = i < stageIndex(app.stage)
          const current = i === tab
          return (
            <button
              key={s.key}
              type="button"
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

      {/* tab 0 — 신청 (신청 당시 정보는 얼려두므로 보기 전용) */}
      <div hidden={tab !== 0}>
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
              label="요청 예산"
              value={app.requestedBudget ? `${formatMoney(app.requestedBudget)} 원` : undefined}
            />
          </div>
          <Field label="신청 동기 · 욕구" value={app.motive} />
          <Field
            label="첨부파일"
            value={
              app.attachments.length ? app.attachments.map((f) => f.name).join(', ') : undefined
            }
          />
        </Panel>
      </div>

      {/* tab 1 — 심사 */}
      <div hidden={tab !== 1}>
        <Panel title="심사">
          <div className="grid sm:grid-cols-3 gap-x-5">
            <LabeledInput label="서류 점수" name="docScore" type="number" defaultValue={app.docScore} />
            <LabeledInput
              label="면접 점수"
              name="interviewScore"
              type="number"
              defaultValue={app.interviewScore}
            />
            <label className="block mb-3.5">
              <span className="block text-[12.5px] text-muted mb-1.5">심사 결과</span>
              <select name="reviewResult" defaultValue={app.reviewResult} className={inputCls}>
                <option value="">미정</option>
                <option value="선정">선정</option>
                <option value="미선정">미선정</option>
                <option value="보류">보류</option>
              </select>
            </label>
          </div>
          <LabeledTextarea
            label="평가위원 의견"
            name="reviewOpinion"
            defaultValue={app.reviewOpinion}
          />
        </Panel>
      </div>

      {/* tab 2 — 사업진행 */}
      <div hidden={tab !== 2}>
        <Panel title="사업진행">
          <div className="grid sm:grid-cols-3 gap-x-5">
            <LabeledInput label="멘토링" name="mentoring" defaultValue={app.mentoring} />
            <LabeledInput
              label="집행률 (%)"
              name="execRate"
              type="number"
              defaultValue={app.execRate}
            />
            <LabeledInput label="현장점검" name="inspection" defaultValue={app.inspection} />
          </div>
          <LabeledTextarea label="특이사항" name="issue" defaultValue={app.issue} />
        </Panel>
      </div>

      {/* tab 3 — 종료 */}
      <div hidden={tab !== 3}>
        <Panel title="종료 · 결과보고">
          <label className="block mb-3.5">
            <span className="block text-[12.5px] text-muted mb-1.5">결과보고 상태</span>
            <select
              name="reportStatus"
              defaultValue={app.reportStatus}
              className={`${inputCls} sm:w-[220px]`}
            >
              <option value="none">미제출</option>
              <option value="submitted">제출</option>
              <option value="approved">승인</option>
              <option value="rejected">반려</option>
            </select>
          </label>
          <LabeledTextarea
            label="반려 사유 (반려일 때)"
            name="reportRejectReason"
            defaultValue={app.reportRejectReason}
          />
          <LabeledTextarea label="결과 요약" name="reportSummary" defaultValue={app.reportSummary} />
          <LabeledTextarea label="핵심 성과" name="performance" defaultValue={app.performance} />
          <Field
            label="제출 파일"
            value={
              app.resultFiles.length ? app.resultFiles.map((f) => f.name).join(', ') : undefined
            }
          />
        </Panel>

        <Panel title="성과지표 (보기 전용)">
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
      </div>

      {/* tab 4 — 5축 진단 + 사후관리 + 활동이력 */}
      <div hidden={tab !== 4}>
        <Panel title="5축 진단">
          <div className="space-y-2.5 mb-4">
            {AXES.map((axis) => (
              <div key={axis.key} className="flex items-center gap-3">
                <label className="text-[13.5px] w-[110px] shrink-0">{axis.label}</label>
                <div className="flex gap-1">
                  {([0, 1, 2, 3] as Score[]).map((v) => (
                    <button
                      key={v}
                      type="button"
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
              name="classificationManual"
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
          <div className="grid sm:grid-cols-2 gap-x-5">
            <LabeledInput
              label="후속지원"
              name="followupSupport"
              defaultValue={app.followupSupport}
            />
            <LabeledInput
              label="재단 연계"
              name="followupLinkage"
              defaultValue={app.followupLinkage}
            />
            <LabeledInput
              label="다음 접촉 예정"
              name="nextContact"
              type="date"
              defaultValue={app.nextContact}
            />
            <LabeledInput label="담당자" name="manager" defaultValue={app.manager} />
          </div>
        </Panel>

        <Panel title="활동 이력 (보기 전용)">
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
      </div>

      {/* 정산 — 항상 표시. 항목 표는 보기 전용, 상태·평가·메모는 편집 가능 */}
      <Panel title={`정산 — ${SETTLE_STATUS_LABEL[app.settlement.status]}`}>
        {app.settlement.items.length > 0 && (
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
        )}

        <label className="block mb-3.5">
          <span className="block text-[12.5px] text-muted mb-1.5">정산 상태</span>
          <select
            name="settlementStatus"
            defaultValue={app.settlement.status}
            className={`${inputCls} sm:w-[220px]`}
          >
            <option value="none">미정산</option>
            <option value="in_progress">정산중</option>
            <option value="done">정산완료</option>
          </select>
        </label>

        <div className="grid sm:grid-cols-3 gap-x-5">
          {SETTLE_AXES.map((axis) => (
            <label key={axis.key} className="block mb-3.5">
              <span className="block text-[12.5px] text-muted mb-1.5">{axis.label}</span>
              <select
                name={axis.key}
                defaultValue={app.settlement[axis.key] ?? ''}
                className={inputCls}
              >
                <option value="">미평가</option>
                {(['good', 'fair', 'poor'] as const).map((g) => (
                  <option key={g} value={g}>
                    {axis.options[g]}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <LabeledTextarea label="정산 메모" name="settlementNote" defaultValue={app.settlement.note} />
      </Panel>

      {state.error && (
        <div className="text-[13px] text-[#a32d2d] bg-[#faece7] rounded-[7px] px-3.5 py-2.5 mb-3">
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-accent text-white rounded-[7px] px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {pending ? '저장 중…' : '저장'}
        </button>
        {state.ok && <span className="text-[13px] text-accent">저장했습니다.</span>}
      </div>
    </form>
  )
}

function LabeledInput({
  label,
  name,
  type = 'text',
  defaultValue,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string | number | null
}) {
  return (
    <label className="block mb-3.5">
      <span className="block text-[12.5px] text-muted mb-1.5">{label}</span>
      <input type={type} name={name} defaultValue={defaultValue ?? ''} className={inputCls} />
    </label>
  )
}

function LabeledTextarea({
  label,
  name,
  defaultValue,
}: {
  label: string
  name: string
  defaultValue?: string
}) {
  return (
    <label className="block mb-3.5">
      <span className="block text-[12.5px] text-muted mb-1.5">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ''}
        rows={3}
        className={`${inputCls} resize-y`}
      />
    </label>
  )
}
