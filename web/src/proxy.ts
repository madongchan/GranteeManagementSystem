/**
 * 주소로 참여자 화면과 관리자 화면을 가릅니다.
 *
 * 가르는 방법이 두 가지입니다. 환경변수가 있으면 그것을 먼저 봅니다.
 *
 * 1) 환경변수 SITE_MODE — 배포할 때 씁니다.
 *    같은 코드를 Vercel에 두 번 올리고 각각 다른 값을 줍니다.
 *      SITE_MODE=participant  →  hamkke-apply.vercel.app   (참여자)
 *      SITE_MODE=admin        →  hamkke-admin.vercel.app   (관리자)
 *
 * 2) 주소 앞부분(host) — 내 컴퓨터에서 개발할 때 씁니다.
 *      http://localhost:3000        →  참여자
 *      http://admin.localhost:3000  →  관리자
 *
 * 나중에 도메인을 사면 환경변수를 빼고 www./admin. 으로만 갈라도 됩니다.
 *
 * 미들웨어(proxy)는 모든 요청이 화면에 닿기 전에 거쳐가는 검문소입니다.
 * 주소창에 보이는 주소는 그대로 두고 내부 경로만 바꾸는 것을 '리라이트'라고 합니다.
 *
 * ⚠️ 로그인에 아직 '관리자 권한' 개념이 없습니다. 관리자 주소를 아는 사람은
 *    들어올 수 있습니다. 주소를 숨기는 것은 보안이 아닙니다.
 *    실제 방어선은 DB를 붙일 때 "이 사람이 관리자인가"를 확인하는 것입니다.
 */
import { NextResponse, type NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  const mode = process.env.SITE_MODE
  const host = request.headers.get('host') ?? ''

  // 환경변수가 있으면 그것을 따르고, 없으면 주소 앞부분을 봅니다.
  const isAdminSite = mode ? mode === 'admin' : host.startsWith('admin.')

  const { pathname } = request.nextUrl

  // 로그인 처리 통로는 양쪽 모두 그대로 통과시킵니다.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (isAdminSite) {
    // 주소창에는 /applications 로 보이지만 실제로는 /admin/applications 를 그립니다.
    const url = request.nextUrl.clone()
    url.pathname = pathname === '/' ? '/admin' : `/admin${pathname}`
    return NextResponse.rewrite(url)
  }

  // 참여자 사이트에서 /admin 을 직접 치면 없는 페이지로 처리합니다.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return new NextResponse(null, { status: 404 })
  }

  return NextResponse.next()
}

export const config = {
  // 정적 파일과 Next.js 내부 요청은 검문소를 건너뛰게 합니다.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
