'use server'

/**
 * 화면에서 서버로 "저장"을 보내는 함수들 (Server Actions)
 *
 * 규칙:
 *   - 맨 먼저 로그인 여부·권한을 확인합니다 (이 함수들은 UI 없이도 POST 로 직접 불릴 수 있음)
 *   - 입력값을 검증하고, 통과하면 Prisma 로 DB 를 고칩니다
 *   - 실패는 throw 하지 않고 { ok:false, error } 로 돌려줘 화면이 메시지를 보여주게 합니다
 *   - 성공하면 revalidatePath 로 캐시를 비우고 필요하면 redirect 합니다
 */
import crypto from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getAccount } from '@/lib/data'
import type { Prisma } from '@/generated/prisma/client'
import type { Consents } from '@/lib/types'
import { KINDS, SECTORS } from '@/lib/taxonomy'
import { parseMoney } from '@/lib/domain/settlement'

export type FormResult = { ok: boolean; error?: string }

/** 우리 사이트 안의 경로만 통과시킵니다 (다른 사이트로 튕기는 것 방지) */
function safeInternalPath(raw: FormDataEntryValue | null): string {
  const s = typeof raw === 'string' ? raw : ''
  return s.startsWith('/') && !s.startsWith('//') ? s : '/'
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim()
const checked = (fd: FormData, key: string) => fd.get(key) === 'on'
const j = (v: unknown) => v as Prisma.InputJsonValue

/** Prisma 고유값 중복(P2002) 에러인지 */
function isUniqueError(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002'
}

/**
 * 첫 로그인 정보 입력 / 내 정보 수정.
 * 로그인한 사람은 자기 계정만 고칠 수 있습니다 (session.accountId 로 고정).
 */
export async function saveProfile(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: '로그인이 필요합니다.' }

  const kind = str(formData, 'kind')
  const name = str(formData, 'name')
  const type = str(formData, 'type')
  const extra = str(formData, 'extra') // 개인=소속 / 기관·기업=대표자
  const band = str(formData, 'band') // 개인=연령대 / 기관·기업=규모

  if (!KINDS.some((k) => k.key === kind)) return { ok: false, error: '구분을 선택해 주세요.' }
  if (!name) return { ok: false, error: '이름(기관·기업명)을 입력해 주세요.' }
  if (!type) return { ok: false, error: '세부 유형을 선택해 주세요.' }
  if (!checked(formData, 'collect')) {
    return { ok: false, error: '필수 항목인 개인정보 수집·이용에 동의해야 합니다.' }
  }

  const isIndividual = kind === 'individual'
  const consents: Consents = {
    collect: true,
    thirdParty: checked(formData, 'thirdParty'),
    research: checked(formData, 'research'),
    followup: checked(formData, 'followup'),
    survey: checked(formData, 'survey'),
    agreedAt: new Date().toISOString().slice(0, 10),
  }

  await prisma.account.update({
    where: { id: session.accountId },
    data: {
      kind,
      name,
      type,
      sector: str(formData, 'sector'),
      contact: str(formData, 'contact'),
      birthDate: str(formData, 'birthDate'),
      sido: str(formData, 'sido') || null,
      sigungu: str(formData, 'sigungu') || null,
      affiliation: isIndividual ? extra || null : null,
      rep: isIndividual ? null : extra || null,
      ageBand: isIndividual ? band || null : null,
      scaleBand: isIndividual ? null : band || null,
      consents: consents as unknown as Prisma.InputJsonValue,
    },
  })

  revalidatePath('/', 'layout')
  redirect(safeInternalPath(formData.get('next')))
}

// ---------------------------------------------------------------------
// 참여자: 신청서 제출
// ---------------------------------------------------------------------

