/**
 * 회원 기본 정보 검증 규칙 — 화면(입력 칸)과 서버(저장)가 같은 규칙을 씁니다.
 */
import type { Account } from '@/lib/types'
import { SIGUNGU } from '@/lib/taxonomy'

/** 010-1234-5678, 02-338-0019 (하이픈은 없어도 됨) */
export const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/
/** 사업자등록번호·고유번호 모두 10자리 (123-45-67890) */
export const REG_NO_RE = /^\d{3}-?\d{2}-?\d{5}$/
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 기업(영리)은 사업자등록번호만, 기관·단체는 고유번호도 가능 */
export function regNoKindsFor(kind: Account['kind']): readonly string[] {
  if (kind === 'company') return ['사업자등록번호']
  if (kind === 'org') return ['사업자등록번호', '고유번호']
  return []
}

export const isValidSigungu = (sido?: string, sigungu?: string) =>
  Boolean(sido && sigungu && SIGUNGU[sido]?.includes(sigungu))

/** 신청하려면 기본 정보가 전부 채워져 있어야 합니다. */
export function isProfileComplete(a: Account): boolean {
  const isIndividual = a.kind === 'individual'
  return Boolean(
    a.consents?.collect &&
      a.type &&
      a.name &&
      a.sector &&
      a.birthDate &&
      EMAIL_RE.test(a.email) &&
      PHONE_RE.test(a.contact) &&
      isValidSigungu(a.sido, a.sigungu) &&
      (isIndividual ? a.affiliation && a.ageBand : a.rep && a.scaleBand) &&
      (isIndividual ||
        (regNoKindsFor(a.kind).includes(a.regNoKind ?? '') && REG_NO_RE.test(a.regNo ?? ''))),
  )
}
