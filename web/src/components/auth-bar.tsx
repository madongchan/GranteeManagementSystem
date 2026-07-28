/**
 * 화면 오른쪽 위의 얇은 로그인 줄
 *
 * 참여자가 할 일은 공모 신청뿐이라 메뉴를 두지 않았지만,
 * 로그인해야 볼 수 있는 '내 신청 내역' 으로 가는 길은 있어야 해서
 * 최소한으로 넣었습니다.
 */
import Link from 'next/link'
import { getSession } from '@/lib/auth'

export async function AuthBar() {
  const session = await getSession()

  return (
    <div className="border-b border-line bg-surface">
      <div className="max-w-[1180px] mx-auto px-6 h-11 flex items-center justify-end gap-4 text-[12.5px]">
        {session ? (
          <>
            <span className="text-muted">
              <strong className="font-medium text-text">{session.name}</strong> 님
            </span>
            <Link href="/my" className="text-text hover:text-accent transition-colors">
              내 신청 내역
            </Link>
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
  )
}
