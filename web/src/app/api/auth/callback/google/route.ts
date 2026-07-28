/**
 * 구글에서 돌아왔을 때 — 코드를 사용자 정보로 바꾸고 세션을 만듭니다.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { exchangeCode, setSession } from '@/lib/auth'
import { ACCOUNTS, CURRENT_ACCOUNT_ID } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl

  // 사용자가 구글 화면에서 취소한 경우
  if (searchParams.get('error')) {
    return NextResponse.redirect(new URL('/login?error=cancelled', request.url))
  }

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const savedState = request.cookies.get('oauth_state')?.value

  // 보낼 때 만들어둔 값과 다르면 우리가 시작한 로그인이 아닙니다
  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL('/login?error=state', request.url))
  }

  try {
    const profile = await exchangeCode(code, origin)

    // 구글 계정의 이메일과 같은 회원이 있으면 그 회원으로,
    // 없으면 시연용 기본 회원으로 연결합니다.
    // (실제로는 여기서 DB에 회원을 만들거나 찾아야 합니다)
    const matched = ACCOUNTS.find((a) => a.email.toLowerCase() === profile.email.toLowerCase())

    await setSession({
      sub: profile.sub,
      name: profile.name,
      email: profile.email,
      picture: profile.picture,
      accountId: matched?.id ?? CURRENT_ACCOUNT_ID,
    })

    // 로그인 전에 보려던 곳으로 돌려보냅니다 (없으면 공모 목록)
    const next = request.cookies.get('oauth_next')?.value ?? '/'
    const response = NextResponse.redirect(new URL(next, request.url))
    response.cookies.delete('oauth_state')
    response.cookies.delete('oauth_next')
    return response
  } catch (error) {
    console.error('구글 로그인 실패:', error)
    return NextResponse.redirect(new URL('/login?error=failed', request.url))
  }
}
