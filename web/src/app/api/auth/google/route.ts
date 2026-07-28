/**
 * 구글 로그인 시작 — 사용자를 구글로 보냅니다.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createState, googleAuthUrl, isGoogleConfigured } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!isGoogleConfigured()) {
    // 키가 없으면 로그인 화면으로 돌려보내며 안내합니다
    return NextResponse.redirect(new URL('/login?error=not-configured', request.url))
  }

  const origin = request.nextUrl.origin
  const state = createState()

  // 로그인 끝나고 돌아갈 곳. 없으면 공모 목록으로 보냅니다.
  // 주소를 통째로 받으면 다른 사이트로 튕기는 공격에 쓰일 수 있어
  // '/' 로 시작하는 우리 사이트 안의 경로만 받습니다.
  const raw = request.nextUrl.searchParams.get('next') ?? '/'
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'

  const response = NextResponse.redirect(googleAuthUrl(origin, state))
  response.cookies.set('oauth_next', next, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  })

  // 돌아왔을 때 대조할 값을 잠깐 저장합니다 (10분)
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  })

  return response
}
