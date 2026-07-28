/**
 * 내 신청 내역
 *
 * 지금은 로그인이 없어서 '햇살지역아동센터'로 로그인한 것으로 가정합니다.
 * (mock-data.ts 의 CURRENT_ACCOUNT_ID)
 */
import Link from 'next/link'
import { CURRENT_ACCOUNT_ID, getCall, getMyApplications } from '@/lib/mock-data'
import { Empty, PageTitle, Panel, StatusBadge } from '@/components/ui'
import { participantMessage } from '@/lib/domain/stage'

export default function MyApplicationsPage() {
  const apps = getMyApplications(CURRENT_ACCOUNT_ID)

  return (
    <>
      <PageTitle title="내 신청 내역" sub="신청한 사업의 진행 상황을 확인할 수 있습니다." />

      {apps.length === 0 ? (
        <Panel>
          <Empty>
            아직 신청한 사업이 없습니다.{' '}
            <Link href="/" className="text-accent underline">
              공모사업 보러가기
            </Link>
          </Empty>
        </Panel>
      ) : (
        <div className="space-y-3.5">
          {apps.map((app) => {
            const call = getCall(app.callId)
            return (
              <Link key={app.id} href={`/my/${app.id}`} className="block">
                <Panel className="mb-0 hover:border-line2 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-[15px] font-semibold">{call?.title ?? '—'}</h3>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="text-[13px] text-muted mb-2">
                        {participantMessage(app.stage, app.status)}
                      </p>
                      <div className="text-[12.5px] text-faint">
                        접수번호 {app.displayNo} · 신청일 {app.createdAt}
                      </div>
                    </div>
                    <span className="text-faint text-lg shrink-0">›</span>
                  </div>

                  {/* 반려된 결과보고가 있으면 목록에서 바로 눈에 띄게 합니다 */}
                  {app.reportStatus === 'rejected' && (
                    <div className="mt-3 text-[13px] bg-[#faece7] text-[#993c1d] rounded-[7px] px-3 py-2.5">
                      결과보고가 반려되었습니다 — {app.reportRejectReason}
                    </div>
                  )}
                </Panel>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
