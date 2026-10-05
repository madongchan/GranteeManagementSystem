'use client'

/**
 * 관리자 로그인 화면
 *
 * 로그인하지 않은 채 관리자 사이트의 어느 주소로 들어와도 검문소(proxy.ts)가 여기로 보냅니다.
 */
import { useActionState } from 'react'
import { adminLogin, type FormResult } from '@/lib/actions'

const initial: FormResult = { ok: true }
const inputCls =
  'w-full border border-line rounded-[7px] px-3 py-2.5 text-[13.5px] bg-surface focus:outline-none focus:border-accent'

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(adminLogin, initial)

  return (
    <div className="max-w-[380px] mx-auto py-20">
      <h1 className="text-[24px] font-semibold tracking-[-0.5px] text-center mb-8">
        관리자 로그인
      </h1>

      <form action={action} className="bg-surface border border-line rounded-[10px] px-7 py-8">
        <label className="block mb-3.5">
          <span className="block text-[12.5px] text-muted mb-1.5">아이디</span>
          <input name="id" required autoFocus autoComplete="username" className={inputCls} />
        </label>
        <label className="block mb-5">
          <span className="block text-[12.5px] text-muted mb-1.5">비밀번호</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputCls}
          />
        </label>

        {state.error && (
          <div className="text-[13px] text-[#a32d2d] bg-[#faece7] rounded-[7px] px-3.5 py-2.5 mb-3.5">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-accent text-white rounded-[7px] py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {pending ? '확인 중…' : '로그인'}
        </button>
      </form>
    </div>
  )
}
