// 진단용 — .env.local의 DB 연결 주소가 왜 깨졌는지 확인합니다.
// 비밀번호나 전체 주소는 절대 출력하지 않고, 형태만 확인합니다.
// 사용법: node --env-file=.env.local scripts/check-db-url.mjs

const keys = [
  'DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
  'DATABASE_POSTGRES_URL',
  'DATABASE_POSTGRES_URL_NON_POOLING',
  'DIRECT_URL',
]

for (const key of keys) {
  const v = process.env[key]
  if (!v) {
    console.log(`${key}: (없음)`)
    continue
  }
  let parseOk = false
  let protocol = ''
  let hostLen = 0
  try {
    const u = new URL(v)
    parseOk = true
    protocol = u.protocol
    hostLen = u.hostname.length
  } catch {
    parseOk = false
  }
  console.log(
    `${key}: 길이=${v.length} 시작=${v.slice(0, 12)}... URL파싱=${parseOk} 프로토콜=${protocol} 호스트길이=${hostLen} 줄바꿈포함=${/[\r\n]/.test(v)} #포함=${v.includes('#')}`,
  )
}
