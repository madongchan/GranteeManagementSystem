/**
 * Prisma Client 싱글턴
 *
 * Vercel 서버리스 함수는 요청마다 새로 뜰 수 있어, 매번 new PrismaClient()를
 * 하면 Postgres 커넥션이 금방 바닥납니다(커넥션 고갈). 그래서
 *   1) 개발 중 핫리로드에도 client를 하나만 재사용하도록 globalThis에 캐시하고
 *   2) DATABASE_URL은 반드시 풀링(pgbouncer 등) 연결 문자열을 쓰고,
 *   3) 마이그레이션 전용 직접 연결은 DIRECT_URL(=prisma.config.ts)에 따로 둡니다.
 * 라는 Prisma 공식 가이드를 그대로 따랐습니다.
 *
 * Prisma 7부터 PrismaClient는 드라이버 어댑터가 필수라 @prisma/adapter-pg를 씁니다.
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
