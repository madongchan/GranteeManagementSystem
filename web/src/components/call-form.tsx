'use client'

/**
 * 공모사업 등록·수정 폼 (모달)
 *
 * 저장하면 서버(Server Action)로 가서 DB 에 저장되고, 목록이 새로고침되며 모달이 닫힙니다.
 * 대표 이미지는 브라우저에서 data URL(base64)로 바꿔 숨은 입력값으로 함께 보냅니다.
 */
import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Call } from '@/lib/types'
import { saveCall, type FormResult } from '@/lib/actions'
import { callImageSrc } from '@/lib/call-image'
import { KINDS, SECTORS } from '@/lib/taxonomy'

/** 대표 이미지 최대 크기 */
const MAX_IMAGE = 5 * 1024 * 1024
const initial: FormResult = { ok: false }

export function CallForm({ initial: call, onClose }: { initial?: Call; onClose: () => void }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(saveCall, initial)
  const [image, setImage] = useState<string | undefined>(call?.image)
  const [imageError, setImageError] = useState('')

  // 저장 성공하면 목록을 새로 읽고 모달을 닫습니다
  useEffect(() => {
    if (state.ok) {
      router.refresh()
      onClose()
    }
  }, [state, router, onClose])

  function pickImage(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setImageError('이미지 파일만 올릴 수 있습니다.')
      return
    }
    if (file.size > MAX_IMAGE) {
      setImageError(`파일이 너무 큽니다. ${Math.round(MAX_IMAGE / 1024 / 1024)}MB 이하로 올려주세요.`)
      return
    }
    setImageError('')
    const reader = new FileReader()
    reader.onload = () => setImage(String(reader.result))
    reader.onerror = () => setImageError('이미지를 읽지 못했습니다. 다른 파일로 시도해 주세요.')
    reader.readAsDataURL(file)
  }

  const inputCls =
    'w-full border border-line rounded-[7px] px-3 py-2 text-[13.5px] bg-surface focus:outline-none focus:border-accent'
  const previewCall = { ...(call ?? { title: '' }), image } as Call

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
            {call ? '공모사업 수정' : '공모사업 등록'}
          </h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="text-faint hover:text-text text-lg leading-none px-1"
          >
            ×
          </button>
        </header>

        <form action={action} className="px-6 py-5">
          <input type="hidden" name="id" value={call?.id ?? ''} />
          <input type="hidden" name="image" value={image ?? ''} />

          <Field label="대표 이미지">
            <div className="flex gap-4">
              <div className="w-[200px] shrink-0 aspect-[4/3] rounded-[7px] overflow-hidden border border-line bg-[#f1efe8]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={callImageSrc(previewCall)}
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
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage(undefined)}
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
                {imageError && (
                  <p className="text-[12px] text-[#a32d2d] mt-1.5">{imageError}</p>
                )}
              </div>
            </div>
          </Field>

          <Field label="사업 제목" required>
            <input
              name="title"
              defaultValue={call?.title}
              placeholder="예: 모두의공모 2026"
              className={inputCls}
            />
          </Field>

          <Field label="사업 소개">
            <textarea
              name="description"
              defaultValue={call?.description}
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
                  name="targets"
                  value={k.key}
                  label={k.label}
                  defaultChecked={call?.targets.includes(k.key) ?? false}
                />
              ))}
            </div>
          </Field>

          <Field label="사업 분야">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {SECTORS.map((s) => (
                <Check
                  key={s}
                  name="sectors"
                  value={s}
                  label={s}
                  defaultChecked={call?.sectors.includes(s) ?? false}
                />
              ))}
            </div>
          </Field>

          <div className="grid sm:grid-cols-2 gap-x-5">
            <Field label="신청 시작일">
              <input
                type="date"
                name="startDate"
                defaultValue={call?.startDate ?? new Date().toISOString().slice(0, 10)}
                className={inputCls}
              />
            </Field>
            <Field label="신청 마감일">
              <input
                type="date"
                name="endDate"
                defaultValue={call?.endDate ?? new Date().toISOString().slice(0, 10)}
                className={inputCls}
              />
            </Field>
            <Field label="지원 규모">
              <input
                name="budget"
                defaultValue={call?.budget}
                placeholder="예: 최대 1,200만원"
                className={inputCls}
              />
            </Field>
            <Field label="모집 정원">
              <input
                name="capacity"
                defaultValue={call?.capacity}
                placeholder="예: 20팀"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="모집 상태">
            <select
              name="status"
              defaultValue={call?.status ?? 'open'}
              className={`${inputCls} w-[180px]`}
            >
              <option value="open">모집중</option>
              <option value="closed">마감</option>
            </select>
          </Field>

          {state.error && (
            <div className="text-[13px] text-[#a32d2d] bg-[#faece7] rounded-[7px] px-3.5 py-2.5 mb-4">
              {state.error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="bg-accent text-white rounded-[7px] px-5 py-2.5 text-sm font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
            >
              {pending ? '저장 중…' : call ? '수정 저장' : '등록'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-line rounded-[7px] px-5 py-2.5 text-sm bg-surface hover:border-line2"
            >
              취소
            </button>
          </div>
        </form>
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
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string
  value: string
  label: string
  defaultChecked: boolean
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="w-4 h-4 accent-[#1d7a5f] cursor-pointer"
      />
      <span className="text-[13.5px] text-text group-hover:text-accent">{label}</span>
    </label>
  )
}
