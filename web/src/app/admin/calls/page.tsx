/**
 * 관리자 — 공모사업 관리
 */
import { getApplications, getCalls } from '@/lib/mock-data'
import { PageTitle, Panel } from '@/components/ui'

const TARGET_LABEL = {
  org: '기관·기업',
  individual: '개인',
  both: '기관·개인 모두',
} as const

export default function AdminCallsPage() {
  const calls = getCalls()
  const apps = getApplications()

  return (
    <>
      <PageTitle title="공모사업" sub="공모를 등록하고 모집 상태를 관리합니다." />

      <div className="mb-3.5">
        <button className="bg-accent text-white rounded-[7px] px-4 py-2.5 text-sm font-medium hover:opacity-90">
          + 공모사업 등록
        </button>
      </div>

      <div className="space-y-3.5">
        {calls.map((call) => {
          const count = apps.filter((a) => a.callId === call.id).length
          const open = call.status === 'open'

          return (
            <Panel key={call.id} className="mb-0">
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <h3 className="text-[15.5px] font-semibold flex-1">{call.title}</h3>
                <span
                  className={`text-[11.5px] px-2 py-[3px] rounded-md font-medium ${
                    open ? 'bg-accent-bg text-accent' : 'bg-[#f1efe8] text-faint'
                  }`}
                >
                  {open ? '모집중' : '마감'}
                </span>
              </div>

              <p className="text-[13.5px] text-muted mb-3">{call.description}</p>

              <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[13px]">
                <span>
                  <span className="text-muted">기간</span> {call.startDate} ~ {call.endDate}
                </span>
                <span>
                  <span className="text-muted">규모</span> {call.budget}
                </span>
                <span>
                  <span className="text-muted">정원</span> {call.capacity}
                </span>
                <span>
                  <span className="text-muted">대상</span> {TARGET_LABEL[call.target]}
                </span>
                <span className="font-medium">신청 {count}건</span>
              </div>
            </Panel>
          )
        })}
      </div>
    </>
  )
}
