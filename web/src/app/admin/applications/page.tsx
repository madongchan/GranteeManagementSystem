/**
 * 관리자 — 참여자 목록
 */
import { getApplications, getCalls } from '@/lib/mock-data'
import { ApplicationList } from '@/components/application-list'
import { PageTitle } from '@/components/ui'

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>
}) {
  // 대시보드에서 단계를 눌러 들어오면 ?stage=review 처럼 붙어 옵니다.
  const { stage } = await searchParams

  return (
    <>
      <PageTitle title="참여자" sub="신청·심사·정산·사후관리 대상을 관리합니다." />
      <ApplicationList
        apps={getApplications()}
        calls={getCalls()}
        initialStage={stage ?? 'all'}
      />
    </>
  )
}
