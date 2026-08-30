/**
 * 관리자 — 참여자 정보
 */
import { getAccounts, getApplications, getCalls } from '@/lib/data'
import { MemberTable } from '@/components/member-table'
import { PageTitle } from '@/components/ui'

// 여러 명이 동시에 쓰는 실데이터라 매 요청마다 새로 읽습니다 (정적 캐싱 금지).
export const dynamic = 'force-dynamic'

export default async function AdminMembersPage() {
  const [accounts, applications, calls] = await Promise.all([
    getAccounts(),
    getApplications(),
    getCalls(),
  ])
  return (
    <>
      <PageTitle
        title="참여자 정보"
        sub="가입한 참여자를 조건별로 조회하고, 선택해 메일을 보내거나 엑셀로 내려받습니다."
      />
      <MemberTable accounts={accounts} applications={applications} calls={calls} />
    </>
  )
}
