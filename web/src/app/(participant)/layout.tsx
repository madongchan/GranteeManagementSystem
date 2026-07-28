/**
 * 참여자 화면 껍데기
 *
 * 참여자가 할 일은 공모사업을 찾아 신청하는 것뿐이라
 * 메뉴는 두지 않고, 로그인 줄만 오른쪽 위에 얇게 뒀습니다.
 */
import { AuthBar } from '@/components/auth-bar'

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <AuthBar />
      <main className="flex-1">{children}</main>

      <footer className="border-t border-line mt-20">
        <div className="max-w-[1180px] mx-auto px-6 py-9 text-[12.5px] text-faint leading-relaxed">
          <p className="text-muted font-medium mb-1.5">함께일하는재단</p>
          <p>서울특별시 마포구 월드컵북로6길 36 (동교동 203-4)</p>
          <p>대표전화 02-338-0019 · 이메일 hamkke@hamkke.org</p>
        </div>
      </footer>
    </div>
  )
}
