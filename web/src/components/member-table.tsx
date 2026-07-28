'use client'

/**
 * 참여자(회원) 정보 조회·관리
 *
 * 관리자가 하고 싶은 일 세 가지를 한 화면에서 처리합니다.
 *   1. 조건으로 골라내기 (사업별 / 분야별 / 구분별 / 동의별)
 *   2. 고른 사람들에게 메일 보내기 (체크박스로 선택)
 *   3. 엑셀로 내려받기
 *
 * 메일은 지금 서버가 없어서 두 가지 방법을 줍니다.
 *   - 메일 앱 열기: 컴퓨터에 설정된 메일 프로그램이 수신자가 채워진 채로 열립니다
 *   - 주소 복사: 웹 메일(지메일 등)에 붙여넣기
 * 나중에 서버를 붙이면 여기서 바로 발송하도록 바꾸면 됩니다.
 */
import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Account, Application, Call } from '@/lib/types'
import { Empty, Panel } from '@/components/ui'
import { KINDS, kindLabel, SECTORS } from '@/lib/taxonomy'
import { downloadCsv, today, toCsv } from '@/lib/csv'

const CONSENT_OPTIONS = [
  { value: 'all', label: '전체 (동의 무관)' },
  { value: 'followup', label: '후속지원 안내 동의자' },
  { value: 'survey', label: '조사참여 동의자' },
  { value: 'research', label: '연구활용 동의자' },
  { value: 'thirdParty', label: '제3자 제공 동의자' },
] as const

