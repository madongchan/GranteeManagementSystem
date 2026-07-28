/**
 * 참여자 첫 화면 — 사업 공모
 *
 * 목록과 검색은 로그인 없이도 볼 수 있습니다.
 * 지원(신청)만 로그인이 필요하고, 로그인 여부를 아래로 넘겨
 * 안 한 사람에게는 안내창을 띄웁니다.
 */
import { getSession } from '@/lib/auth'
import { getCalls } from '@/lib/mock-data'
import { CallSearch } from '@/components/call-search'

export default async function BusinessPage() {
  const session = await getSession()

  // 재단 사이트처럼 마감된 공고도 함께 보여주고 목록에서 상태로 구분합니다.
  return <CallSearch calls={getCalls()} isLoggedIn={Boolean(session)} />
}
