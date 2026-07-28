/**
 * 내 신청 상세 (참여자가 보는 화면)
 *
 * 관리자만 보는 정보(5축 진단 점수, 분류, 심사 의견, 담당자 메모)는
 * 여기에 절대 나오면 안 됩니다.
 */
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getApplication, getCall } from '@/lib/mock-data'
import { Field, PageTitle, Panel, StatusBadge } from '@/components/ui'
import { canSubmitReport, participantMessage, STAGES, stageIndex } from '@/lib/domain/stage'
import { formatMoney, settlementTotals } from '@/lib/domain/settlement'

export default async function MyApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login?error=required')

  const { id } = await params
  const app = getApplication(id)

  // 남의 신청서는 볼 수 없습니다.
  // 로그인한 사람의 신청서가 아니면 '없는 페이지'로 처리합니다.
  // (권한 없음이라고 알려주면 "그 번호의 신청서는 존재한다"는 사실이 새어 나갑니다)
  if (!app || app.accountId !== session.accountId) notFound()

  const call = getCall(app.callId)
  const current = stageIndex(app.stage)
  const totals = settlementTotals(app.settlement)

  return (
    <div className="max-w-[900px] mx-auto px-6 py-14">
      <Link href="/my" className="text-[13px] text-muted hover:text-text inline-block mb-3">
        ← 내 신청 내역
      </Link>

      <PageTitle title={call?.title ?? '신청서'} sub={`접수번호 ${app.displayNo}`} />

      <Panel>
        <div className="flex items-center gap-2 mb-3">
          <StatusBadge status={app.status} />
          <span className="text-[13.5px] text-muted">
            {participantMessage(app.stage, app.status)}
          </span>
        </div>

        {/* 진행 막대 — 미선정이면 의미가 없으므로 감춥니다 */}
        {app.status !== 'rejected' && (
          <div className="flex gap-1 mt-4">
            {STAGES.map((s, i) => (
              <div key={s.key} className="flex-1">
                <div
                  className={`h-1.5 rounded-full mb-1.5 ${
                    i <= current ? 'bg-accent' : 'bg-[#e4e2da]'
                  }`}
                />
                <div className={`text-[11.5px] ${i <= current ? 'text-accent' : 'text-faint'}`}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="신청 내용">
        <Field label="신청일" value={app.createdAt} />
        <Field label="신청 동기 · 욕구" value={app.motive} />
        <Field label="요청 예산" value={app.requestedBudget && `${formatMoney(app.requestedBudget)} 원`} />
        {app.attachments.length > 0 && (
          <Field
            label="첨부파일"
            value={
              <ul className="space-y-1">
                {app.attachments.map((f) => (
                  <li key={f.name} className="text-[13.5px]">
                    {f.name}{' '}
                    <span className="text-faint">{Math.round(f.size / 1024).toLocaleString()}KB</span>
                  </li>
                ))}
              </ul>
            }
          />
        )}
      </Panel>

      {/* 결과보고는 선정된 뒤에만 보입니다 */}
      {canSubmitReport(app.stage, app.status) || app.reportStatus !== 'none' ? (
        <Panel title="결과보고">
          {app.reportStatus === 'rejected' && (
            <div className="text-[13px] bg-[#faece7] text-[#993c1d] rounded-[7px] px-3.5 py-3 mb-4">
              <strong className="font-semibold">반려되었습니다.</strong>
              <div className="mt-1">{app.reportRejectReason}</div>
              <div className="mt-2 text-[12.5px]">내용을 보완해 다시 제출해 주세요.</div>
            </div>
          )}
          {app.reportStatus === 'approved' && (
            <div className="text-[13px] bg-accent-bg text-accent rounded-[7px] px-3.5 py-3 mb-4">
              결과보고가 승인되었습니다.
            </div>
          )}

          <Field label="결과 요약" value={app.reportSummary} />
          {app.resultFiles.length > 0 && (
            <Field
              label="제출 파일"
              value={app.resultFiles.map((f) => f.name).join(', ')}
            />
          )}

          {app.reportStatus !== 'approved' && (
            <button className="mt-2 bg-accent text-white rounded-[7px] px-4 py-2.5 text-sm font-medium hover:opacity-90">
              {app.reportStatus === 'none' ? '결과보고 작성' : '결과보고 수정·재제출'}
            </button>
          )}
        </Panel>
      ) : null}

      {/* 정산은 참여자도 자기 것은 볼 수 있게 합니다.
          단 재단이 매긴 3축 평가(일정 준수·충실도·소통)는 보여주지 않습니다. */}
      {app.settlement.items.length > 0 && (
        <Panel title="정산 현황">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-muted text-[12.5px] border-b border-line">
                <th className="text-left font-medium pb-2">항목</th>
                <th className="text-right font-medium pb-2">계획</th>
                <th className="text-right font-medium pb-2">집행</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {app.settlement.items.map((it, i) => (
                <tr key={i}>
                  <td className="py-2">{it.name}</td>
                  <td className="py-2 text-right">{formatMoney(it.planned)}</td>
                  <td className="py-2 text-right">{formatMoney(it.spent)}</td>
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
                <td className="pt-2.5 text-right">{formatMoney(totals.planned)}</td>
                <td className="pt-2.5 text-right">{formatMoney(totals.spent)}</td>
              </tr>
            </tfoot>
          </table>
        </Panel>
      )}
    </div>
  )
}
