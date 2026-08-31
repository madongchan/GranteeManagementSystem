'use client'

/**
 * 신청서 작성 폼
 *
 * 제출하면 서버(Server Action)로 가서 DB 에 저장되고, 곧바로 '내 신청 내역' 상세로 이동합니다.
 * 기관 정보는 회원 정보에서 자동으로 채워지며 여기서는 고칠 수 없습니다
 * (신청 시점의 정보를 그대로 얼려두기 위해서입니다).
 */
import { useActionState, useState } from 'react'
import Link from 'next/link'
import { submitApplication, type FormResult } from '@/lib/actions'
import type { Account, Call } from '@/lib/types'
import { Panel } from '@/components/ui'
import { formatMoney, parseMoney } from '@/lib/domain/settlement'

const CONSENTS = [
  { key: 'collect', label: '개인정보 수집·이용', required: true },
  { key: 'thirdParty', label: '제3자 제공', required: false },
  { key: 'research', label: '연구·정책개선 목적 활용', required: false },
  { key: 'followup', label: '후속지원 프로그램 안내 수신', required: false },
  { key: 'survey', label: '만족도·성과추적 조사 참여', required: false },
] as const

const initial: FormResult = { ok: true }

export function ApplyForm({ call, account }: { call: Call; account: Account }) {
  const [state, action, pending] = useActionState(submitApplication, initial)
  const [budget, setBudget] = useState('')

  return (
    <form action={action}>
      <input type="hidden" name="callId" value={call.id} />

      <Panel title="신청 기관 정보">
        <p className="text-[12.5px] text-muted mb-3.5">
          회원 정보에서 자동으로 가져옵니다. 수정하려면 내 정보에서 먼저 바꿔주세요.
        </p>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-[13.5px]">
          <Row label={account.kind === 'individual' ? '성명' : '기관·기업명'} value={account.name} />
          <Row label="세부 유형" value={account.type} />
          <Row label="사업 분야" value={account.sector} />
          <Row
            label={account.kind === 'individual' ? '소속' : '대표자'}
            value={account.kind === 'individual' ? account.affiliation : account.rep}
          />
          <Row label="이메일" value={account.email} />
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
            name="motive"
            rows={5}
            placeholder="어떤 문제를 해결하고 싶은지, 왜 이 사업이 필요한지 적어주세요."
            className="w-full border border-line rounded-[7px] px-3 py-2.5 text-sm resize-y focus:outline-none focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="block text-[12.5px] text-muted mb-1.5">요청 예산 (원)</span>
          <input
            name="budget"
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
        <p className="text-[12.5px] text-muted mb-3">
          사업계획서, 예산안 등을 올려주세요. (프로토타입에서는 파일 이름만 기록됩니다)
        </p>
        <input
          type="file"
          name="attachments"
          multiple
          className="text-[13px] file:mr-3 file:border file:border-line file:rounded-md file:px-3 file:py-1.5 file:text-[13px] file:bg-surface file:cursor-pointer"
        />
      </Panel>

      <Panel title="개인정보 동의">
        <div className="border border-line rounded-[7px] divide-y divide-line">
          {CONSENTS.map((c) => (
            <label key={c.key} className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                name={c.key}
                defaultChecked={account.consents[c.key] === true}
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

      {state.error && (
        <div className="text-[13px] text-[#a32d2d] bg-[#faece7] rounded-[7px] px-3.5 py-2.5 mb-3.5">
          {state.error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-accent text-white rounded-[7px] px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {pending ? '접수 중…' : `${call.title} 신청하기`}
        </button>
        <Link
          href="/"
          className="border border-line rounded-[7px] px-5 py-2.5 text-sm bg-surface hover:border-line2"
        >
          취소
        </Link>
      </div>
    </form>
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
