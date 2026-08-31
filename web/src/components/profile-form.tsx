'use client'

/**
 * 기관·개인 정보 입력 폼 (첫 로그인 & 내 정보 수정)
 *
 * 예전 프로토타입 폼과 달리 입력값이 서버(Server Action)로 가서 DB 에 저장됩니다.
 * 저장이 끝나면 원래 가려던 화면으로 돌아갑니다.
 */
import { useActionState, useState } from 'react'
import { saveProfile, type FormResult } from '@/lib/actions'
import type { Account } from '@/lib/types'
import { Panel } from '@/components/ui'
import { AGE_BANDS, KINDS, SCALE_BANDS, SECTORS, SIDO, typesFor } from '@/lib/taxonomy'

const CONSENTS = [
  { key: 'collect', label: '개인정보 수집·이용', required: true },
  { key: 'thirdParty', label: '제3자 제공', required: false },
  { key: 'research', label: '연구·정책개선 목적 활용', required: false },
  { key: 'followup', label: '후속지원 프로그램 안내 수신', required: false },
  { key: 'survey', label: '만족도·성과추적 조사 참여', required: false },
] as const

const initial: FormResult = { ok: true }

export function ProfileForm({ account, next }: { account: Account; next: string }) {
  const [state, action, pending] = useActionState(saveProfile, initial)
  const [kind, setKind] = useState<Account['kind']>(account.kind)
  const isIndividual = kind === 'individual'

  return (
    <form action={action}>
      <input type="hidden" name="next" value={next} />

      <Panel title="기본 정보">
        <div className="grid sm:grid-cols-2 gap-x-5">
          <label className="block mb-3.5">
            <span className="block text-[12.5px] text-muted mb-1.5">구분</span>
            <select
              name="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as Account['kind'])}
              className="w-full border border-line rounded-[7px] px-3 py-2 text-[13.5px] bg-surface focus:outline-none focus:border-accent"
            >
              {KINDS.map((k) => (
                <option key={k.key} value={k.key}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>

          {/* key={kind} 로 구분이 바뀌면 유형 목록을 새로 그립니다 */}
          <Select
            key={kind}
            label="세부 유형"
            name="type"
            defaultValue={account.type}
            options={typesFor(kind).map((t) => ({ value: t, label: t }))}
            placeholder="선택"
          />
          <Text
            label={isIndividual ? '성명' : '기관·기업명'}
            name="name"
            defaultValue={account.name}
          />
          <Select
            label="사업 분야"
            name="sector"
            defaultValue={account.sector}
            options={SECTORS.map((s) => ({ value: s, label: s }))}
            placeholder="선택"
          />
          <Text
            label={isIndividual ? '생년월일' : '설립일'}
            name="birthDate"
            type="date"
            defaultValue={account.birthDate}
          />
          <Text label="연락처" name="contact" defaultValue={account.contact} />
          <Text
            label={isIndividual ? '소속' : '대표자'}
            name="extra"
            defaultValue={isIndividual ? (account.affiliation ?? '') : (account.rep ?? '')}
          />
          <Select
            label="시도"
            name="sido"
            defaultValue={account.sido ?? ''}
            options={SIDO.map((s) => ({ value: s, label: s }))}
            placeholder="선택"
          />
          <Text label="시군구" name="sigungu" defaultValue={account.sigungu ?? ''} />
          <Select
            label={isIndividual ? '연령대' : '규모 (연 예산·매출)'}
            name="band"
            defaultValue={isIndividual ? (account.ageBand ?? '') : (account.scaleBand ?? '')}
            options={(isIndividual ? AGE_BANDS : SCALE_BANDS).map((b) => ({ value: b, label: b }))}
            placeholder="선택"
          />
        </div>
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

      <button
        type="submit"
        disabled={pending}
        className="bg-accent text-white rounded-[7px] px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? '저장 중…' : '저장하고 계속'}
      </button>
    </form>
  )
}

// ── 작은 입력 부품들 ──────────────────────────────────────────────

function Text({
  label,
  name,
  defaultValue,
  type = 'text',
}: {
  label: string
  name: string
  defaultValue?: string
  type?: string
}) {
  return (
    <label className="block mb-3.5">
      <span className="block text-[12.5px] text-muted mb-1.5">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        className="w-full border border-line rounded-[7px] px-3 py-2 text-[13.5px] focus:outline-none focus:border-accent"
      />
    </label>
  )
}

function Select({
  label,
  name,
  defaultValue,
  options,
  placeholder,
}: {
  label: string
  name: string
  defaultValue?: string
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <label className="block mb-3.5">
      <span className="block text-[12.5px] text-muted mb-1.5">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
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
