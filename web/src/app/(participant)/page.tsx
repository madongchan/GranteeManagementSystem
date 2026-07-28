/**
 * 참여자 첫 화면 — 모집 중인 공모사업 목록
 *
 * 글만 나열하면 무슨 사업인지 눈에 안 들어와서 대표 이미지를 크게 넣었습니다.
 * 관리자가 이미지를 올리지 않았으면 제목으로 만든 기본 이미지가 대신 보입니다.
 */
import Link from 'next/link'
import { getOpenCalls } from '@/lib/mock-data'
import { Empty, PageTitle, Panel } from '@/components/ui'
import { callImageSrc } from '@/lib/call-image'
import { kindLabel } from '@/lib/taxonomy'

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
        <div className="grid gap-4 sm:grid-cols-2">
          {calls.map((call) => (
            <article
              key={call.id}
              className="bg-surface border border-line rounded-[10px] overflow-hidden flex flex-col hover:border-line2 transition-colors"
            >
              {/* 대표 이미지 */}
              <Link href={`/apply/${call.id}`} className="block relative aspect-[16/9] bg-[#f1efe8]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={callImageSrc(call)}
                  alt={`${call.title} 공고 이미지`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 text-[11.5px] px-2 py-[3px] rounded-md bg-white/95 text-accent font-medium">
                  모집중
                </span>
              </Link>

              <div className="px-[22px] py-5 flex flex-col flex-1">
                <h3 className="text-[15.5px] font-semibold mb-2">{call.title}</h3>
                <p className="text-[13.5px] text-muted mb-4 flex-1">{call.description}</p>

                {/* 분야 태그 */}
                {call.sectors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3.5">
                    {call.sectors.map((s) => (
                      <span
                        key={s}
                        className="text-[11.5px] px-2 py-[3px] rounded-md bg-accent-bg text-accent"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <dl className="text-[13px] space-y-1.5 mb-4">
                  <Row label="신청 기간" value={`${call.startDate} ~ ${call.endDate}`} />
                  <Row label="지원 규모" value={call.budget} />
                  <Row label="모집 정원" value={call.capacity} />
                  <Row
                    label="지원 대상"
                    value={call.targets.map((t) => kindLabel(t)).join(' · ')}
                  />
                </dl>

                <Link
                  href={`/apply/${call.id}`}
                  className="block text-center bg-accent text-white rounded-[7px] py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  신청하기
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted w-[62px] shrink-0">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
