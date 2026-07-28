/**
 * 주소로 참여자 화면과 관리자 화면을 가릅니다.
 *
 *   http://localhost:3000        → 참여자 화면
 *   http://admin.localhost:3000  → 관리자 화면
 *
 * 실제 서비스에서는 이렇게 됩니다.
 *   https://www.도메인.kr    → 참여자
 *   https://admin.도메인.kr  → 관리자
 *
 * 미들웨어는 모든 요청이 화면에 닿기 전에 거쳐가는 검문소입니다.
 * 여기서 주소창의 host(admin. 으로 시작하는지)를 보고 내부 경로를 바꿔줍니다.
 * 주소창에 보이는 주소는 그대로 두고 내부에서만 경로를 바꾸는 것을 '리라이트'라고 합니다.
 *
 * ⚠️ 지금은 로그인이 없어서 주소를 아는 사람은 관리자 화면에 들어올 수 있습니다.
 *    실제 방어선은 로그인을 붙일 때 '관리자 권한이 있는지' 확인하는 것입니다.
 *    주소를 숨기는 것은 보안이 아닙니다.
 */
import { NextResponse, type NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const isAdminHost = host.startsWith('admin.')
  const { pathname } = request.nextUrl

  if (isAdminHost) {
    // admin.도메인 으로 들어오면 내부적으로 /admin 아래 화면을 보여줍니다.
    // 주소창에는 /applications 로 보이지만 실제로는 /admin/applications 를 그립니다.
    const url = request.nextUrl.clone()
    url.pathname = pathname === '/' ? '/admin' : `/admin${pathname}`
    return NextResponse.rewrite(url)
  }

  // 참여자 주소에서 /admin 을 직접 치면 없는 페이지로 처리합니다.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return new NextResponse(null, { status: 404 })
  }

  return NextResponse.next()
}

export const config = {
  // 정적 파일과 Next.js 내부 요청은 검문소를 건너뛰게 합니다.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
