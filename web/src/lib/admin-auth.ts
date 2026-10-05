/**
 * 관리자 로그인 (아이디·비밀번호)
 *
 * 로그인에 성공하면 서명된 값을 쿠키에 넣어두고, 검문소(proxy.ts)와
 * 관리자용 저장 함수들이 그 쿠키를 확인합니다.
 *
 * 아이디·비밀번호는 코드에 두지 않고 환경변수 ADMIN_ID / ADMIN_PASSWORD 에서 읽습니다.
 * 둘 중 하나라도 비어 있으면 아무도 로그인할 수 없습니다.
 * (값을 바꾸면 기존 로그인은 자동으로 풀립니다)
 */
import crypto from 'node:crypto'

export const ADMIN_COOKIE = 'admin_session'

const adminId = () => process.env.ADMIN_ID || ''
const adminPassword = () => process.env.ADMIN_PASSWORD || ''
const configured = () => Boolean(adminId() && adminPassword())

export function checkAdminLogin(id: string, password: string): boolean {
  return configured() && id === adminId() && password === adminPassword()
}

export function adminToken(): string {
  if (!configured()) return ''
  return crypto
    .createHmac('sha256', process.env.AUTH_SECRET || 'dev-only-insecure-secret-change-me')
    .update(`admin:${adminId()}:${adminPassword()}`)
    .digest('base64url')
}

export const isAdminToken = (value?: string) => Boolean(value) && value === adminToken()
