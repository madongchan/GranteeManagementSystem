/**
 * 공용 부품
 *
 * 화면 여기저기서 반복되는 조각들을 모아뒀습니다.
 * 유니티로 치면 프리팹에 해당합니다.
 */
import Link from 'next/link'
import type { Classification, Status } from '@/lib/types'
import { CLASS_STYLE } from '@/lib/domain/classify'
import { STATUS_LABEL, STATUS_STYLE } from '@/lib/domain/stage'

/** 흰 카드 */
export function Panel({
  title,
  children,
  className = '',
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`bg-surface border border-line rounded-[10px] px-[22px] py-5 mb-3.5 ${className}`}
    >
      {title && <h3 className="text-[14.5px] font-semibold mb-3.5">{title}</h3>}
      {children}
    </section>
  )
}

/** 숫자 하나를 크게 보여주는 칸 */
export function Metric({
  label,
  value,
  unit,
  href,
}: {
  label: string
  value: number | string
  unit?: string
  href?: string
}) {
  const inner = (
    <>
      <div className="text-[12.5px] text-muted mb-[7px]">{label}</div>
      <div className="text-[27px] font-semibold tracking-[-0.5px] leading-none">
        {value}
        {unit && <small className="text-sm text-faint font-medium ml-[3px]">{unit}</small>}
      </div>
    </>
  )

  const cls =
    'bg-surface border border-line rounded-[10px] px-[18px] py-4 block' +
    (href ? ' hover:border-line2 transition-colors' : '')

  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

/** 분류 배지 (성장연계 / 집중관리 / ...) */
export function ClassBadge({ label }: { label: Classification }) {
  return (
    <span
      className={`inline-block px-2 py-[3px] rounded-md text-[12px] font-medium ${CLASS_STYLE[label]}`}
    >
      {label}
    </span>
  )
}

/** 참여자 상태 배지 (접수 완료 / 심사 중 / ...) */
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block px-2 py-[3px] rounded-md text-[12px] font-medium ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

/** 기관·기업 / 개인 구분 태그 */
export function KindTag({ kind }: { kind: 'org' | 'individual' }) {
  return (
    <span className="inline-block px-[7px] py-[2px] rounded text-[11.5px] bg-[#f1efe8] text-muted">
      {kind === 'individual' ? '개인' : '기관·기업'}
    </span>
  )
}

/** 라벨 + 값 한 줄 */
export function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  const empty = value === null || value === undefined || value === ''
  return (
    <div className="mb-3">
      <div className="text-[12.5px] text-muted mb-1">{label}</div>
      <div className={empty ? 'text-faint' : ''}>{empty ? '—' : value}</div>
    </div>
  )
}

/** 페이지 제목 */
export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-[22px]">
      <h1 className="text-[21px] font-semibold tracking-[-0.3px] mb-1">{title}</h1>
      {sub && <p className="text-muted text-[13.5px]">{sub}</p>}
    </div>
  )
}

/** 내용이 없을 때 */
export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-faint text-[13.5px] py-6 text-center">{children}</div>
}
