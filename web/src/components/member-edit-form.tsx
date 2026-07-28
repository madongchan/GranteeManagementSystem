'use client'

/**
 * 참여자 정보 수정 (관리자용)
 *
 * 저장 버튼을 누르면 지금은 화면에만 반영됩니다.
 * DB를 붙이면 이 자리에서 서버로 보내면 됩니다.
 */
import { useState } from 'react'
import Link from 'next/link'
import type { Account } from '@/lib/types'
import { Panel } from '@/components/ui'
import { AGE_BANDS, KINDS, SCALE_BANDS, SECTORS, SIDO, typesFor } from '@/lib/taxonomy'

const CONSENT_ITEMS = [
  { key: 'collect', label: '개인정보 수집·이용', required: true },
  { key: 'thirdParty', label: '제3자 제공', required: false },
  { key: 'research', label: '연구·정책개선 활용', required: false },
  { key: 'followup', label: '후속지원 안내 수신', required: false },
  { key: 'survey', label: '조사 참여', required: false },
] as const

export function MemberEditForm({ account }: { account: Account }) {
  const [form, setForm] = useState<Account>(account)
  const [saved, setSaved] = useState(false)

  function set<K extends keyof Account>(key: K, value: Account[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const isIndividual = form.kind === 'individual'

  return (
    <>
      <Panel title="기본 정보">
        <div className="grid sm:grid-cols-2 gap-x-5">
          <Select
            label="구분"
            value={form.kind}
            onChange={(v) => {
              // 구분을 바꾸면 세부 유형 목록이 달라지므로 유형을 비웁니다
              setForm((prev) => ({ ...prev, kind: v as Account['kind'], type: '' }))
              setSaved(false)
            }}
            options={KINDS.map((k) => ({ value: k.key, label: k.label }))}
          />
          <Select
            label="세부 유형"
            value={form.type}
            onChange={(v) => set('type', v)}
            options={typesFor(form.kind).map((t) => ({ value: t, label: t }))}
            placeholder="선택"
          />
          <Text
            label={isIndividual ? '성명' : '기관·기업명'}
            value={form.name}
            onChange={(v) => set('name', v)}
          />
          <Select
            label="사업 분야"
            value={form.sector}
            onChange={(v) => set('sector', v as Account['sector'])}
            options={SECTORS.map((s) => ({ value: s, label: s }))}
            placeholder="선택"
          />
          <Text
            label={isIndividual ? '생년월일' : '설립일'}
            value={form.birthDate}
            onChange={(v) => set('birthDate', v)}
            type="date"
          />
          <Text label="이메일" value={form.email} onChange={(v) => set('email', v)} type="email" />
          <Text label="연락처" value={form.contact} onChange={(v) => set('contact', v)} />
          {isIndividual ? (
            <Text
              label="소속"
              value={form.affiliation ?? ''}
              onChange={(v) => set('affiliation', v)}
            />
          ) : (
            <Text label="대표자" value={form.rep ?? ''} onChange={(v) => set('rep', v)} />
          )}
          <Select
            label="시도"
            value={form.sido ?? ''}
            onChange={(v) => set('sido', v)}
            options={SIDO.map((s) => ({ value: s, label: s }))}
            placeholder="선택"
          />
          <Text
            label="시군구"
            value={form.sigungu ?? ''}
            onChange={(v) => set('sigungu', v)}
          />
          {isIndividual ? (
            <Select
              label="연령대"
              value={form.ageBand ?? ''}
              onChange={(v) => set('ageBand', v)}
              options={AGE_BANDS.map((a) => ({ value: a, label: a }))}
              placeholder="선택"
            />
          ) : (
            <Select
              label="규모 (연 예산·매출)"
              value={form.scaleBand ?? ''}
              onChange={(v) => set('scaleBand', v)}
              options={SCALE_BANDS.map((s) => ({ value: s, label: s }))}
              placeholder="선택"
            />
          )}
        </div>
      </Panel>

      <Panel title="개인정보 동의">
        <p className="text-[12.5px] text-muted mb-3">
          동의일 {form.consents.agreedAt} · 관리자가 임의로 켜는 것은 권장하지 않습니다. 참여자가
          직접 철회를 요청한 경우에만 끄세요.
        </p>
        <div className="border border-line rounded-[7px] divide-y divide-line">
          {CONSENT_ITEMS.map((c) => (
            <label key={c.key} className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.consents[c.key]}
                disabled={c.required}
                onChange={(e) => {
                  set('consents', { ...form.consents, [c.key]: e.target.checked })
                }}
                className="accent-[#1d7a5f] w-4 h-4 disabled:opacity-50"
              />
              <span className="text-[13.5px]">{c.label}</span>
              <span
                className={`text-[11.5px] ml-auto ${c.required ? 'text-faint' : 'text-faint'}`}
              >
                {c.required ? '필수 (해제 불가)' : '선택'}
              </span>
            </label>
          ))}
        </div>
      </Panel>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setSaved(true)}
          className="bg-accent text-white rounded-[7px] px-5 py-2.5 text-sm font-medium hover:opacity-90"
        >
          저장
        </button>
        <Link
          href="/members"
          className="border border-line rounded-[7px] px-5 py-2.5 text-sm bg-surface hover:border-line2"
        >
          취소
        </Link>
        {saved && (
          <span className="text-[13px] text-accent">
            저장했습니다 (화면에만 반영 — DB 연결 전)
          </span>
        )}
      </div>
    </>
  )
}

// ── 작은 입력 부품들 ──────────────────────────────────────────────

function Text({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="block mb-3.5">
      <span className="block text-[12.5px] text-muted mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-line rounded-[7px] px-3 py-2 text-[13.5px] focus:outline-none focus:border-accent"
      />
    </label>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <label className="block mb-3.5">
      <span className="block text-[12.5px] text-muted mb-1.5">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-line rounded-[7px] px-3 py-2 text-[13.5px] bg-surface focus:outline-none focus:border-accent"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
