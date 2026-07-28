/**
 * 참여자 첫 화면 — 사업 공모
 *
 * 재단 실제 사이트(hamkke.org/business)와 같은 구성입니다.
 * 검색·필터·목록 동작은 call-search.tsx 에 있습니다.
 */
import { getCalls } from '@/lib/mock-data'
import { CallSearch } from '@/components/call-search'

export default function BusinessPage() {
  // 재단 사이트는 마감된 공고도 함께 보여주고 목록에서 상태로 구분합니다.
  return <CallSearch calls={getCalls()} />
}
