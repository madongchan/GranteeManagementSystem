/**
 * 화면이 쓰는 조회 함수 — 이제 진짜 DB(Prisma)에서 읽어옵니다.
 *
 * 예전 mock-data.ts 안에 있던 같은 이름의 함수들을 그대로 옮긴 것이고,
 * 딱 하나 달라진 점은 "비동기(async)"라는 것입니다 — 부르는 쪽에서 `await` 를 붙입니다.
 * 반환되는 객체 모양은 예전과 똑같으므로 화면·도메인 계산 코드는 손대지 않습니다.
 *
 * 중첩 값(Json 컬럼)은 Prisma가 느슨한 타입으로 돌려주므로 원래 타입으로 되돌립니다.
 * (값 자체는 이미 그 모양으로 저장돼 있습니다 — schema.prisma 주석 참고)
 */
import { prisma } from '@/lib/prisma'
import type { Account, Application, Call } from '@/lib/types'

const j = <T>(v: unknown): T => v as T

type CallRow = Awaited<ReturnType<typeof prisma.call.findMany>>[number]
type AccountRow = Awaited<ReturnType<typeof prisma.account.findMany>>[number]
type ApplicationRow = Awaited<ReturnType<typeof prisma.application.findMany>>[number]

function toCall(r: CallRow): Call {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    targets: j<Call['targets']>(r.targets),
    sectors: j<Call['sectors']>(r.sectors),
    startDate: r.startDate,
    endDate: r.endDate,
    budget: r.budget,
    capacity: r.capacity,
    status: r.status as Call['status'],
    image: r.image ?? undefined,
  }
}

function toAccount(r: AccountRow): Account {
  return {
    id: r.id,
    kind: r.kind as Account['kind'],
    name: r.name,
    type: r.type,
    sector: r.sector as Account['sector'],
    email: r.email,
    contact: r.contact,
    birthDate: r.birthDate,
    rep: r.rep ?? undefined,
    affiliation: r.affiliation ?? undefined,
    sido: r.sido ?? undefined,
    sigungu: r.sigungu ?? undefined,
    ageBand: r.ageBand ?? undefined,
    scaleBand: r.scaleBand ?? undefined,
    consents: j<Account['consents']>(r.consents),
    createdAt: r.createdAt,
  }
}

function toApplication(r: ApplicationRow): Application {
  return {
    id: r.id,
    displayNo: r.displayNo,
    accountId: r.accountId,
    callId: r.callId,
    applicant: j<Application['applicant']>(r.applicant),
    stage: r.stage as Application['stage'],
    status: r.status as Application['status'],
    createdAt: r.createdAt,
    motive: r.motive,
    requestedBudget: r.requestedBudget,
    docScore: r.docScore,
    interviewScore: r.interviewScore,
    reviewResult: r.reviewResult as Application['reviewResult'],
    reviewOpinion: r.reviewOpinion,
    mentoring: r.mentoring,
    execRate: r.execRate,
    inspection: r.inspection,
    issue: r.issue,
    reportStatus: r.reportStatus as Application['reportStatus'],
    reportRejectReason: r.reportRejectReason,
    reportSummary: r.reportSummary,
    performance: r.performance,
    scores: j<Application['scores']>(r.scores),
    classificationManual: j<Application['classificationManual']>(r.classificationManual),
    followupSupport: r.followupSupport,
    followupLinkage: r.followupLinkage,
    nextContact: r.nextContact,
    manager: r.manager,
    kpis: j<Application['kpis']>(r.kpis),
    activities: j<Application['activities']>(r.activities),
    settlement: j<Application['settlement']>(r.settlement),
    attachments: j<Application['attachments']>(r.attachments),
    resultFiles: j<Application['resultFiles']>(r.resultFiles),
  }
}

// ---------------------------------------------------------------------
// 조회 — 예전 mock-data.ts의 같은 이름 함수와 시그니처가 같습니다 (async 로만 바뀜)
// ---------------------------------------------------------------------

export async function getCalls(): Promise<Call[]> {
  const rows = await prisma.call.findMany({ orderBy: { id: 'asc' } })
  return rows.map(toCall)
}

export async function getCall(id: string): Promise<Call | undefined> {
  const r = await prisma.call.findUnique({ where: { id } })
  return r ? toCall(r) : undefined
}

export async function getApplications(): Promise<Application[]> {
  const rows = await prisma.application.findMany({
    orderBy: [{ createdAt: 'asc' }, { displayNo: 'asc' }],
  })
  return rows.map(toApplication)
}

export async function getApplication(id: string): Promise<Application | undefined> {
  const r = await prisma.application.findUnique({ where: { id } })
  return r ? toApplication(r) : undefined
}

/** 특정 회원이 낸 신청서만 */
export async function getMyApplications(accountId: string): Promise<Application[]> {
  const rows = await prisma.application.findMany({
    where: { accountId },
    orderBy: [{ createdAt: 'asc' }, { displayNo: 'asc' }],
  })
  return rows.map(toApplication)
}

export async function getAccounts(): Promise<Account[]> {
  const rows = await prisma.account.findMany({ orderBy: { createdAt: 'asc' } })
  return rows.map(toAccount)
}

export async function getAccount(id: string): Promise<Account | undefined> {
  const r = await prisma.account.findUnique({ where: { id } })
  return r ? toAccount(r) : undefined
}