export function MemberTable({
  accounts,
  applications,
  calls,
}: {
  accounts: Account[]
  applications: Application[]
  calls: Call[]
}) {
  const [query, setQuery] = useState('')
  const [callId, setCallId] = useState('all')
  const [sector, setSector] = useState('all')
  const [kind, setKind] = useState('all')
  const [consent, setConsent] = useState('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  /** 회원별로 어떤 사업에 신청했는지 미리 계산해 둡니다 */
  const callsByAccount = useMemo(() => {
    const map = new Map<string, string[]>()
    applications.forEach((a) => {
      const list = map.get(a.accountId) ?? []
      if (!list.includes(a.callId)) list.push(a.callId)
      map.set(a.accountId, list)
    })
    return map
  }, [applications])

  const filtered = useMemo(() => {
    return accounts.filter((acc) => {
      if (kind !== 'all' && acc.kind !== kind) return false
      if (sector !== 'all' && acc.sector !== sector) return false
      if (consent !== 'all' && !acc.consents[consent as 'followup']) return false
      if (callId !== 'all' && !(callsByAccount.get(acc.id) ?? []).includes(callId)) return false

      if (query.trim()) {
        const q = query.trim().toLowerCase()
        const haystack = [acc.name, acc.email, acc.contact, acc.type, acc.sector, acc.sido]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [accounts, query, callId, sector, kind, consent, callsByAccount])

  /** 화면에 보이는 사람 전체가 선택돼 있는지 */
  const allShownSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id))

  function toggleAll() {
    const next = new Set(selected)
    if (allShownSelected) {
      filtered.forEach((a) => next.delete(a.id))
    } else {
      filtered.forEach((a) => next.add(a.id))
    }
    setSelected(next)
  }

  function toggleOne(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  /** 선택된 사람들의 이메일. 선택이 없으면 화면에 보이는 사람 전체 */
  const targets = selected.size > 0 ? accounts.filter((a) => selected.has(a.id)) : filtered
  const emails = targets.map((a) => a.email).filter(Boolean)

  function openMailApp() {
    // 수신자를 숨은참조(bcc)에 넣습니다.
    // 받는 사람끼리 서로의 주소를 보게 되면 개인정보 유출입니다.
    const bcc = encodeURIComponent(emails.join(','))
    window.location.href = `mailto:?bcc=${bcc}`
  }

  async function copyEmails() {
    await navigator.clipboard.writeText(emails.join(', '))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function exportCsv() {
    const headers = [
      '이름',
      '구분',
      '세부유형',
      '사업분야',
      '생년월일·설립일',
      '이메일',
      '연락처',
      '대표자',
      '소속',
      '지역',
      '연령대',
      '규모',
      '신청 사업',
      '가입일',
      '수집·이용',
      '제3자제공',
      '연구활용',
      '후속지원',
      '조사참여',
    ]
    const rows = targets.map((a) => [
      a.name,
      kindLabel(a.kind),
      a.type,
      a.sector,
      a.birthDate,
      a.email,
      a.contact,
      a.rep ?? '',
      a.affiliation ?? '',
      [a.sido, a.sigungu].filter(Boolean).join(' '),
      a.ageBand ?? '',
      a.scaleBand ?? '',
      (callsByAccount.get(a.id) ?? [])
        .map((id) => calls.find((c) => c.id === id)?.title ?? id)
        .join(' / '),
      a.createdAt,
      a.consents.collect ? 'Y' : 'N',
      a.consents.thirdParty ? 'Y' : 'N',
      a.consents.research ? 'Y' : 'N',
      a.consents.followup ? 'Y' : 'N',
      a.consents.survey ? 'Y' : 'N',
    ])
    downloadCsv(`참여자정보_${today()}`, toCsv(headers, rows))
  }

  const selectCls =
    'border border-line rounded-[7px] px-2.5 py-2 text-[13px] bg-surface focus:outline-none focus:border-accent'

  return (
    <>
      <Panel>
        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름 · 이메일 · 연락처 검색"
            className="flex-1 min-w-[180px] border border-line rounded-[7px] px-3 py-2 text-[13px] focus:outline-none focus:border-accent"
          />
          <select value={callId} onChange={(e) => setCallId(e.target.value)} className={selectCls}>
            <option value="all">전체 사업</option>
            {calls.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
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
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={selectCls}>
            <option value="all">전체 구분</option>
            {KINDS.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </select>
          <select value={consent} onChange={(e) => setConsent(e.target.value)} className={selectCls}>
            {CONSENT_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      {/* 선택하면 나타나는 실행 막대 */}
      <div className="bg-surface border border-line rounded-[10px] px-[22px] py-3.5 mb-3.5 flex flex-wrap items-center gap-2">
        <div className="text-[13px]">
          {selected.size > 0 ? (
            <>
              <strong className="text-accent">{selected.size}명</strong> 선택됨
              <button
                onClick={() => setSelected(new Set())}
                className="ml-2 text-[12.5px] text-faint hover:text-muted underline"
              >
                선택 해제
              </button>
            </>
          ) : (
            <span className="text-muted">
              조회 결과 <strong className="text-text">{filtered.length}명</strong>
              <span className="text-faint"> · 선택하지 않으면 조회 결과 전체가 대상입니다</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 ml-auto">
          <button
            onClick={openMailApp}
            disabled={emails.length === 0}
            className="bg-accent text-white rounded-[7px] px-3.5 py-2 text-[13px] font-medium hover:opacity-90 disabled:opacity-40"
          >
            메일 보내기 ({emails.length})
          </button>
          <button
            onClick={copyEmails}
            disabled={emails.length === 0}
            className="border border-line rounded-[7px] px-3.5 py-2 text-[13px] hover:border-line2 disabled:opacity-40"
          >
            {copied ? '복사됨 ✓' : '주소 복사'}
          </button>
          <button
            onClick={exportCsv}
            disabled={targets.length === 0}
            className="border border-line rounded-[7px] px-3.5 py-2 text-[13px] hover:border-line2 disabled:opacity-40"
          >
            엑셀 내려받기
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel>
          <Empty>조건에 맞는 참여자가 없습니다.</Empty>
        </Panel>
      ) : (
        <Panel className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px] min-w-[900px]">
              <thead>
                <tr className="text-muted text-[12.5px] border-b border-line bg-[#faf9f6]">
                  <th className="w-10 px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={allShownSelected}
                      onChange={toggleAll}
                      className="accent-[#1d7a5f] w-4 h-4 align-middle"
                      aria-label="전체 선택"
                    />
                  </th>
                  <th className="text-left font-medium py-2.5">이름</th>
                  <th className="text-left font-medium px-3 py-2.5">구분 · 유형</th>
                  <th className="text-left font-medium px-3 py-2.5">분야</th>
                  <th className="text-left font-medium px-3 py-2.5">생년월일 · 설립일</th>
                  <th className="text-left font-medium px-3 py-2.5">이메일</th>
                  <th className="text-left font-medium px-3 py-2.5">연락처</th>
                  <th className="text-left font-medium px-3 py-2.5">신청 사업</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((acc) => {
                  const myCalls = callsByAccount.get(acc.id) ?? []
                  const checked = selected.has(acc.id)
                  return (
                    <tr
                      key={acc.id}
                      className={checked ? 'bg-[#f3faf7]' : 'hover:bg-[#faf9f6]'}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(acc.id)}
                          className="accent-[#1d7a5f] w-4 h-4 align-middle"
                          aria-label={`${acc.name} 선택`}
                        />
                      </td>
                      <td className="py-3 font-medium">{acc.name}</td>
                      <td className="px-3 py-3">
                        <span className="text-[11.5px] px-1.5 py-[2px] rounded bg-[#f1efe8] text-muted mr-1.5">
                          {kindLabel(acc.kind)}
                        </span>
                        <span className="text-muted">{acc.type}</span>
                      </td>
                      <td className="px-3 py-3">{acc.sector || '—'}</td>
                      <td className="px-3 py-3 text-muted tabular-nums">{acc.birthDate}</td>
                      <td className="px-3 py-3 text-muted">{acc.email}</td>
                      <td className="px-3 py-3 text-muted tabular-nums">{acc.contact}</td>
                      <td className="px-3 py-3 text-muted">
                        {myCalls.length === 0
                          ? '—'
                          : myCalls
                              .map((id) => calls.find((c) => c.id === id)?.title ?? id)
                              .join(', ')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/members/${acc.id}`}
                          className="text-[12.5px] text-accent hover:underline whitespace-nowrap"
                        >
                          수정
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <p className="text-faint text-[12.5px] mt-3">
        ※ 메일 보내기는 수신자를 숨은참조(BCC)로 넣습니다. 받는 사람끼리 서로의 주소를 볼 수 없습니다.
      </p>
    </>
  )
}
