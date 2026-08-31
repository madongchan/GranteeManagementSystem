/**
 * 첫 로그인 정보 입력
 *
 * 소셜 로그인으로 새 회원이 만들어지면(또는 정보가 덜 찼으면) 여기로 옵니다.
 * 저장하면 원래 가려던 화면(?next=)으로 돌아갑니다.
 */
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getAccount } from '@/lib/data'
import { ProfileForm } from '@/components/profile-form'
import { PageTitle } from '@/components/ui'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login?error=required&next=%2Fonboarding')

  const account = await getAccount(session.accountId)
  if (!account) redirect('/login?error=required')

  const { next } = await searchParams
  const back = next && next.startsWith('/') && !next.startsWith('//') ? next : '/'

  return (
    <div className="max-w-[760px] mx-auto px-6 py-14">
      <PageTitle
        title="기관·개인 정보 입력"
        sub="신청과 진행 상황 확인에 쓰입니다. 나중에 언제든 고칠 수 있습니다."
      />
      <ProfileForm account={account} next={back} />
    </div>
  )
}
