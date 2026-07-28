'use client'

/**
 * 공모사업 검색 · 필터 · 목록 (참여자 화면 전부)
 *
 * 참여자가 할 일은 공모사업을 찾아 신청하는 것 하나뿐이라
 * 위에 메뉴나 로고 같은 것을 두지 않았습니다.
 *
 * 구성
 *   제목 → 검색어 + 상세검색 → 사업구분 · 연도 · 사업명 → 목록 → 더보기
 *
 * 체크하는 즉시 결과가 걸러집니다. (검색하기 버튼도 그대로 동작합니다)
 */
import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Call } from '@/lib/types'
import { callImageSrc } from '@/lib/call-image'
import { SECTORS } from '@/lib/taxonomy'

/** 한 번에 보여줄 카드 수 */
const PAGE_SIZE = 8

export function CallSearch({ calls }: { calls: Call[] }) {
  const [query, setQuery] = useState('')
  const [detailOpen, setDetailOpen] = useState(true)
  const [sectors, setSectors] = useState<Set<string>>(new Set())
  const [year, setYear] = useState('')
  const [callName, setCallName] = useState('')
  const [sort, setSort] = useState('all')
  const [shown, setShown] = useState(PAGE_SIZE)

  /** 데이터에 실제로 있는 연도만 고릅니다 */
  const years = useMemo(
    () => [...new Set(calls.map((c) => c.startDate.slice(0, 4)))].sort().reverse(),
    [calls],
  )

  const filtered = useMemo(() => {
    return calls.filter((c) => {
      if (sectors.size > 0 && !c.sectors.some((s) => sectors.has(s))) return false
      if (year && !c.startDate.startsWith(year)) return false
      if (sort === 'open' && c.status !== 'open') return false
      if (sort === 'closed' && c.status !== 'closed') return false

      // 위쪽 검색어는 제목과 소개를 함께 봅니다
      if (query.trim()) {
        const haystack = `${c.title} ${c.description}`.toLowerCase()
        if (!haystack.includes(query.trim().toLowerCase())) return false
      }
      // 상세검색의 사업명은 제목만 봅니다
      if (callName.trim() && !c.title.toLowerCase().includes(callName.trim().toLowerCase())) {
        return false
      }
      return true
    })
  }, [calls, query, sectors, year, callName, sort])

  function toggleSector(value: string) {
    const next = new Set(sectors)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    setSectors(next)
    setShown(PAGE_SIZE)
  }

  function reset() {
    setQuery('')
    setSectors(new Set())
    setYear('')
    setCallName('')
    setShown(PAGE_SIZE)
  }

  const inputCls =
    'bg-surface border border-line rounded-[7px] px-4 py-2.5 text-sm focus:outline-none focus:border-accent'

  return (
    <>
      {/* ── 제목 ── */}
      <h1 className="text-center text-[40px] sm:text-[46px] font-semibold tracking-[-1.2px] text-text pt-16 pb-12">
        사업 공모<span className="text-accent">.</span>
      </h1>

      {/* ── 검색 패널 ── */}
      <section className="bg-surface border-y border-line">
        <div className="max-w-[1180px] mx-auto px-6 py-11">
          {/* 검색어 */}
          <div className="flex flex-col sm:flex-row justify-center gap-2">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShown(PAGE_SIZE)
              }}
              placeholder="검색어를 입력해 주세요"
              className={`sm:w-[520px] ${inputCls} py-3`}
            />
            <button className="bg-accent text-white rounded-[7px] px-11 py-3 text-sm font-medium hover:bg-accent-dark transition-colors">
              검색
            </button>
            <button
              onClick={() => setDetailOpen((v) => !v)}
              className="border border-line bg-bg rounded-[7px] px-11 py-3 text-sm font-medium text-text hover:border-line2 transition-colors"
            >
              상세검색
            </button>
          </div>

          <p className="text-center text-[13px] text-muted mt-3">
            옵션 별 검색을 원하시면, 상세검색을 클릭해주세요.
          </p>

          {/* 상세검색 */}
          {detailOpen && (
            <div className="mt-9 pt-9 border-t border-line">
              <FilterRow label="사업구분">
                {SECTORS.map((s) => (
                  <CheckChip
                    key={s}
                    label={s}
                    checked={sectors.has(s)}
                    onChange={() => toggleSector(s)}
                  />
                ))}
              </FilterRow>

              <FilterRow label="연도">
                <select
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value)
                    setShown(PAGE_SIZE)
                  }}
                  className={`w-[220px] ${inputCls}`}
                >
                  <option value="">연도 선택</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
              </FilterRow>

              <FilterRow label="사업명">
                <input
                  value={callName}
                  onChange={(e) => {
                    setCallName(e.target.value)
                    setShown(PAGE_SIZE)
                  }}
                  placeholder="예: 모두의공모"
                  className={`w-[260px] ${inputCls}`}
                />
              </FilterRow>

              <div className="flex justify-center gap-2 mt-10">
                <button
                  onClick={() => setShown(PAGE_SIZE)}
                  className="bg-accent text-white rounded-[7px] px-12 py-3 text-sm font-medium hover:bg-accent-dark transition-colors"
                >
                  검색하기
                </button>
                <button
                  onClick={reset}
                  className="border border-line bg-bg rounded-[7px] px-8 py-3 text-sm hover:border-line2 transition-colors"
                >
                  초기화
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 목록 ── */}
      <section className="max-w-[1180px] mx-auto px-6">
        <div className="flex items-center justify-between py-9">
          <p className="text-sm text-muted">
            총 <strong className="text-text">{filtered.length}</strong>건
          </p>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
              setShown(PAGE_SIZE)
            }}
            className={`w-[170px] ${inputCls}`}
          >
            <option value="all">전체</option>
            <option value="open">모집중</option>
            <option value="closed">모집마감</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-faint py-24 text-sm">조건에 맞는 공모사업이 없습니다.</p>
        ) : (
          <>
            <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.slice(0, shown).map((call) => (
                <CallCard key={call.id} call={call} />
              ))}
            </div>

            {shown < filtered.length && (
              <div className="flex justify-center mt-14">
                <button
                  onClick={() => setShown((n) => n + PAGE_SIZE)}
                  className="border border-accent text-accent rounded-[7px] px-12 py-3 text-sm font-medium hover:bg-accent hover:text-white transition-colors"
                >
                  더보기 <span className="ml-1">+</span>
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}

// ── 부품 ──────────────────────────────────────────────────────────

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-8 mb-6">
      <div className="sm:w-[76px] shrink-0 text-sm font-medium text-text pt-1.5">{label}</div>
      <div className="flex flex-wrap gap-x-5 gap-y-2.5">{children}</div>
    </div>
  )
}

function CheckChip({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 accent-[#1d7a5f] cursor-pointer"
      />
      <span
        className={`text-sm transition-colors ${
          checked ? 'text-accent font-medium' : 'text-text group-hover:text-accent'
        }`}
      >
        {label}
      </span>
    </label>
  )
}

function CallCard({ call }: { call: Call }) {
  const open = call.status === 'open'

  return (
    <article className="group">
      <Link href={`/apply/${call.id}`} className="block">
        {/* 공고 포스터 */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] border border-line bg-[#f1efe8] mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={callImageSrc(call)}
            alt={`${call.title} 공고 포스터`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <span
            className={`absolute top-0 left-0 px-3.5 py-1.5 text-[12.5px] font-medium text-white ${
              open ? 'bg-accent' : 'bg-[#9a9894]'
            }`}
          >
            {open ? '모집중' : '모집마감'}
          </span>
        </div>

        <h3 className="text-base font-semibold leading-[1.45] tracking-[-0.3px] text-text mb-2 group-hover:text-accent transition-colors">
          {call.title}
        </h3>
        <p className="text-[13.5px] leading-relaxed text-muted line-clamp-3">{call.description}</p>
      </Link>
    </article>
  )
}
