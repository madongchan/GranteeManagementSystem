'use client'

/**
 * 신청서 작성 폼
 *
 * 원본 프로토타입의 가장 큰 문제가 "입력값이 화면에만 있어서
 * 다시 그려지면 날아가는 것"이었습니다.
 * 여기서는 입력값을 React 상태(useState)가 들고 있으므로 그럴 일이 없습니다.
 */
import { useState } from 'react'
import Link from 'next/link'
import type { Account, Call } from '@/lib/types'
import { Panel } from '@/components/ui'
import { parseMoney, formatMoney } from '@/lib/domain/settlement'

const CONSENTS = [
  { key: 'collect', label: '개인정보 수집·이용', required: true },
  { key: 'thirdParty', label: '제3자 제공', required: false },
  { key: 'research', label: '연구·정책개선 목적 활용', required: false },
  { key: 'followup', label: '후속지원 프로그램 안내 수신', required: false },
  { key: 'survey', label: '만족도·성과추적 조사 참여', required: false },
] as const

export function ApplyForm({ call, account }: { call: Call; account: Account }) {
  const [motive, setMotive] = useState('')
  const [budget, setBudget] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const [consents, setConsents] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function submit() {
    if (!motive.trim()) {
      setError('신청 동기를 입력해 주세요.')
      return
    }
    if (!consents.collect) {
      setError('필수 항목인 개인정보 수집·이용에 동의해야 신청할 수 있습니다.')
      return
    }
    setError('')
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Panel>
        <div className="text-center py-8">
          <div className="text-[15.5px] font-semibold mb-2">신청이 접수되었습니다</div>
          <p className="text-muted text-[13.5px] mb-6">
            심사 일정은 개별 안내드립니다. 진행 상황은 &lsquo;내 신청 내역&rsquo;에서 확인하세요.
          </p>
          <div className="inline-flex gap-2">
            <Link
              href="/my"
              className="bg-accent text-white rounded-[7px] px-4 py-2.5 text-sm font-medium"
            >
              내 신청 내역으로
            </Link>
            <Link href="/" className="border border-line rounded-[7px] px-4 py-2.5 text-sm">
              공모사업 목록
            </Link>
          </div>
          <p className="text-faint text-[12.5px] mt-6">
            ※ 아직 저장 기능이 없어 실제로 기록되지는 않습니다 (화면 확인용)
          </p>
        </div>
      </Panel>
    )
  }

  return (
    <>
      {/* 가입할 때 넣은 정보는 자동으로 채워지고 여기서는 고칠 수 없습니다.
          신청 시점의 정보를 그대로 얼려두기 위해서입니다. */}
      <Panel title="신청 기관 정보">
        <p className="text-[12.5px] text-muted mb-3.5">
          회원 정보에서 자동으로 가져옵니다. 수정하려면 내 정보에서 먼저 바꿔주세요.
        </p>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-[13.5px]">
          <Row label={account.kind === 'individual' ? '성명' : '기관·기업명'} value={account.name} />
          <Row
            label={account.kind === 'individual' ? '소속' : '기관 유형'}
            value={account.kind === 'individual' ? account.affiliation : account.orgType}
          />
          <Row label="연락처" value={account.contact} />
          <Row label="지역" value={[account.sido, account.sigungu].filter(Boolean).join(' ')} />
        </dl>
      </Panel>

      <Panel title="신청 내용">
        <label className="block mb-4">
          <span className="block text-[12.5px] text-muted mb-1.5">
            신청 동기 · 욕구 <span className="text-[#a32d2d]">*</span>
          </span>
          <textarea
            value={motive}
            onChange={(e) => setMotive(e.target.value)}
            rows={5}
            placeholder="어떤 문제를 해결하고 싶은지, 왜 이 사업이 필요한지 적어주세요."
            className="w-full border border-line rounded-[7px] px-3 py-2.5 text-sm resize-y focus:outline-none focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="block text-[12.5px] text-muted mb-1.5">요청 예산 (원)</span>
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            inputMode="numeric"
            placeholder="예: 12,000,000"
            className="w-full border border-line rounded-[7px] px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
          />
          {budget && (
            <span className="block text-[12.5px] text-muted mt-1.5">
              {formatMoney(parseMoney(budget))} 원
            </span>
          )}
        </label>
      </Panel>

      <Panel title="첨부파일">
        <p className="text-[12.5px] text-muted mb-3">사업계획서, 예산안 등을 올려주세요.</p>
        <input
          type="file"
          multiple
          onChange={(e) => {
            const names = Array.from(e.target.files ?? []).map((f) => f.name)
            setFiles((prev) => [...prev, ...names])
            e.target.value = ''
          }}
          className="text-[13px] file:mr-3 file:border file:border-line file:rounded-md file:px-3 file:py-1.5 file:text-[13px] file:bg-surface file:cursor-pointer"
        />
        {files.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {files.map((name, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-[13px] border border-line rounded-md px-2.5 py-1.5"
              >
                <span className="flex-1">{name}</span>
                <button
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="text-faint hover:text-[#a32d2d] px-1"
                  aria-label="삭제"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="개인정보 동의">
        <div className="border border-line rounded-[7px] divide-y divide-line">
          {CONSENTS.map((c) => (
            <label key={c.key} className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consents[c.key] ?? false}
                onChange={(e) => setConsents((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                className="accent-[#1d7a5f] w-4 h-4"
              />
              <span className="text-[13.5px]">{c.label}</span>
              <span
                className={`text-[11.5px] ml-auto ${c.required ? 'text-[#a32d2d]' : 'text-faint'}`}
              >
                {c.required ? '필수' : '선택'}
              </span>
            </label>
          ))}
        </div>
      </Panel>

      {error && (
        <div className="text-[13px] text-[#a32d2d] bg-[#faece7] rounded-[7px] px-3.5 py-2.5 mb-3.5">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={submit}
          className="bg-accent text-white rounded-[7px] px-5 py-2.5 text-sm font-medium hover:opacity-90"
        >
          {call.title} 신청하기
        </button>
        <Link
          href="/"
          className="border border-line rounded-[7px] px-5 py-2.5 text-sm bg-surface hover:border-line2"
        >
          취소
        </Link>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted w-[76px] shrink-0">{label}</dt>
      <dd className={value ? '' : 'text-faint'}>{value || '—'}</dd>
    </div>
  )
}
