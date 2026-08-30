// Prisma CLI 설정 (migrate/studio/db seed 등에서 씁니다).
// 앱이 실제로 DB에 붙는 코드는 여기가 아니라 src/lib/prisma.ts 입니다.
//
// 이 프로젝트는 AUTH_SECRET 등 다른 값도 .env.local 에 두는 관례라
// dotenv/config 기본값(.env만 읽음) 대신 .env → .env.local 순서로 직접 읽습니다.
// (.env.local 이 나중에 로드되어 있으면 그 값으로 덮어씁니다 — Next.js와 동일한 우선순위)
import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

config({ path: '.env' })
config({ path: '.env.local', override: true })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // CLI(migrate/db push/studio)는 항상 직접 연결을 씁니다.
    // 풀링(pgbouncer) 연결로 마이그레이션을 돌리면 advisory lock/DDL이 실패할 수 있습니다.
    //
    // prisma/config의 env()는 값이 아예 없으면 즉시 예외를 던져서, DIRECT_URL을
    // 아직 설정하지 않은 배포(예: 참여자 사이트는 DB를 안 씀)에서 `prisma generate`
    // 하나 때문에 npm install(postinstall) 전체가 죽어버립니다. generate는 실제
    // 접속이 필요 없으므로 process.env로 느슨하게 읽고, 진짜로 연결이 필요한
    // migrate/db push/db seed는 이 자리표시자로 접속을 시도하다 자연스럽게(그리고
    // 이해하기 쉬운 메시지로) 실패하게 둡니다.
    // DIRECT_URL을 안 만들었으면 Vercel Neon 연동이 자동으로 만드는
    // <prefix>_URL_UNPOOLED로 대신 접속한다 (직접 연결이라는 점은 동일).
    url:
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL_UNPOOLED ||
      'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
})
