/**
 * 체험용 로그인
 *
 * 구글 계정 없이도 참여자 화면을 둘러볼 수 있게 하는 통로입니다.
 * 가짜 데이터의 회원 한 명을 골라 바로 로그인시킵니다.
 *
 * 켜지는 조건은 lib/auth.ts 의 isDemoLoginAllowed() 를 보세요.
 *
 * ⚠️ 실서비스 배포 전에는 ALLOW_DEMO_LOGIN 환경변수를 지우세요.
 *    남겨두면 아무나 다른 참여자 계정으로 들어갈 수 있습니다.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { isDemoLoginAllowed, setSession } from '@/lib/auth'
import { ACCOUNTS, CURRENT_ACCOUNT_ID } from '@/lib/mock-data'

export async function POST(request: NextRequest) {
  if (!isDemoLoginAllowed()) {
    return NextResponse.redirect(new URL('/login?error=demo-disabled', request.url), 303)
  }

  const accountId = (await request.formData()).get('accountId')?.toString() ?? CURRENT_ACCOUNT_ID
  const account = ACCOUNTS.find((a) => a.id === accountId) ?? ACCOUNTS[0]

  await setSession({
    sub: 'demo',
    name: account.name,
    email: account.email,
    accountId: account.id,
  })

  return NextResponse.redirect(new URL('/my', request.url), 303)
}
