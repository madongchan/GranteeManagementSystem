import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAccount, getCalls, getMyApplications } from '@/lib/data'
import { MemberEditForm } from '@/components/member-edit-form'
import { PageTitle, Panel } from '@/components/ui'
import { stageLabel } from '@/lib/domain/stage'

// 여러 명이 동시에 쓰는 실데이터라 매 요청마다 새로 읽습니다 (정적 캐싱 금지).
export const dynamic = 'force-dynamic'

export default async function MemberEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [account, myApps, calls] = await Promise.all([
    getAccount(id),
    getMyApplications(id),
    getCalls(),
  ])
  if (!account) notFound()

  return (
    <>
      <Link href="/members" className="text-[13px] text-muted hover:text-text inline-block mb-3">
        ← 참여자 정보
      </Link>

      <PageTitle title={account.name} 
        sub={`가입일 ${account.createdAt}${account.regNo ? ` · ${account.regNoKind} ${account.regNo}` : ''}`}
      />

      <MemberEditForm account={account} />

      <Panel title={`신청 이력 ${myApps.length}건`} className="mt-3.5">
        {myApps.length === 0 ? (
          <p className="text-faint text-[13.5px]">신청 이력이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-line -my-1">
            {myApps.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/applications/${a.id}`}
                  className="flex flex-wrap items-center gap-2 py-2.5 hover:text-accent"
                >
                  <span className="text-[13.5px] flex-1">
                    {calls.find((c) => c.id === a.callId)?.title ?? '—'}
                  </span>
                  <span className="text-[12.5px] text-muted">{stageLabel(a.stage)}</span>
                  <span className="text-[12.5px] text-faint">{a.createdAt}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  )
}
