/**
 * 관리자 — 참여자 목록
 */
import { getApplications, getCalls } from '@/lib/data'
import { ApplicationList } from '@/components/application-list'
import { PageTitle } from '@/components/ui'

// 여러 명이 동시에 쓰는 실데이터라 매 요청마다 새로 읽습니다 (정적 캐싱 금지).
export const dynamic = 'force-dynamic'

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>
}) {
  // 대시보드에서 단계를 눌러 들어오면 ?stage=review 처럼 붙어 옵니다.
  const { stage } = await searchParams
  const [apps, calls] = await Promise.all([getApplications(), getCalls()])

  return (
    <>
      <PageTitle title="참여자" sub="신청·심사·정산·사후관리 대상을 관리합니다." />
      <ApplicationList
        apps={apps}
        calls={calls}
        initialStage={stage ?? 'all'}
      />
    </>
  )
}
