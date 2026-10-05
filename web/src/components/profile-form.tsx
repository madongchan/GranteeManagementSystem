'use client'

/**
 * 기관·개인 정보 입력 폼 (첫 로그인 & 내 정보 수정)
 *
 * 입력값이 서버(Server Action)로 가서 DB 에 저장됩니다.
 * 기본 정보는 전부 필수이고, 형식이 틀리면 브라우저와 서버가 둘 다 막습니다.
 * 저장이 끝나면 next 로 받은 화면으로 이동합니다.
 */
import { useActionState, useState } from 'react'
import { saveProfile, withdrawAccount, type FormResult } from '@/lib/actions'
import type { Account } from '@/lib/types'
import { Panel } from '@/components/ui'
import { ConsentList } from '@/components/consent-list'
import {
  AGE_BANDS,
  KINDS,
  SCALE_BANDS,
  SECTORS,
  SIDO,
  SIGUNGU,
  typesFor,
} from '@/lib/taxonomy'
import { PHONE_RE, REG_NO_RE, regNoKindsFor } from '@/lib/profile'

const initial: FormResult = { ok: true }
const inputCls =
  'w-full border border-line rounded-[7px] px-3 py-2 text-[13.5px] bg-surface focus:outline-none focus:border-accent'

const opts = (list: readonly string[]) => list.map((v) => ({ value: v, label: v }))

export function ProfileForm({
  account,
  next,
  submitLabel = '저장하고 계속',
}: {
  account: Account
  next: string
  submitLabel?: string
}) {
  const [state, action, pending] = useActionState(saveProfile, initial)
  const [kind, setKind] = useState<Account['kind']>(account.kind)
  const [sido, setSido] = useState(account.sido ?? '')
  const isIndividual = kind === 'individual'

  return (
    <form action={action}>
      <input type="hidden" name="next" value={next} />

      <Panel title="기본 정보">
        <p className="text-[12.5px] text-muted mb-3.5">
          모든 항목을 입력해야 저장할 수 있습니다.
        </p>
        <div className="grid sm:grid-cols-2 gap-x-5">
          <Select
            label="구분"
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as Account['kind'])}
            options={KINDS.map((k) => ({ value: k.key, label: k.label }))}
          />

          {/* key={kind} 로 구분이 바뀌면 유형 목록을 새로 그립니다 */}
          <Select
            key={kind}
            label="세부 유형"
            name="type"
            defaultValue={account.type}
            options={opts(typesFor(kind))}
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
            options={opts(SECTORS)}
            placeholder="선택"
          />
          <Text
            label={isIndividual ? '생년월일' : '설립일'}
            name="birthDate"
            type="date"
            defaultValue={account.birthDate}
          />
          <Text label="이메일" name="email" type="email" defaultValue={account.email} />
          <Text
            label="연락처"
            name="contact"
            type="tel"
            defaultValue={account.contact}
            placeholder="010-1234-5678"
            pattern={PHONE_RE.source}
            title="010-1234-5678 형식으로 입력해 주세요"
          />
          <Text
            label={isIndividual ? '소속' : '대표자'}
            name="extra"
            defaultValue={isIndividual ? (account.affiliation ?? '') : (account.rep ?? '')}
          />

          {/* 기관·기업은 사업자등록번호나 고유번호 중 하나가 꼭 필요합니다 */}
          {!isIndividual && (
            <>
              <Select
                key={`regNoKind-${kind}`}
                label="등록번호 종류"
                name="regNoKind"
                defaultValue={account.regNoKind ?? regNoKindsFor(kind)[0]}
                options={opts(regNoKindsFor(kind))}
              />
              <Text
                label="사업자등록번호 / 고유번호"
                name="regNo"
                defaultValue={account.regNo ?? ''}
                placeholder="123-45-67890"
                inputMode="numeric"
                pattern={REG_NO_RE.source}
                title="숫자 10자리 (123-45-67890)"
              />
            </>
          )}

          <Select
            label="시도"
            name="sido"
            value={sido}
            onChange={(e) => setSido(e.target.value)}
            options={opts(SIDO)}
            placeholder="선택"
          />
          {/* 시도가 바뀌면 그 시도의 시군구 목록으로 새로 그립니다 */}
          <Select
            key={sido}
            label="시군구"
            name="sigungu"
            defaultValue={sido === account.sido ? (account.sigungu ?? '') : ''}
            options={opts(SIGUNGU[sido] ?? [])}
            placeholder={sido ? '선택' : '시도를 먼저 선택'}
          />
          <Select
            key={`band-${isIndividual}`}
            label={isIndividual ? '연령대' : '규모 (연 예산·매출)'}
            name="band"
            defaultValue={isIndividual ? (account.ageBand ?? '') : (account.scaleBand ?? '')}
            options={opts(isIndividual ? AGE_BANDS : SCALE_BANDS)}
            placeholder="선택"
          />
        </div>
      </Panel>

      <Panel title="개인정보 동의">
        <ConsentList consents={account.consents} />
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
        {pending ? '저장 중…' : submitLabel}
      </button>
    </form>
  )
}

/** 회원 탈퇴 버튼 — 한 번 더 물어본 뒤 진행합니다 */
export function WithdrawButton() {
  return (
    <form
      action={withdrawAccount}
      onSubmit={(e) => {
        if (!confirm('정말 탈퇴하시겠습니까?\n개인정보가 삭제되며 되돌릴 수 없습니다.')) {
          e.preventDefault()
        }
      }}
    >
      <button
        type="submit"
        className="border border-[#e0b4a8] text-[#a32d2d] rounded-[7px] px-4 py-2 text-[13.5px] bg-surface hover:bg-[#faece7]"
      >
        회원 탈퇴
      </button>
    </form>
  )
}

// ── 작은 입력 부품들 (기본값이 '필수') ─────────────────────────────

function Text({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block mb-3.5">
      <span className="block text-[12.5px] text-muted mb-1.5">{label}</span>
      <input type="text" required {...props} className={inputCls} />
    </label>
  )
}

function Select({
  label,
  options,
  placeholder,
  ...props
}: {
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block mb-3.5">
      <span className="block text-[12.5px] text-muted mb-1.5">{label}</span>
      <select required {...props} className={inputCls}>
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
