/**
 * 카카오에서 돌아왔을 때 — 코드를 사용자 정보로 바꾸고, 우리 회원과 연결하고, 세션을 만듭니다.
 * (구글 콜백과 동일한 구조)
 */
import { NextResponse, type NextRequest } from 'next/server'
import { exchangeKakaoCode, setSession } from '@/lib/auth'
import { resolveLoginAccount } from '@/lib/auth-db'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl

  if (searchParams.get('error')) {
    return NextResponse.redirect(new URL('/login?error=cancelled', request.url))
  }

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const savedState = request.cookies.get('oauth_state')?.value

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL('/login?error=state', request.url))
  }

  try {
    const profile = await exchangeKakaoCode(code, origin)

    const { accountId, needsProfile } = await resolveLoginAccount({
      provider: 'kakao',
      providerId: profile.sub,
      name: profile.name,
      email: profile.email,
    })

    await setSession({
      sub: profile.sub,
      name: profile.name,
      email: profile.email,
      accountId,
    })

    const savedNext = request.cookies.get('oauth_next')?.value ?? '/'
    const dest = needsProfile
      ? `/onboarding?next=${encodeURIComponent(savedNext)}`
      : savedNext

    const response = NextResponse.redirect(new URL(dest, request.url))
    response.cookies.delete('oauth_state')
    response.cookies.delete('oauth_next')
    return response
  } catch (error) {
    console.error('카카오 로그인 실패:', error)
    return NextResponse.redirect(new URL('/login?error=failed', request.url))
  }
}
