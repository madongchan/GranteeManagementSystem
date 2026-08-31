'use client'

/**
 * 공모사업 관리 (관리자)
 *
 * 목록은 서버(DB)에서 내려온 그대로 보여줍니다.
 * 등록·수정은 모달(CallForm), 삭제는 아래 버튼이 서버(Server Action)로 보냅니다.
 * 저장/삭제가 끝나면 목록을 새로 읽습니다(router.refresh).
 */
import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Application, Call } from '@/lib/types'
import { Panel } from '@/components/ui'
import { CallForm } from '@/components/call-form'
import { callImageSrc } from '@/lib/call-image'
import { kindLabel } from '@/lib/taxonomy'
import { deleteCall, type FormResult } from '@/lib/actions'

const initial: FormResult = { ok: false }

export function CallManager({
  calls,
  applications,
}: {
  calls: Call[]
  applications: Application[]
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<Call | 'new' | null>(null)
  const [delState, delAction] = useActionState(deleteCall, initial)

  useEffect(() => {
    if (delState.ok) router.refresh()
  }, [delState, router])

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

      {delState.error && (
        <div className="text-[13px] text-[#a32d2d] bg-[#faece7] rounded-[7px] px-3.5 py-2.5 mb-3.5">
          {delState.error}
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
                    <form
                      action={delAction}
                      onSubmit={(e) => {
                        if (!confirm('이 공모사업을 삭제할까요?')) e.preventDefault()
                      }}
                    >
                      <input type="hidden" name="id" value={call.id} />
                      <button
                        type="submit"
                        className="border border-line rounded-[7px] px-3.5 py-1.5 text-[13px] bg-surface text-muted hover:text-[#a32d2d] hover:border-[#e0bfb4]"
                      >
                        삭제
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </Panel>
          )
        })}
      </div>

      {editing && (
        <CallForm
          initial={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
