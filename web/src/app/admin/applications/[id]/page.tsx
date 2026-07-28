import { notFound } from 'next/navigation'
import { getApplication, getCall } from '@/lib/mock-data'
import { ApplicationDetail } from '@/components/application-detail'

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const app = getApplication(id)
  if (!app) notFound()

  return <ApplicationDetail app={app} call={getCall(app.callId)} />
}
