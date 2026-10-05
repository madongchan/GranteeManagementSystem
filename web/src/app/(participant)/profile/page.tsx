/**
 * 내 정보 — 정보 수정과 회원 탈퇴
 */
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getAccount } from '@/lib/data'
import { isProfileComplete } from '@/lib/profile'
import { ProfileForm, WithdrawButton } from '@/components/profile-form'
import { PageTitle, Panel } from '@/components/ui'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login?error=required&next=%2Fprofile')

  const account = await getAccount(session.accountId)
  if (!account) notFound()

  const { saved, error } = await searchParams

  return (
    <div className="max-w-[760px] mx-auto px-6 py-14">
      <PageTitle title="내 정보" sub="신청서에 자동으로 들어가는 정보입니다." />

      {saved && (
        <div className="text-[13px] bg-accent-bg text-accent rounded-[7px] px-3.5 py-2.5 mb-3.5">
          저장했습니다.
        </div>
      )}
      {!isProfileComplete(account) && (
        <div className="text-[13px] text-[#a32d2d] bg-[#faece7] rounded-[7px] px-3.5 py-2.5 mb-3.5">
          기본 정보를 모두 입력해야 공모사업에 신청할 수 있습니다.
        </div>
      )}

      <ProfileForm account={account} next="/profile?saved=1" submitLabel="저장" />

      <Panel title="회원 탈퇴" className="mt-10">
        <p className="text-[13px] text-muted mb-3.5 leading-relaxed">
          탈퇴하면 개인정보와 로그인 연결이 삭제됩니다. 이미 제출한 신청서는 재단의 지원
          이력으로 남습니다.
        </p>
        {error === 'demo' && (
          <p className="text-[13px] text-[#a32d2d] mb-3">체험용 계정은 탈퇴할 수 없습니다.</p>
        )}
        <WithdrawButton />
      </Panel>
    </div>
  )
}
