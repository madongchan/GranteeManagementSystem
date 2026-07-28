/**
 * 로그아웃 — 세션 쿠키를 지웁니다.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { clearSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  await clearSession()
  // 303 = "이제 GET으로 이 주소를 열어라". 새로고침 시 재전송을 막아줍니다.
  return NextResponse.redirect(new URL('/', request.url), 303)
}
