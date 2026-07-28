'use client'

/**
 * 화면 맨 위 머리말
 *
 * 참여자용과 관리자용 두 가지가 있습니다.
 * 지금은 로그인이 없어서 오른쪽 끝에 서로 오갈 수 있는 버튼을 뒀습니다.
 * (나중에 로그인을 붙이면 이 버튼은 없애고 주소로 갈립니다)
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function Nav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 ml-auto">
      {items.map((item) => {
        const active =
          item.href === '/' || item.href === '/admin'
            ? pathname === item.href
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3.5 py-2 rounded-[7px] text-sm font-medium transition-colors ${
              active ? 'bg-accent-bg text-accent' : 'text-muted hover:bg-bg'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function ParticipantHeader() {
  return (
    <header className="bg-surface border-b border-line sticky top-0 z-10">
      <div className="max-w-[1080px] mx-auto px-5">
        <div className="flex items-center gap-6 h-[60px]">
          <Link href="/" className="flex items-center gap-[9px] text-base font-semibold">
            <span className="w-[9px] h-[9px] rounded-full bg-accent" />
            함께일하는재단
          </Link>
          <Nav
            items={[
              { href: '/', label: '공모사업' },
              { href: '/my', label: '내 신청 내역' },
            ]}
          />
          <Link
            href="/admin"
            className="text-[12.5px] text-faint hover:text-muted border border-line rounded-md px-2.5 py-1.5"
          >
            관리자 화면 →
          </Link>
        </div>
      </div>
    </header>
  )
}

export function AdminHeader() {
  return (
    <header className="bg-surface border-b border-line sticky top-0 z-10">
      <div className="max-w-[1080px] mx-auto px-5">
        <div className="flex items-center gap-6 h-[60px]">
          <Link href="/admin" className="flex items-center gap-[9px] text-base font-semibold">
            <span className="w-[9px] h-[9px] rounded-full bg-accent" />
            통합관리시스템
            <span className="text-[11px] font-normal text-faint border border-line rounded px-1.5 py-0.5">
              관리자
            </span>
          </Link>
          <Nav
            items={[
              { href: '/admin', label: '대시보드' },
              { href: '/admin/applications', label: '참여자' },
              { href: '/admin/calls', label: '공모사업' },
            ]}
          />
          <Link
            href="/"
            className="text-[12.5px] text-faint hover:text-muted border border-line rounded-md px-2.5 py-1.5"
          >
            ← 참여자 화면
          </Link>
        </div>
      </div>
    </header>
  )
}
