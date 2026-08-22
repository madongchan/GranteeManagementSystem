/**
 * 시드 스크립트 — 목업 데이터(web/src/lib/mock-data.ts)를 실제 DB로 옮깁니다.
 *
 * 이미 있는 행은 지우고 다시 넣습니다(멱등). 운영 데이터를 보존하는 마이그레이션이
 * 아니라 "지금 화면에 나오는 시연용 데이터를 DB에도 똑같이 채워두는" 용도입니다.
 *
 * 실행: npx prisma db seed  (또는 그냥 npx tsx prisma/seed.ts)
 */
import { prisma } from '../src/lib/prisma'
import type { Prisma } from '../src/generated/prisma/client'
// mock-data.ts는 타입만 '@/lib/types'에서 가져오므로(런타임에는 지워짐) 상대 경로로
// 바로 import해도 안전합니다. tsx가 tsconfig의 @/* 별칭을 풀 필요가 없습니다.
import { ACCOUNTS, APPLICATIONS, CALLS } from '../src/lib/mock-data'

// types.ts의 도메인 타입(Consents, Application['scores'] 등)은 고정된 필드를 가진
// interface라 Prisma의 Json 입력 타입(인덱스 시그니처 필요)과 구조적으로 안 맞습니다.
// 값 자체는 이미 순수 JSON이므로 타입만 캐스팅합니다.
const json = (v: unknown) => v as Prisma.InputJsonValue

async function main() {
  console.log(`시드 시작 — Call ${CALLS.length}건, Account ${ACCOUNTS.length}건, Application ${APPLICATIONS.length}건`)

  // FK 때문에 자식(Application)부터 지웁니다.
  await prisma.application.deleteMany()
  await prisma.account.deleteMany()
  await prisma.call.deleteMany()

  await prisma.call.createMany({
    data: CALLS.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      targets: json(c.targets),
      sectors: json(c.sectors),
      startDate: c.startDate,
      endDate: c.endDate,
      budget: c.budget,
      capacity: c.capacity,
      status: c.status,
      image: c.image ?? null,
    })),
  })

  await prisma.account.createMany({
    data: ACCOUNTS.map((a) => ({
      id: a.id,
      kind: a.kind,
      name: a.name,
      type: a.type,
      sector: a.sector,
      email: a.email,
      contact: a.contact,
      birthDate: a.birthDate,
      rep: a.rep ?? null,
      affiliation: a.affiliation ?? null,
      sido: a.sido ?? null,
      sigungu: a.sigungu ?? null,
      ageBand: a.ageBand ?? null,
      scaleBand: a.scaleBand ?? null,
      consents: json(a.consents),
      createdAt: a.createdAt,
    })),
  })

  await prisma.application.createMany({
    data: APPLICATIONS.map((app) => ({
      id: app.id,
      displayNo: app.displayNo,
      accountId: app.accountId,
      callId: app.callId,
      applicant: json(app.applicant),
      stage: app.stage,
      status: app.status,
      createdAt: app.createdAt,
      motive: app.motive,
      requestedBudget: app.requestedBudget,
      docScore: app.docScore,
      interviewScore: app.interviewScore,
      reviewResult: app.reviewResult,
      reviewOpinion: app.reviewOpinion,
      mentoring: app.mentoring,
      execRate: app.execRate,
      inspection: app.inspection,
      issue: app.issue,
      reportStatus: app.reportStatus,
      reportRejectReason: app.reportRejectReason,
      reportSummary: app.reportSummary,
      performance: app.performance,
      scores: json(app.scores),
      classificationManual: app.classificationManual,
      followupSupport: app.followupSupport,
      followupLinkage: app.followupLinkage,
      nextContact: app.nextContact,
      manager: app.manager,
      kpis: json(app.kpis),
      activities: json(app.activities),
      settlement: json(app.settlement),
      attachments: json(app.attachments),
      resultFiles: json(app.resultFiles),
    })),
  })

  const [calls, accounts, apps] = await Promise.all([
    prisma.call.count(),
    prisma.account.count(),
    prisma.application.count(),
  ])
  console.log(`시드 완료 — Call ${calls}, Account ${accounts}, Application ${apps}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
