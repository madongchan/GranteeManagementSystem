/**
 * 관리자 — 공모사업 관리
 */
import { getApplications, getCalls } from '@/lib/mock-data'
import { CallManager } from '@/components/call-manager'
import { PageTitle } from '@/components/ui'

export default function AdminCallsPage() {
  return (
    <>
      <PageTitle
        title="공모사업"
        sub="공모를 등록하고 대표 이미지와 모집 상태를 관리합니다."
      />
      <CallManager calls={getCalls()} applications={getApplications()} />
    </>
  )
}
