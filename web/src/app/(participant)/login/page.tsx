/**
 * 로그인 화면
 *
 * 구글 키가 준비돼 있으면 구글 로그인 버튼만,
 * 아직 없으면 체험용 로그인을 함께 보여줍니다.
 */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession, isDemoLoginAllowed, isGoogleConfigured } from '@/lib/auth'
import { ACCOUNTS } from '@/lib/mock-data'
import { kindLabel } from '@/lib/taxonomy'

const ERROR_MESSAGE: Record<string, string> = {
  'not-configured': '구글 로그인이 아직 설정되지 않았습니다.',
  cancelled: '로그인을 취소했습니다.',
  state: '로그인 요청이 만료되었습니다. 다시 시도해 주세요.',
  failed: '로그인 중 문제가 생겼습니다. 다시 시도해 주세요.',
  'demo-disabled': '구글 로그인이 준비되어 체험용 로그인은 사용할 수 없습니다.',
  required: '로그인이 필요한 화면입니다.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  // 이미 로그인했으면 내 신청 내역으로
  if (await getSession()) redirect('/my')

  const { error } = await searchParams
  const configured = isGoogleConfigured()
  const demoAllowed = isDemoLoginAllowed()

  return (
    <div className="max-w-[420px] mx-auto px-6 py-24">
      <div className="text-center mb-9">
        <h1 className="text-[26px] font-semibold tracking-[-0.5px] mb-2">로그인</h1>
        <p className="text-muted text-sm">
          내 신청 내역을 보려면 로그인이 필요합니다.
        </p>
      </div>

      {error && (
        <div className="text-[13px] text-[#a32d2d] bg-[#faece7] rounded-[7px] px-3.5 py-2.5 mb-4 text-center">
          {ERROR_MESSAGE[error] ?? '로그인에 실패했습니다.'}
        </div>
      )}

      <div className="bg-surface border border-line rounded-[10px] px-7 py-8">
        {/* 구글 로그인 */}
        <a
          href="/api/auth/google"
          className={`flex items-center justify-center gap-2.5 w-full border border-line rounded-[7px] py-3 text-sm font-medium bg-white transition-colors ${
            configured ? 'hover:border-line2' : 'opacity-45 pointer-events-none'
          }`}
        >
          <GoogleMark />
          구글 계정으로 로그인
        </a>

        {!configured && (
          <p className="text-[12.5px] text-faint text-center mt-3 leading-relaxed">
            구글 로그인은 아직 준비 중입니다.
            <br />
            아래 체험용 로그인으로 화면을 둘러보실 수 있습니다.
          </p>
        )}

        {demoAllowed && (
          <>
            <div className="flex items-center gap-3 my-6">
              <span className="flex-1 h-px bg-line" />
              <span className="text-[12px] text-faint">체험용</span>
              <span className="flex-1 h-px bg-line" />
            </div>

            <form action="/api/auth/demo" method="post" className="space-y-2">
              <label className="block text-[12.5px] text-muted mb-1.5">
                어느 참여자로 볼지 고르세요
              </label>
              <select
                name="accountId"
                defaultValue={ACCOUNTS[0].id}
                className="w-full border border-line rounded-[7px] px-3 py-2.5 text-[13.5px] bg-surface focus:outline-none focus:border-accent"
              >
                {ACCOUNTS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({kindLabel(a.kind)})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full bg-accent text-white rounded-[7px] py-2.5 text-sm font-medium hover:bg-accent-dark transition-colors"
              >
                체험용으로 로그인
              </button>
            </form>
          </>
        )}
      </div>

      <p className="text-center mt-6">
        <Link href="/" className="text-[13px] text-muted hover:text-text">
          ← 공모사업 목록으로
        </Link>
      </p>
    </div>
  )
}

/** 구글 로고 */
function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h12.1c-.2 2-1.6 5-4.5 7l-.1.3 6.5 5 .5.1c4.1-3.8 6.6-9.4 6.6-15.7"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.4c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.800l-.3.1-6.7 5.2-.1.3C7.9 40.9 15.4 46 24 46"
      />
      <path
        fill="#FBBC05"
        d="M11.5 27.7c-.5-1.4-.7-2.9-.7-4.5s.3-3.1.7-4.5v-.3l-6.8-5.3-.2.1C2.9 16.3 2 20 2 23.2s.9 6.9 2.5 9.9z"
      />
      <path
        fill="#EA4335"
        d="M24 9.5c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.3 29.9 1 24 1 15.4 1 7.9 6.1 4.5 13.3l7 5.4C13.3 13.3 18.2 9.5 24 9.5"
      />
    </svg>
  )
}
