/**
 * 카카오 로그인 시작 — 사용자를 카카오로 보냅니다. (구글과 동일한 구조)
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createState, isKakaoConfigured, kakaoAuthUrl } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!isKakaoConfigured()) {
    return NextResponse.redirect(new URL('/login?error=not-configured', request.url))
  }

  const origin = request.nextUrl.origin
  const state = createState()

  // 로그인 끝나고 돌아갈 곳. 우리 사이트 안의 경로만 받습니다.
  const raw = request.nextUrl.searchParams.get('next') ?? '/'
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'

  const response = NextResponse.redirect(kakaoAuthUrl(origin, state))
  const cookie = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  }
  response.cookies.set('oauth_next', next, cookie)
  response.cookies.set('oauth_state', state, cookie)
  return response
}
