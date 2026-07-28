/**
 * 화면 맨 위의 얇은 줄
 *
 * 참여자가 할 일은 공모 신청뿐이라 메뉴를 크게 두지 않았지만,
 * 어디에 있든 공모 목록으로 돌아갈 수 있어야 해서 링크를 함께 둡니다.
 * (이게 없으면 로그인 후 '내 신청 내역'에 갇혀 신청을 못 합니다)
 */
import Link from 'next/link'
import { getSession } from '@/lib/auth'

export async function AuthBar() {
  const session = await getSession()

  return (
    <div className="border-b border-line bg-surface">
      <div className="max-w-[1180px] mx-auto px-6 h-11 flex items-center gap-4 text-[12.5px]">
        <Link href="/" className="text-text hover:text-accent transition-colors font-medium">
          사업 공모
        </Link>

        <div className="ml-auto flex items-center gap-4">
          {session ? (
            <>
              <Link href="/my" className="text-text hover:text-accent transition-colors">
                내 신청 내역
              </Link>
              <span className="text-muted">
                <strong className="font-medium text-text">{session.name}</strong> 님
              </span>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="text-muted hover:text-text transition-colors">
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-text hover:text-accent transition-colors">
              로그인
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