/** 새 신청서의 빈 기본값 (types.ts 의 Application 모양) */
function blankApplicationFields() {
  return {
    docScore: null as number | null,
    interviewScore: null as number | null,
    reviewResult: '',
    reviewOpinion: '',
    mentoring: '',
    execRate: null as number | null,
    inspection: '',
    issue: '',
    reportStatus: 'none',
    reportRejectReason: '',
    reportSummary: '',
    performance: '',
    scores: j({ accounting: 0, execution: 0, outcome: 0, sustainability: 0, linkage: 0 }),
    classificationManual: null as string | null,
    followupSupport: '',
    followupLinkage: '',
    nextContact: '',
    manager: '',
    kpis: j([]),
    activities: j([]),
    settlement: j({
      status: 'none',
      items: [],
      evalSchedule: null,
      evalFaithfulness: null,
      evalCommunication: null,
      note: '',
    }),
    resultFiles: j([]),
  }
}

/**
 * 올해 접수번호의 다음 순번 (FND-2026-0001 …).
 * 개수가 아니라 "가장 큰 번호 + 1" 입니다 — 시드 데이터처럼 번호가 띄엄띄엄 있어도 안 겹칩니다.
 * 그래도 동시 제출로 겹치면 submitApplication 의 재시도 루프가 다음 번호로 넘어갑니다.
 */
async function nextDisplayNo(): Promise<string> {
  const prefix = `FND-${new Date().getFullYear()}-`
  const last = await prisma.application.findFirst({
    where: { displayNo: { startsWith: prefix } },
    orderBy: { displayNo: 'desc' },
    select: { displayNo: true },
  })
  const n = last ? Number.parseInt(last.displayNo.slice(prefix.length), 10) || 0 : 0
  return prefix + String(n + 1).padStart(4, '0')
}

export async function submitApplication(
  _prev: FormResult,
  formData: FormData,
): Promise<FormResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: '로그인이 필요합니다.' }

  const callId = str(formData, 'callId')
  const motive = str(formData, 'motive')

  const [account, call] = await Promise.all([
    getAccount(session.accountId),
    prisma.call.findUnique({ where: { id: callId } }),
  ])
  if (!account) return { ok: false, error: '회원 정보를 찾을 수 없습니다. 다시 로그인해 주세요.' }
  if (!call) return { ok: false, error: '존재하지 않는 공모사업입니다.' }
  if (call.status !== 'open') return { ok: false, error: '이미 마감된 공모사업입니다.' }
  if (!account.consents.collect || !account.type) {
    return { ok: false, error: '먼저 내 정보를 입력해 주세요.' }
  }
  if (!motive) return { ok: false, error: '신청 동기를 입력해 주세요.' }
  if (!checked(formData, 'collect')) {
    return { ok: false, error: '필수 항목인 개인정보 수집·이용에 동의해야 신청할 수 있습니다.' }
  }

  // 첨부는 파일 자체는 저장하지 않고 이름·크기만 기록합니다 (프로토타입)
  const attachments = formData
    .getAll('attachments')
    .filter((f): f is File => f instanceof File && f.name !== '')
    .map((f) => ({ name: f.name, size: f.size }))

  const today = new Date().toISOString().slice(0, 10)
  const { id: _omit, ...applicantSnapshot } = account
  const applicant = {
    ...applicantSnapshot,
    consents: {
      collect: true,
      thirdParty: checked(formData, 'thirdParty'),
      research: checked(formData, 'research'),
      followup: checked(formData, 'followup'),
      survey: checked(formData, 'survey'),
      agreedAt: today,
    },
  }

  const budget = parseMoney(str(formData, 'budget'))

  let createdId: string | null = null
  for (let attempt = 0; attempt < 5 && !createdId; attempt++) {
    try {
      const row = await prisma.application.create({
        data: {
          id: `APP-${crypto.randomUUID().slice(0, 8)}`,
          displayNo: await nextDisplayNo(),
          accountId: session.accountId,
          callId,
          applicant: j(applicant),
          stage: 'applied',
          status: 'received',
          createdAt: today,
          motive,
          requestedBudget: budget > 0 ? Math.round(budget) : null,
          attachments: j(attachments),
          ...blankApplicationFields(),
        },
      })
      createdId = row.id
    } catch (e) {
      if (!isUniqueError(e)) throw e // 접수번호 충돌이면 다시 시도
    }
  }
  if (!createdId) {
    return { ok: false, error: '접수 처리 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.' }
  }

  revalidatePath('/my')
  revalidatePath('/', 'layout')
  redirect(`/my/${createdId}`)
}

