'use client'

/**
 * 공모사업 등록·수정 폼
 *
 * 화면 위에 겹쳐 뜨는 창(모달)입니다.
 * 지금은 저장하면 화면에만 반영되고, DB를 붙이면 여기서 서버로 보내면 됩니다.
 */
import { useState } from 'react'
import type { Call } from '@/lib/types'
import { callImageSrc } from '@/lib/call-image'
import { KINDS, SECTORS } from '@/lib/taxonomy'

/** 대표 이미지 최대 크기 */
const MAX_IMAGE = 5 * 1024 * 1024

/** 새 공모의 기본값 */
function blankCall(): Call {
  const today = new Date().toISOString().slice(0, 10)
  return {
    id: `CALL-${Date.now().toString(36).toUpperCase()}`,
    title: '',
    description: '',
    targets: [],
    sectors: [],
    startDate: today,
    endDate: today,
    budget: '',
    capacity: '',
    status: 'open',
  }
}

export function CallForm({
  initial,
  onSave,
  onClose,
}: {
  /** 수정할 공모. 없으면 새로 등록 */
  initial?: Call
  onSave: (call: Call) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<Call>(initial ?? blankCall())
  const [error, setError] = useState('')

  function set<K extends keyof Call>(key: K, value: Call[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  function toggleIn<T extends string>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
  }

  function pickImage(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있습니다.')
      return
    }
    if (file.size > MAX_IMAGE) {
      setError(`파일이 너무 큽니다. ${Math.round(MAX_IMAGE / 1024 / 1024)}MB 이하로 올려주세요.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => set('image', String(reader.result))
    reader.onerror = () => setError('이미지를 읽지 못했습니다. 다른 파일로 시도해 주세요.')
    reader.readAsDataURL(file)
  }

  function submit() {
    if (!form.title.trim()) {
      setError('사업 제목을 입력해 주세요.')
      return
    }
    if (form.endDate < form.startDate) {
      setError('마감일이 시작일보다 빠릅니다.')
      return
    }
    if (form.targets.length === 0) {
      setError('지원 대상을 하나 이상 선택해 주세요.')
      return
    }
    onSave({ ...form, title: form.title.trim(), description: form.description.trim() })
  }

  const inputCls =
    'w-full border border-line rounded-[7px] px-3 py-2 text-[13.5px] bg-surface focus:outline-none focus:border-accent'

  return (
    <div
      className="fixed inset-0 z-50 bg-black/35 overflow-y-auto py-10 px-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-bg rounded-[10px] border border-line max-w-[720px] mx-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="call-form-title"
      >
        <header className="flex items-center gap-3 px-6 py-4 border-b border-line bg-surface rounded-t-[10px]">
          <h2 id="call-form-title" className="text-[16px] font-semibold flex-1">
            {initial ? '공모사업 수정' : '공모사업 등록'}
          </h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="text-faint hover:text-text text-lg leading-none px-1"
          >
            ×
          </button>
        </header>

        <div className="px-6 py-5">
          {/* 대표 이미지 */}
          <Field label="대표 이미지">
            <div className="flex gap-4">
              <div className="w-[200px] shrink-0 aspect-[4/3] rounded-[7px] overflow-hidden border border-line bg-[#f1efe8]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={callImageSrc(form)}
                  alt="대표 이미지 미리보기"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <label>
                  <span className="inline-block border border-line rounded-[7px] px-3 py-1.5 text-[12.5px] cursor-pointer hover:border-line2 bg-surface">
                    이미지 선택
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      pickImage(e.target.files?.[0])
                      e.target.value = ''
                    }}
                  />
                </label>
                {form.image && (
                  <button
                    onClick={() => set('image', undefined)}
                    className="ml-2 text-[12.5px] text-muted hover:text-[#a32d2d]"
                  >
                    되돌리기
                  </button>
                )}
                <p className="text-[11.5px] text-faint mt-2 leading-relaxed">
                  가로 1200px 이상 · 4:3 비율 권장
                  <br />
                  올리지 않으면 제목으로 만든 기본 이미지가 쓰입니다.
                </p>
              </div>
            </div>
          </Field>

          <Field label="사업 제목" required>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="예: 모두의공모 2026"
              className={inputCls}
            />
          </Field>

          <Field label="사업 소개">
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              placeholder="어떤 사업을 지원하는지 참여자가 이해할 수 있게 적어주세요."
              className={`${inputCls} resize-y`}
            />
          </Field>

          <Field label="지원 대상" required>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {KINDS.map((k) => (
                <Check
                  key={k.key}
                  label={k.label}
                  checked={form.targets.includes(k.key)}
                  onChange={() => set('targets', toggleIn(form.targets, k.key))}
                />
              ))}
            </div>
          </Field>

          <Field label="사업 분야">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {SECTORS.map((s) => (
                <Check
                  key={s}
                  label={s}
                  checked={form.sectors.includes(s)}
                  onChange={() => set('sectors', toggleIn(form.sectors, s))}
                />
              ))}
            </div>
          </Field>

          <div className="grid sm:grid-cols-2 gap-x-5">
            <Field label="신청 시작일">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="신청 마감일">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="지원 규모">
              <input
                value={form.budget}
                onChange={(e) => set('budget', e.target.value)}
                placeholder="예: 최대 1,200만원"
                className={inputCls}
              />
            </Field>
            <Field label="모집 정원">
              <input
                value={form.capacity}
                onChange={(e) => set('capacity', e.target.value)}
                placeholder="예: 20팀"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="모집 상태">
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as Call['status'])}
              className={`${inputCls} w-[180px]`}
            >
              <option value="open">모집중</option>
              <option value="closed">마감</option>
            </select>
          </Field>

          {error && (
            <div className="text-[13px] text-[#a32d2d] bg-[#faece7] rounded-[7px] px-3.5 py-2.5 mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={submit}
              className="bg-accent text-white rounded-[7px] px-5 py-2.5 text-sm font-medium hover:bg-accent-dark transition-colors"
            >
              {initial ? '수정 저장' : '등록'}
            </button>
            <button
              onClick={onClose}
              className="border border-line rounded-[7px] px-5 py-2.5 text-sm bg-surface hover:border-line2"
            >
              취소
            </button>
          </div>

          <p className="text-[12px] text-faint mt-4">
            ※ 화면에만 반영됩니다. 새로고침하면 사라집니다 (DB 연결 전).
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <div className="text-[12.5px] text-muted mb-1.5">
        {label}
        {required && <span className="text-[#a32d2d] ml-1">*</span>}
      </div>
      {children}
    </div>
  )
}

function Check({
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
        className={`text-[13.5px] ${checked ? 'text-accent font-medium' : 'text-text group-hover:text-accent'}`}
      >
        {label}
      </span>
    </label>
  )
}
