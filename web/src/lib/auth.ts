/**
 * 로그인 (구글)
 *
 * 라이브러리 없이 직접 만들었습니다. 줄 수가 많지 않고, 무슨 일이 일어나는지
 * 눈으로 따라갈 수 있는 편이 나중에 고치기 쉽기 때문입니다.
 *
 * 흐름은 게임의 플랫폼 로그인과 같습니다.
 *   1. 우리 서버가 구글로 보낸다        → /api/auth/google
 *   2. 사용자가 구글에서 로그인한다
 *   3. 구글이 "인증 코드"를 들고 돌아온다 → /api/auth/callback/google
 *   4. 그 코드를 구글에 주고 사용자 정보를 받는다
 *   5. 받은 정보를 쿠키에 담아둔다 (= 세션)
 *
 * 쿠키는 위조를 막기 위해 서명해서 넣습니다.
 * 서명이 없으면 사용자가 브라우저에서 쿠키 내용을 고쳐 남의 계정이 될 수 있습니다.
 *
 * ⚠️ 이건 프로토타입 수준입니다. 실서비스로 갈 때는 DB의 사용자 표와 연결하고
 *    세션 만료·갱신을 제대로 다뤄야 합니다.
 */
import crypto from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7일

/** 로그인한 사람의 정보 */
export interface Session {
  /** 구글 계정 고유 번호 (데모 로그인은 'demo') */
  sub: string
  name: string
  email: string
  picture?: string
  /** 우리 시스템의 회원 id — 지금은 가짜 데이터의 계정에 연결합니다 */
  accountId: string
}

// ---------------------------------------------------------------------
// 설정값
// ---------------------------------------------------------------------

/** 구글에서 발급받은 키가 준비돼 있는지 */
export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

/**
 * 체험용 로그인을 쓸 수 있는지.
 *
 * - 구글 키가 없으면: 시연이 막히면 안 되므로 자동으로 켜집니다
 * - 구글 키가 있으면: ALLOW_DEMO_LOGIN=true 를 넣어야만 켜집니다
 *
 * 실서비스로 넘어갈 때는 ALLOW_DEMO_LOGIN 을 지우세요.
 * 남겨두면 아무나 다른 참여자 계정으로 들어갈 수 있습니다.
 */
export function isDemoLoginAllowed(): boolean {
  if (!isGoogleConfigured()) return true
  return process.env.ALLOW_DEMO_LOGIN === 'true'
}

/** 쿠키 서명에 쓸 비밀키 */
function secret(): string {
  return process.env.AUTH_SECRET || 'dev-only-insecure-secret-change-me'
}

/** 구글이 돌아올 주소 */
export function callbackUrl(origin: string): string {
  return `${origin}/api/auth/callback/google`
}

// ---------------------------------------------------------------------
// 쿠키 서명
// ---------------------------------------------------------------------

function sign(value: string): string {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url')
}

function encode(session: Session): string {
  const body = Buffer.from(JSON.stringify(session)).toString('base64url')
  return `${body}.${sign(body)}`
}

function decode(raw: string): Session | null {
  const [body, signature] = raw.split('.')
  if (!body || !signature) return null

  // 서명이 맞는지 확인합니다. 길이가 다르면 timingSafeEqual 이 예외를 던지므로 먼저 걸러냅니다.
  const expected = sign(body)
  if (expected.length !== signature.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null

  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString()) as Session
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------
// 세션 읽기 / 쓰기
// ---------------------------------------------------------------------

/** 지금 로그인한 사람. 로그인 안 했으면 null */
export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const raw = store.get(COOKIE_NAME)?.value
  return raw ? decode(raw) : null
}

export async function setSession(session: Session): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, encode(session), {
    httpOnly: true, // 자바스크립트로 못 읽게 (탈취 방지)
    sameSite: 'lax', // 다른 사이트에서 요청할 때 안 딸려가게
    secure: process.env.NODE_ENV === 'production', // 실서비스에선 https 에서만
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function clearSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

// ---------------------------------------------------------------------
// 구글로 보내는 주소 만들기
// ---------------------------------------------------------------------

/**
 * state = 위조 요청을 막는 임시 값.
 * 구글로 보낼 때 만들어 쿠키에 넣어두고, 돌아왔을 때 같은 값인지 확인합니다.
 * 다르면 남이 대신 보낸 요청이므로 거절합니다.
 */
export function createState(): string {
  return crypto.randomBytes(16).toString('hex')
}

export function googleAuthUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: callbackUrl(origin),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

/** 구글이 준 코드를 사용자 정보로 바꿉니다 */
export async function exchangeCode(
  code: string,
  origin: string,
): Promise<{ sub: string; name: string; email: string; picture?: string }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: callbackUrl(origin),
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    throw new Error(`구글 토큰 교환 실패 (${res.status})`)
  }

  const data = (await res.json()) as { id_token?: string }
  if (!data.id_token) throw new Error('구글 응답에 id_token 이 없습니다')

  // id_token 은 점으로 나뉜 세 덩어리(JWT)이고, 가운데가 사용자 정보입니다.
  // 구글에서 직접(https) 받아온 값이라 여기서 서명 검증은 생략합니다.
  const payload = JSON.parse(
    Buffer.from(data.id_token.split('.')[1], 'base64url').toString(),
  ) as { sub: string; name?: string; email?: string; picture?: string }

  return {
    sub: payload.sub,
    name: payload.name ?? '이름 없음',
    email: payload.email ?? '',
    picture: payload.picture,
  }
}