// ---------------------------------------------------------------------
// 관리자: 공모사업 등록 / 수정 / 삭제
// (관리자 사이트는 설계상 로그인이 없습니다 — 여기서 세션 검사를 하지 않습니다)
// ---------------------------------------------------------------------

const KIND_KEYS = new Set<string>(KINDS.map((k) => k.key))
const SECTOR_SET = new Set<string>(SECTORS)

export async function saveCall(_prev: FormResult, fd: FormData): Promise<FormResult> {
  const id = str(fd, 'id')
  const title = str(fd, 'title')
  const startDate = str(fd, 'startDate')
  const endDate = str(fd, 'endDate')
  const targets = fd.getAll('targets').map(String).filter((v) => KIND_KEYS.has(v))
  const sectors = fd.getAll('sectors').map(String).filter((v) => SECTOR_SET.has(v))
  const image = str(fd, 'image')

  if (!title) return { ok: false, error: '사업 제목을 입력해 주세요.' }
  if (startDate && endDate && endDate < startDate) {
    return { ok: false, error: '마감일이 시작일보다 빠릅니다.' }
  }
  if (targets.length === 0) return { ok: false, error: '지원 대상을 하나 이상 선택해 주세요.' }

  const data = {
    title,
    description: str(fd, 'description'),
    targets: j(targets),
    sectors: j(sectors),
    startDate,
    endDate,
    budget: str(fd, 'budget'),
    capacity: str(fd, 'capacity'),
    status: str(fd, 'status') === 'closed' ? 'closed' : 'open',
    image: image || null,
  }

  if (id) {
    await prisma.call.update({ where: { id }, data })
  } else {
    await prisma.call.create({ data: { id: `CALL-${crypto.randomUUID().slice(0, 8)}`, ...data } })
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function deleteCall(_prev: FormResult, fd: FormData): Promise<FormResult> {
  const id = str(fd, 'id')
  const linked = await prisma.application.count({ where: { callId: id } })
  if (linked > 0) {
    return {
      ok: false,
      error: `신청 ${linked}건이 연결되어 있어 삭제할 수 없습니다. 대신 '마감'으로 바꿔주세요.`,
    }
  }
  await prisma.call.delete({ where: { id } })
  revalidatePath('/', 'layout')
  return { ok: true }
}

// ---------------------------------------------------------------------
// 관리자: 회원 정보 수정 (특정 accountId 를 폼에서 받음)
// ---------------------------------------------------------------------

export async function saveMember(_prev: FormResult, fd: FormData): Promise<FormResult> {
  const id = str(fd, 'id')
  const acc = await prisma.account.findUnique({ where: { id } })
  if (!acc) return { ok: false, error: '회원을 찾을 수 없습니다.' }

  const kind = str(fd, 'kind')
  const name = str(fd, 'name')
  if (!KIND_KEYS.has(kind)) return { ok: false, error: '구분을 선택해 주세요.' }
  if (!name) return { ok: false, error: '이름(기관·기업명)을 입력해 주세요.' }

  const isIndividual = kind === 'individual'
  const extra = str(fd, 'extra')
  const band = str(fd, 'band')
  const prevConsents = (acc.consents ?? {}) as { agreedAt?: string }
  const collect = checked(fd, 'collect')
  const today = new Date().toISOString().slice(0, 10)
  const consents = {
    collect,
    thirdParty: checked(fd, 'thirdParty'),
    research: checked(fd, 'research'),
    followup: checked(fd, 'followup'),
    survey: checked(fd, 'survey'),
    agreedAt: prevConsents.agreedAt || (collect ? today : ''),
  }

  await prisma.account.update({
    where: { id },
    data: {
      kind,
      name,
      type: str(fd, 'type'),
      sector: str(fd, 'sector'),
      email: str(fd, 'email'),
      contact: str(fd, 'contact'),
      birthDate: str(fd, 'birthDate'),
      sido: str(fd, 'sido') || null,
      sigungu: str(fd, 'sigungu') || null,
      affiliation: isIndividual ? extra || null : null,
      rep: isIndividual ? null : extra || null,
      ageBand: isIndividual ? band || null : null,
      scaleBand: isIndividual ? null : band || null,
      consents: j(consents),
    },
  })

  revalidatePath('/', 'layout')
  return { ok: true }
}

// ---------------------------------------------------------------------
// 관리자: 참여자(신청서) 상세 편집 — 5단계의 값들을 한 번에 저장
// (kpis / activities / settlement.items 같은 목록 편집은 프로토타입에서는 생략)
// ---------------------------------------------------------------------

const STAGE_KEYS = new Set<string>(['applied', 'review', 'in_progress', 'closed', 'aftercare'])
const STATUS_KEYS = new Set<string>(['received', 'reviewing', 'selected', 'rejected'])
const REPORT_KEYS = new Set<string>(['none', 'submitted', 'approved', 'rejected'])
const SETTLE_KEYS = new Set<string>(['none', 'in_progress', 'done'])
const GRADE_KEYS = new Set<string>(['good', 'fair', 'poor'])

const oneOf = (v: string, allowed: Set<string>, fallback: string) => (allowed.has(v) ? v : fallback)

/** 빈 값이면 null, 숫자면 정수로 */
function intOrNull(fd: FormData, key: string): number | null {
  const s = str(fd, key)
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? Math.round(n) : null
}

const gradeOrNull = (fd: FormData, key: string) => {
  const s = str(fd, key)
  return GRADE_KEYS.has(s) ? s : null
}

export async function saveApplication(_prev: FormResult, fd: FormData): Promise<FormResult> {
  const id = str(fd, 'id')
  const app = await prisma.application.findUnique({ where: { id } })
  if (!app) return { ok: false, error: '신청서를 찾을 수 없습니다.' }

  const score = (k: string) => {
    const n = Number(fd.get(`score_${k}`))
    return n >= 0 && n <= 3 ? n : 0
  }
  const scores = {
    accounting: score('accounting'),
    execution: score('execution'),
    outcome: score('outcome'),
    sustainability: score('sustainability'),
    linkage: score('linkage'),
  }

  // 정산 목록(items)은 그대로 두고, 상태·평가·메모만 갱신
  const prevSettlement = (app.settlement ?? {}) as Record<string, unknown>
  const settlement = {
    ...prevSettlement,
    status: oneOf(str(fd, 'settlementStatus'), SETTLE_KEYS, 'none'),
    evalSchedule: gradeOrNull(fd, 'evalSchedule'),
    evalFaithfulness: gradeOrNull(fd, 'evalFaithfulness'),
    evalCommunication: gradeOrNull(fd, 'evalCommunication'),
    note: str(fd, 'settlementNote'),
  }

  const reviewResult = str(fd, 'reviewResult')

  await prisma.application.update({
    where: { id },
    data: {
      stage: oneOf(str(fd, 'stage'), STAGE_KEYS, app.stage),
      status: oneOf(str(fd, 'status'), STATUS_KEYS, app.status),
      docScore: intOrNull(fd, 'docScore'),
      interviewScore: intOrNull(fd, 'interviewScore'),
      reviewResult: ['선정', '미선정', '보류'].includes(reviewResult) ? reviewResult : '',
      reviewOpinion: str(fd, 'reviewOpinion'),
      mentoring: str(fd, 'mentoring'),
      execRate: intOrNull(fd, 'execRate'),
      inspection: str(fd, 'inspection'),
      issue: str(fd, 'issue'),
      reportStatus: oneOf(str(fd, 'reportStatus'), REPORT_KEYS, app.reportStatus),
      reportRejectReason: str(fd, 'reportRejectReason'),
      reportSummary: str(fd, 'reportSummary'),
      performance: str(fd, 'performance'),
      scores: j(scores),
      classificationManual: str(fd, 'classificationManual') || null,
      followupSupport: str(fd, 'followupSupport'),
      followupLinkage: str(fd, 'followupLinkage'),
      nextContact: str(fd, 'nextContact'),
      manager: str(fd, 'manager'),
      settlement: j(settlement),
    },
  })

  revalidatePath('/', 'layout')
  return { ok: true }
}
