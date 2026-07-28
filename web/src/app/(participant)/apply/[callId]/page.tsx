/**
 * 신청서 작성 화면
 *
 * Next.js에서 주소의 [callId] 부분은 params로 들어옵니다.
 * Next 15부터 params가 비동기라서 await가 필요합니다.
 */
import { notFound } from 'next/navigation'
import { getAccount, getCall, CURRENT_ACCOUNT_ID } from '@/lib/mock-data'
import { ApplyForm } from '@/components/apply-form'
import { PageTitle } from '@/components/ui'

export default async function ApplyPage({ params }: { params: Promise<{ callId: string }> }) {
  const { callId } = await params
  const call = getCall(callId)
  const account = getAccount(CURRENT_ACCOUNT_ID)

  if (!call || !account) notFound()

  return (
    <>
      <PageTitle title={call.title} sub={call.description} />
      <ApplyForm call={call} account={account} />
    </>
  )
}
