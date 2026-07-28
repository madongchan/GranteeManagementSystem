'use client'

/**
 * 공모사업 관리 — 대표 이미지 올리기 포함
 *
 * 이미지를 고르면 바로 미리보기가 뜹니다.
 * 지금은 브라우저 안에서만 보관하므로 새로고침하면 사라집니다.
 * DB(파일 저장소)를 붙이면 이 자리에서 업로드하고 주소를 받아오면 됩니다.
 */
import { useState } from 'react'
import type { Application, Call } from '@/lib/types'
import { Panel } from '@/components/ui'
import { callImageSrc } from '@/lib/call-image'
import { kindLabel } from '@/lib/taxonomy'

/** 대표 이미지 권장 크기 */
const RECOMMENDED = '가로 1200px 이상 · 16:9 비율 권장'
/** 너무 큰 파일은 막습니다 */
const MAX_SIZE = 5 * 1024 * 1024

export function CallManager({ calls, applications }: { calls: Call[]; applications: Application[] }) {
  // 올린 이미지를 공모 id 별로 기억합니다 (화면 안에서만)
  const [images, setImages] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  function pickImage(callId: string, file: File | undefined) {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있습니다.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError(`파일이 너무 큽니다. ${Math.round(MAX_SIZE / 1024 / 1024)}MB 이하로 올려주세요.`)
      return
    }

    setError('')
    // 파일을 화면에서 바로 볼 수 있는 임시 주소로 바꿉니다
    const reader = new FileReader()
    reader.onload = () => {
      setImages((prev) => ({ ...prev, [callId]: String(reader.result) }))
    }
    reader.onerror = () => setError('이미지를 읽지 못했습니다. 다른 파일로 시도해 주세요.')
    reader.readAsDataURL(file)
  }

  function removeImage(callId: string) {
    setImages((prev) => {
      const next = { ...prev }
      delete next[callId]
      return next
    })
  }

  return (
    <>
      <div className="mb-3.5">
        <button className="bg-accent text-white rounded-[7px] px-4 py-2.5 text-sm font-medium hover:opacity-90">
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
          const uploaded = images[call.id]
          const src = uploaded ?? callImageSrc(call)

          return (
            <Panel key={call.id} className="mb-0">
              <div className="flex flex-col sm:flex-row gap-5">
                {/* 대표 이미지 */}
                <div className="sm:w-[260px] shrink-0">
                  <div className="relative aspect-[16/9] rounded-[7px] overflow-hidden bg-[#f1efe8] border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${call.title} 대표 이미지`}
                      className="w-full h-full object-cover"
                    />
                    {!uploaded && !call.image && (
                      <span className="absolute bottom-2 left-2 text-[11px] px-1.5 py-[2px] rounded bg-black/45 text-white">
                        기본 이미지
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <label className="flex-1">
                      <span className="block text-center border border-line rounded-[7px] py-1.5 text-[12.5px] cursor-pointer hover:border-line2 bg-surface">
                        {uploaded ? '이미지 변경' : '이미지 올리기'}
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
                    {uploaded && (
                      <button
                        onClick={() => removeImage(call.id)}
                        className="border border-line rounded-[7px] px-2.5 py-1.5 text-[12.5px] text-muted hover:text-[#a32d2d] hover:border-[#e0bfb4]"
                      >
                        되돌리기
                      </button>
                    )}
                  </div>
                  <p className="text-[11.5px] text-faint mt-1.5">{RECOMMENDED}</p>
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

                  <p className="text-[13.5px] text-muted mb-3">{call.description}</p>

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

                  <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[13px]">
                    <span>
                      <span className="text-muted">기간</span> {call.startDate} ~ {call.endDate}
                    </span>
                    <span>
                      <span className="text-muted">규모</span> {call.budget}
                    </span>
                    <span>
                      <span className="text-muted">정원</span> {call.capacity}
                    </span>
                    <span>
                      <span className="text-muted">대상</span>{' '}
                      {call.targets.map((t) => kindLabel(t)).join(' · ')}
                    </span>
                    <span className="font-medium">신청 {count}건</span>
                  </div>
                </div>
              </div>
            </Panel>
          )
        })}
      </div>

      <p className="text-faint text-[12.5px] mt-3">
        ※ 올린 이미지는 화면에만 반영됩니다. 새로고침하면 기본 이미지로 돌아갑니다 (파일 저장소 연결 전).
      </p>
    </>
  )
}
