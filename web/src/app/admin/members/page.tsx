/**
 * 관리자 — 참여자 정보
 */
import { getAccounts, getApplications, getCalls } from '@/lib/mock-data'
import { MemberTable } from '@/components/member-table'
import { PageTitle } from '@/components/ui'

export default function AdminMembersPage() {
  return (
    <>
      <PageTitle
        title="참여자 정보"
        sub="가입한 참여자를 조건별로 조회하고, 선택해 메일을 보내거나 엑셀로 내려받습니다."
      />
      <MemberTable
        accounts={getAccounts()}
        applications={getApplications()}
        calls={getCalls()}
      />
    </>
  )
}
