/**
 * 참여자 첫 화면 — 모집 중인 공모사업 목록
 */
import Link from 'next/link'
import { getOpenCalls } from '@/lib/mock-data'
import { Empty, PageTitle, Panel } from '@/components/ui'

const TARGET_LABEL = {
  org: '기관·기업',
  individual: '개인',
  both: '기관·개인 모두',
} as const

export default function CallsPage() {
  const calls = getOpenCalls()

  return (
    <>
      <PageTitle
        title="공모사업"
        sub="현재 모집 중인 사업입니다. 신청하려면 사업을 선택하세요."
      />

      {calls.length === 0 ? (
        <Panel>
          <Empty>지금은 모집 중인 사업이 없습니다.</Empty>
        </Panel>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {calls.map((call) => (
            <Panel key={call.id} className="mb-0 flex flex-col">
              <div className="flex items-start gap-2 mb-2">
                <h3 className="text-[15.5px] font-semibold flex-1">{call.title}</h3>
                <span className="shrink-0 text-[11.5px] px-2 py-[3px] rounded-md bg-accent-bg text-accent font-medium">
                  모집중
                </span>
              </div>

              <p className="text-[13.5px] text-muted mb-4 flex-1">{call.description}</p>

              <dl className="text-[13px] space-y-1.5 mb-4">
                <div className="flex gap-2">
                  <dt className="text-muted w-[62px] shrink-0">신청 기간</dt>
                  <dd>
                    {call.startDate} ~ {call.endDate}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted w-[62px] shrink-0">지원 규모</dt>
                  <dd>{call.budget}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted w-[62px] shrink-0">모집 정원</dt>
                  <dd>{call.capacity}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted w-[62px] shrink-0">지원 대상</dt>
                  <dd>{TARGET_LABEL[call.target]}</dd>
                </div>
              </dl>

              <Link
                href={`/apply/${call.id}`}
                className="block text-center bg-accent text-white rounded-[7px] py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                신청하기
              </Link>
            </Panel>
          ))}
        </div>
      )}
    </>
  )
}
