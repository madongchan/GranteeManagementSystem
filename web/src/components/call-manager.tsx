'use client'

/**
 * 공모사업 관리 (관리자)
 *
 * 등록·수정 폼을 띄우고, 목록에서 대표 이미지를 바로 바꿀 수도 있습니다.
 * 지금은 모두 화면 안에서만 유지되고, DB를 붙이면 서버로 보내면 됩니다.
 */
import { useState } from 'react'
import type { Application, Call } from '@/lib/types'
import { Panel } from '@/components/ui'
import { CallForm } from '@/components/call-form'
import { callImageSrc } from '@/lib/call-image'
import { kindLabel } from '@/lib/taxonomy'

const MAX_IMAGE = 5 * 1024 * 1024

export function CallManager({
  calls: initialCalls,
  applications,
}: {
  calls: Call[]
  applications: Application[]
}) {
  const [calls, setCalls] = useState<Call[]>(initialCalls)
  const [error, setError] = useState('')

  /** 폼 상태: null = 닫힘 / 'new' = 등록 / Call = 수정 */
  const [editing, setEditing] = useState<Call | 'new' | null>(null)

  function save(call: Call) {
    setCalls((prev) => {
      const exists = prev.some((c) => c.id === call.id)
      return exists ? prev.map((c) => (c.id === call.id ? call : c)) : [call, ...prev]
    })
    setEditing(null)
  }

  function remove(id: string) {
    // 신청이 들어온 공모는 지우면 그 신청서들이 갈 곳을 잃습니다.
    const count = applications.filter((a) => a.callId === id).length
    if (count > 0) {
      setError(`신청 ${count}건이 연결되어 있어 삭제할 수 없습니다. 대신 '마감'으로 바꿔주세요.`)
      return
    }
    if (!confirm('이 공모사업을 삭제할까요?')) return
    setCalls((prev) => prev.filter((c) => c.id !== id))
    setError('')
  }

  /** 목록에서 이미지만 빠르게 교체 */
  function pickImage(callId: string, file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있습니다.')
      return
    }
    if (file.size > MAX_IMAGE) {
      setError(`파일이 너무 큽니다. ${Math.round(MAX_IMAGE / 1024 / 1024)}MB 이하로 올려주세요.`)
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = () =>
      setCalls((prev) =>
        prev.map((c) => (c.id === callId ? { ...c, image: String(reader.result) } : c)),
      )
    reader.onerror = () => setError('이미지를 읽지 못했습니다. 다른 파일로 시도해 주세요.')
    reader.readAsDataURL(file)
  }

  return (
    <>
      <div className="mb-3.5">
        <button
          onClick={() => setEditing('new')}
          className="bg-accent text-white rounded-[7px] px-4 py-2.5 text-sm font-medium hover:bg-accent-dark transition-colors"
        >
          + 공모사업 등록
        </button>
      </div>

      {error && (
        <div className="text-[13px] text-[#a32d2d] bg-[#faece7] rounded-[7px] px-3.5 py-2.5 mb-3.5">
          {error}
        </div>
      )}

      <div className="space-y-3.5">
        {calls.map((call) => {
          const count = applications.filter((a) => a.callId === call.id).length
          const open = call.status === 'open'

          return (
            <Panel key={call.id} className="mb-0">
              <div className="flex flex-col sm:flex-row gap-5">
                {/* 대표 이미지 */}
                <div className="sm:w-[240px] shrink-0">
                  <div className="relative aspect-[4/3] rounded-[7px] overflow-hidden bg-[#f1efe8] border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={callImageSrc(call)}
                      alt={`${call.title} 대표 이미지`}
                      className="w-full h-full object-cover"
                    />
                    {!call.image && (
                      <span className="absolute bottom-2 left-2 text-[11px] px-1.5 py-[2px] rounded bg-black/45 text-white">
                        기본 이미지
                      </span>
                    )}
                  </div>

                  <label className="block mt-2">
                    <span className="block text-center border border-line rounded-[7px] py-1.5 text-[12.5px] cursor-pointer hover:border-line2 bg-surface">
                      이미지 {call.image ? '변경' : '올리기'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        pickImage(call.id, e.target.files?.[0])
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>

                {/* 사업 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2 mb-2">
                    <h3 className="text-[15.5px] font-semibold flex-1">{call.title}</h3>
                    <span
                      className={`text-[11.5px] px-2 py-[3px] rounded-md font-medium ${
                        open ? 'bg-accent-bg text-accent' : 'bg-[#f1efe8] text-faint'
                      }`}
                    >
                      {open ? '모집중' : '마감'}
                    </span>
                  </div>

                  <p className="text-[13.5px] text-muted mb-3">{call.description || '—'}</p>

                  {call.sectors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {call.sectors.map((s) => (
                        <span
                          key={s}
                          className="text-[11.5px] px-2 py-[3px] rounded-md bg-accent-bg text-accent"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] mb-4">
                    <span>
                      <span className="text-muted">기간</span> {call.startDate} ~ {call.endDate}
                    </span>
                    <span>
                      <span className="text-muted">규모</span> {call.budget || '—'}
                    </span>
                    <span>
                      <span className="text-muted">정원</span> {call.capacity || '—'}
                    </span>
                    <span>
                      <span className="text-muted">대상</span>{' '}
                      {call.targets.length ? call.targets.map((t) => kindLabel(t)).join(' · ') : '—'}
                    </span>
                    <span className="font-medium">신청 {count}건</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(call)}
                      className="border border-line rounded-[7px] px-3.5 py-1.5 text-[13px] bg-surface hover:border-line2"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => remove(call.id)}
                      className="border border-line rounded-[7px] px-3.5 py-1.5 text-[13px] bg-surface text-muted hover:text-[#a32d2d] hover:border-[#e0bfb4]"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </Panel>
          )
        })}
      </div>

      <p className="text-faint text-[12.5px] mt-3">
        ※ 등록·수정·이미지는 화면에만 반영됩니다. 새로고침하면 처음 상태로 돌아갑니다 (DB 연결 전).
      </p>

      {editing && (
        <CallForm
          initial={editing === 'new' ? undefined : editing}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
