/**
 * 관리자 — 공모사업 관리
 */
import { getApplications, getCalls } from '@/lib/data'
import { CallManager } from '@/components/call-manager'
import { PageTitle } from '@/components/ui'

// 여러 명이 동시에 쓰는 실데이터라 매 요청마다 새로 읽습니다 (정적 캐싱 금지).
export const dynamic = 'force-dynamic'

export default async function AdminCallsPage() {
  const [calls, applications] = await Promise.all([getCalls(), getApplications()])
  return (
    <>
      <PageTitle
        title="공모사업"
        sub="공모를 등록하고 대표 이미지와 모집 상태를 관리합니다."
      />
      <CallManager calls={calls} applications={applications} />
    </>
  )
}
