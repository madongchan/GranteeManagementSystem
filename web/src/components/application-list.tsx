'use client'

/**
 * 참여자 목록 + 필터
 *
 * 검색·필터는 화면에서 바로 반응해야 해서 클라이언트 컴포넌트입니다.
 * ('use client' 가 그 표시입니다)
 */
import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Application, Call } from '@/lib/types'
import { ClassBadge, Empty, KindTag, Panel } from '@/components/ui'
import { ALL_CLASSES, effectiveClass } from '@/lib/domain/classify'
import { STAGES, stageLabel } from '@/lib/domain/stage'
import { isSettlementPoor } from '@/lib/domain/settlement'
import { KINDS, SECTORS } from '@/lib/taxonomy'

/** 동의 항목별 대상자 추출 — 재단이 안내 메일을 보낼 때 쓰는 기능 */
const CONSENT_FILTERS = [
  { value: 'all', label: '전체 (동의 무관)' },
  { value: 'followup', label: '후속지원 동의자' },
  { value: 'survey', label: '조사참여 동의자' },
  { value: 'research', label: '연구활용 동의자' },
] as const

export function ApplicationList({
  apps,
  calls,
  initialStage,
}: {
  apps: Application[]
  calls: Call[]
  initialStage: string
}) {
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState(initialStage)
  const [klass, setKlass] = useState('all')
  const [kind, setKind] = useState('all')
  const [sector, setSector] = useState('all')
  const [consent, setConsent] = useState('all')

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (stage !== 'all' && a.stage !== stage) return false
      if (klass !== 'all' && effectiveClass(a) !== klass) return false
      if (kind !== 'all' && a.applicant.kind !== kind) return false
      if (sector !== 'all' && a.applicant.sector !== sector) return false
      if (consent !== 'all' && !a.applicant.consents[consent as 'followup']) return false

      if (query.trim()) {
        const q = query.trim().toLowerCase()
        const haystack = [
          a.applicant.name,
          a.displayNo,
          a.applicant.type,
          a.applicant.sector,
          a.applicant.sido,
          a.applicant.sigungu,
          a.manager,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [apps, query, stage, klass, kind, sector, consent])

  const selectCls =
    'border border-line rounded-[7px] px-2.5 py-2 text-[13px] bg-surface focus:outline-none focus:border-accent'

  return (
    <>
      <Panel>
        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="기관명 · 접수번호 · 지역 검색"
            className="flex-1 min-w-[180px] border border-line rounded-[7px] px-3 py-2 text-[13px] focus:outline-none focus:border-accent"
          />
          <select value={stage} onChange={(e) => setStage(e.target.value)} className={selectCls}>
            <option value="all">전체 단계</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <select value={klass} onChange={(e) => setKlass(e.target.value)} className={selectCls}>
            <option value="all">전체 분류</option>
            {ALL_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={selectCls}>
            <option value="all">전체 구분</option>
            {KINDS.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </select>
          <select value={sector} onChange={(e) => setSector(e.target.value)} className={selectCls}>
            <option value="all">전체 분야</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select value={consent} onChange={(e) => setConsent(e.target.value)} className={selectCls}>
            {CONSENT_FILTERS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[12.5px] text-muted mt-3">
          {filtered.length}건
          {filtered.length !== apps.length && ` (전체 ${apps.length}건 중)`}
        </div>
      </Panel>

      {filtered.length === 0 ? (
        <Panel>
          <Empty>조건에 맞는 참여자가 없습니다.</Empty>
        </Panel>
      ) : (
        <Panel className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px] min-w-[720px]">
              <thead>
                <tr className="text-muted text-[12.5px] border-b border-line bg-[#faf9f6]">
                  <th className="text-left font-medium px-4 py-2.5">기관 · 개인</th>
                  <th className="text-left font-medium px-3 py-2.5">공모사업</th>
                  <th className="text-left font-medium px-3 py-2.5">단계</th>
                  <th className="text-left font-medium px-3 py-2.5">분류</th>
                  <th className="text-left font-medium px-3 py-2.5">담당</th>
                  <th className="text-left font-medium px-4 py-2.5">다음 접촉</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((a) => {
                  const call = calls.find((c) => c.id === a.callId)
                  return (
                    <tr key={a.id} className="hover:bg-[#faf9f6]">
                      <td className="px-4 py-3">
                        <Link href={`/applications/${a.id}`} className="hover:text-accent">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">{a.applicant.name}</span>
                            <KindTag kind={a.applicant.kind} />
                            {isSettlementPoor(a.settlement) && (
                              <span
                                className="text-[11px] px-1.5 py-[1px] rounded bg-[#faece7] text-[#993c1d]"
                                title="정산 3축 중 최하 등급이 있습니다"
                              >
                                정산부실
                              </span>
                            )}
                          </div>
                          <div className="text-[12px] text-faint mt-0.5">
                            {a.displayNo}
                            {a.applicant.sido && ` · ${a.applicant.sido} ${a.applicant.sigungu}`}
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-muted">{call?.title ?? '—'}</td>
                      <td className="px-3 py-3">{stageLabel(a.stage)}</td>
                      <td className="px-3 py-3">
                        <ClassBadge label={effectiveClass(a)} />
                      </td>
                      <td className="px-3 py-3 text-muted">{a.manager || '—'}</td>
                      <td className="px-4 py-3 text-muted">{a.nextContact || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </>
  )
}
