/**
 * 신청서 작성 화면
 *
 * 신청서에는 기관 정보가 자동으로 채워져야 하므로 로그인이 필요합니다.
 * 로그인 안 한 사람은 로그인 화면으로 보냅니다.
 */
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getAccount, getCall } from '@/lib/mock-data'
import { ApplyForm } from '@/components/apply-form'
import { PageTitle } from '@/components/ui'

export default async function ApplyPage({ params }: { params: Promise<{ callId: string }> }) {
  const { callId } = await params

  const session = await getSession()
  // 로그인 후 이 신청서로 그대로 돌아오게 합니다
  if (!session) redirect(`/login?error=required&next=${encodeURIComponent(`/apply/${callId}`)}`)

  const call = getCall(callId)
  const account = getAccount(session.accountId)

  if (!call || !account) notFound()

  return (
    <div className="max-w-[860px] mx-auto px-6 py-14">
      <PageTitle title={call.title} sub={call.description} />
      <ApplyForm call={call} account={account} />
    </div>
  )
}
