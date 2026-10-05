/**
 * 로그인한 사람 ↔ 우리 회원(Account) 연결
 *
 * 로그인(구글/카카오)이 끝나면 이 함수를 불러 "이 사람이 우리 DB의 누구인지"를 정합니다.
 *   1. 전에 이 소셜 계정으로 로그인한 적 있으면 (authKey 일치) → 그 회원
 *   2. 없으면 같은 이메일의 회원을 찾아 이번 로그인에 묶습니다 (시드/체험 계정 흡수)
 *   3. 그래도 없으면 뼈대만 있는 새 회원을 만듭니다
 *      → needsProfile=true 로 알려서, 첫 로그인 뒤 정보 입력 화면으로 보냅니다
 */
import crypto from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { toAccount } from '@/lib/data'
import { isProfileComplete } from '@/lib/profile'
import type { Prisma } from '@/generated/prisma/client'
import type { Consents } from '@/lib/types'

const emptyConsents = (): Consents => ({
  collect: false,
  thirdParty: false,
  research: false,
  followup: false,
  survey: false,
  agreedAt: '',
})

/** 기본 정보가 하나라도 비어 있으면 정보 입력 화면으로 보냅니다. */
const needsProfile = (row: Parameters<typeof toAccount>[0]) => !isProfileComplete(toAccount(row))

export async function resolveLoginAccount(params: {
  provider: 'google' | 'kakao'
  providerId: string
  name: string
  email: string
}): Promise<{ accountId: string; needsProfile: boolean }> {
  const authKey = `${params.provider}:${params.providerId}`

  const byKey = await prisma.account.findUnique({ where: { authKey } })
  if (byKey) return { accountId: byKey.id, needsProfile: needsProfile(byKey) }

  if (params.email) {
    const byEmail = await prisma.account.findFirst({
      where: { email: params.email, authKey: null },
    })
    if (byEmail) {
      const linked = await prisma.account.update({
        where: { id: byEmail.id },
        data: { authKey },
      })
      return { accountId: linked.id, needsProfile: needsProfile(linked) }
    }
  }

  const created = await prisma.account.create({
    data: {
      id: `ACC-${crypto.randomUUID().slice(0, 8)}`,
      kind: 'individual',
      name: params.name || '이름 없음',
      type: '',
      sector: '',
      email: params.email,
      contact: '',
      birthDate: '',
      consents: emptyConsents() as unknown as Prisma.InputJsonValue,
      createdAt: new Date().toISOString().slice(0, 10),
      authKey,
    },
  })
  return { accountId: created.id, needsProfile: true }
}
