/**
 * 관리자 — 사업 보고서
 */
import { getApplications, getCalls } from '@/lib/mock-data'
import { ReportView } from '@/components/report-view'
import { PageTitle } from '@/components/ui'

export default function AdminReportsPage() {
  return (
    <>
      <div className="print:hidden">
        <PageTitle
          title="사업 보고서"
          sub="사업·담당자별 현황을 한 장으로 정리합니다. 인쇄하거나 엑셀로 내려받을 수 있습니다."
        />
      </div>
      <ReportView apps={getApplications()} calls={getCalls()} />
    </>
  )
}
