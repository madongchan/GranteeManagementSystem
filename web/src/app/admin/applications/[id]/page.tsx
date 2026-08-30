import { notFound } from 'next/navigation'
import { getApplication, getCall } from '@/lib/data'
import { ApplicationDetail } from '@/components/application-detail'

// 여러 명이 동시에 쓰는 실데이터라 매 요청마다 새로 읽습니다 (정적 캐싱 금지).
export const dynamic = 'force-dynamic'

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const app = await getApplication(id)
  if (!app) notFound()

  const call = await getCall(app.callId)
  return <ApplicationDetail app={app} call={call} />
}
