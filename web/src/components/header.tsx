'use client'

/**
 * 화면 맨 위 머리말
 *
 * 참여자용과 관리자용이 완전히 분리되어 있습니다.
 *   localhost:3000        → 참여자
 *   admin.localhost:3000  → 관리자
 *
 * 서로 오가는 버튼은 없습니다. 주소가 다르기 때문입니다.
 * 관리자 화면의 주소는 middleware.ts 가 admin. 을 떼고 붙여주므로
 * 링크는 /applications 처럼 짧게 씁니다.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function Nav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 ml-auto overflow-x-auto">
      {items.map((item) => {
        const active =
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3.5 py-2 rounded-[7px] text-sm font-medium whitespace-nowrap transition-colors ${
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
          <Link href="/" className="flex items-center gap-[9px] text-base font-semibold shrink-0">
            <span className="w-[9px] h-[9px] rounded-full bg-accent" />
            함께일하는재단
          </Link>
          <Nav
            items={[
              { href: '/', label: '공모사업' },
              { href: '/my', label: '내 신청 내역' },
            ]}
          />
        </div>
      </div>
    </header>
  )
}

export function AdminHeader() {
  return (
    <header className="bg-surface border-b border-line sticky top-0 z-10 print:hidden">
      <div className="max-w-[1080px] mx-auto px-5">
        <div className="flex items-center gap-6 h-[60px]">
          <Link href="/" className="flex items-center gap-[9px] text-base font-semibold shrink-0">
            <span className="w-[9px] h-[9px] rounded-full bg-accent" />
            통합관리시스템
            <span className="text-[11px] font-normal text-faint border border-line rounded px-1.5 py-0.5">
              관리자
            </span>
          </Link>
          <Nav
            items={[
              { href: '/', label: '대시보드' },
              { href: '/applications', label: '신청 관리' },
              { href: '/members', label: '참여자 정보' },
              { href: '/calls', label: '공모사업' },
              { href: '/reports', label: '보고서' },
            ]}
          />
        </div>
      </div>
    </header>
  )
}
