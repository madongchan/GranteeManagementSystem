/**
 * 가짜 데이터
 *
 * 나중에 DB를 붙이면 이 파일만 통째로 갈아끼우면 됩니다.
 * 화면 코드는 여기서 데이터를 가져다 쓰기만 하므로 손댈 필요가 없습니다.
 *
 * 원본 프로토타입의 시연용 데이터를 옮기고, 화면 확인에 필요한 사례를 몇 개 더 넣었습니다.
 */
import type { Account, Application, Call, Consents } from '@/lib/types'

const 전체동의: Consents = {
  collect: true,
  thirdParty: true,
  research: true,
  followup: true,
  survey: true,
  agreedAt: '2024-03-04',
}

const 최소동의: Consents = {
  collect: true,
  thirdParty: false,
  research: false,
  followup: false,
  survey: false,
  agreedAt: '2025-02-10',
}

// ---------------------------------------------------------------------
// 공모사업
// ---------------------------------------------------------------------
export const CALLS: Call[] = [
  {
    id: 'CALL-2024-01',
    title: '모두의공모 2024',
    description: '지역 비영리단체의 방과후·돌봄 사업을 지원합니다.',
    target: 'both',
    startDate: '2024-02-01',
    endDate: '2024-03-15',
    budget: '최대 1,200만원',
    capacity: '20팀',
    status: 'closed',
  },
  {
    id: 'CALL-2025-01',
    title: '모두의공모 2025',
    description: '청년·창작자와 단체의 지역 활동을 지원합니다.',
    target: 'both',
    startDate: '2025-01-15',
    endDate: '2026-12-31',
    budget: '최대 1,000만원',
    capacity: '25팀',
    status: 'open',
  },
  {
    id: 'CALL-2026-01',
    title: '지역돌봄 역량강화 지원사업',
    description: '돌봄 기관의 회계·행정 역량 강화를 지원합니다.',
    target: 'org',
    startDate: '2026-06-01',
    endDate: '2026-09-30',
    budget: '최대 500만원',
    capacity: '15팀',
    status: 'open',
  },
]

// ---------------------------------------------------------------------
// 회원
// ---------------------------------------------------------------------
export const ACCOUNTS: Account[] = [
  {
    id: 'ACC-001',
    kind: 'org',
    name: '햇살지역아동센터',
    orgType: '지역아동센터',
    founded: '2016',
    rep: '김OO',
    contact: '02-000-0000',
    sido: '서울특별시',
    sigungu: '구로구',
    scaleBand: '1~5억',
    consents: 전체동의,
  },
  {
    id: 'ACC-002',
    kind: 'individual',
    name: '이OO',
    affiliation: '프리랜서 디자이너',
    contact: '010-0000-0000',
    sido: '경기도',
    sigungu: '성남시',
    ageBand: '30대',
    consents: 최소동의,
  },
  {
    id: 'ACC-003',
    kind: 'org',
    name: '나눔마을협동조합',
    orgType: '협동조합',
    founded: '2019',
    rep: '박OO',
    contact: '031-000-0000',
    sido: '경기도',
    sigungu: '고양시',
    scaleBand: '연 1억 미만',
    consents: { ...전체동의, agreedAt: '2025-01-20', survey: false },
  },
]

/** 로그인 붙이기 전까지 "지금 로그인한 참여자"로 가정할 계정 */
export const CURRENT_ACCOUNT_ID = 'ACC-001'

// ---------------------------------------------------------------------
// 신청서
// ---------------------------------------------------------------------

/** 신청서 기본값. 새 신청서를 만들 때 여기서 시작합니다. */
function 기본신청서(): Omit<Application, 'id' | 'displayNo' | 'accountId' | 'callId' | 'applicant'> {
  return {
    stage: 'applied',
    status: 'received',
    createdAt: new Date().toISOString().slice(0, 10),
    motive: '',
    requestedBudget: null,
    docScore: null,
    interviewScore: null,
    reviewResult: '',
    reviewOpinion: '',
    mentoring: '',
    execRate: null,
    inspection: '',
    issue: '',
    reportStatus: 'none',
    reportRejectReason: '',
    reportSummary: '',
    performance: '',
    scores: { accounting: 0, execution: 0, outcome: 0, sustainability: 0, linkage: 0 },
    classificationManual: null,
    followupSupport: '',
    followupLinkage: '',
    nextContact: '',
    manager: '',
    kpis: [],
    activities: [],
    settlement: {
      status: 'none',
      items: [],
      evalSchedule: null,
      evalFaithfulness: null,
      evalCommunication: null,
      note: '',
    },
    attachments: [],
    resultFiles: [],
  }
}

export const APPLICATIONS: Application[] = [
  // 사후관리까지 끝난 사례.
  // 5축이 모두 채워져 자동 분류가 나옵니다.
  // 안정성 = 회계2 + 자립2 = 4 (5 미만) / 잠재력 = 수행3 + 성과3 + 연계3 = 9 (7 이상)
  // → 안정성 낮음 + 잠재력 높음 = '집중관리'
  {
    ...기본신청서(),
    id: 'APP-001',
    displayNo: 'FND-2024-0137',
    accountId: 'ACC-001',
    callId: 'CALL-2024-01',
    applicant: { ...ACCOUNTS[0] },
    stage: 'aftercare',
    status: 'selected',
    createdAt: '2024-03-04',
    motive: '방과후 프로그램 확대, 운영비 부족',
    requestedBudget: 12_000_000,
    docScore: 82,
    interviewScore: 78,
    reviewResult: '선정',
    reviewOpinion: '사업계획 구체적, 회계역량 보완 필요',
    mentoring: '4회',
    execRate: 87,
    inspection: '1회 · 양호',
    issue: '회계 정산 지연 1건',
    reportStatus: 'approved',
    reportSummary: '방과후 프로그램 12개월 운영 완료. 참여아동 35명.',
    performance: '참여아동 35명 · 만족도 4.3/5',
    scores: { accounting: 2, execution: 3, outcome: 3, sustainability: 2, linkage: 3 },
    followupSupport: '회계사 멘토링 2회 연계',
    followupLinkage: "'회계교육' 사업 추천",
    nextContact: '2026-09-15',
    manager: '이채림',
    kpis: [
      { name: '참여 아동 수', target: 30, actual: 35 },
      { name: '프로그램 만족도(5점)', target: 4.0, actual: 4.3 },
    ],
    activities: [
      { date: '2024-11-20', type: '방문', note: '종료 현장점검 · 성과 양호' },
      { date: '2025-01-15', type: '연락', note: '회계교육 사업 안내, 관심 표명' },
    ],
    settlement: {
      status: 'done',
      items: [
        { name: '강사비', planned: 6_000_000, spent: 5_800_000, proof: '영수증 8건 · 드라이브 링크' },
        { name: '교재·재료비', planned: 4_000_000, spent: 4_000_000, proof: '세금계산서 3건' },
        { name: '운영비', planned: 2_000_000, spent: 1_900_000, proof: '카드영수증' },
      ],
      evalSchedule: 'good',
      evalFaithfulness: 'good',
      evalCommunication: 'good',
      note: '',
    },
    attachments: [{ name: '사업계획서.pdf', size: 842_000 }],
    resultFiles: [{ name: '결과보고서.pdf', size: 1_240_000 }],
  },

  // 사업진행 중 — 5축이 비어 있어 '미분류'로 표시됩니다.
  {
    ...기본신청서(),
    id: 'APP-002',
    displayNo: 'FND-2025-0042',
    accountId: 'ACC-002',
    callId: 'CALL-2025-01',
    applicant: { ...ACCOUNTS[1] },
    stage: 'in_progress',
    status: 'selected',
    createdAt: '2025-02-10',
    motive: '지역 청년 창작 활동 지원 희망',
    requestedBudget: 3_000_000,
    docScore: 75,
    interviewScore: 80,
    reviewResult: '선정',
    reviewOpinion: '창작 역량 우수, 사업 경험은 부족',
    mentoring: '2회',
    execRate: 40,
    inspection: '미실시',
    manager: '이채림',
    settlement: {
      status: 'in_progress',
      items: [
        { name: '재료비', planned: 2_000_000, spent: 800_000, proof: '영수증 3건' },
        { name: '홍보비', planned: 1_000_000, spent: 400_000, proof: '' },
      ],
      evalSchedule: 'fair',
      evalFaithfulness: null,
      evalCommunication: null,
      note: '',
    },
    attachments: [{ name: '포트폴리오.pdf', size: 3_100_000 }],
  },

  // 정산이 부실한 사례 — 대시보드 경고에 잡힙니다.
  {
    ...기본신청서(),
    id: 'APP-003',
    displayNo: 'FND-2025-0088',
    accountId: 'ACC-003',
    callId: 'CALL-2025-01',
    applicant: { ...ACCOUNTS[2] },
    stage: 'closed',
    status: 'selected',
    createdAt: '2025-03-02',
    motive: '마을 공동체 활동 공간 운영비 지원',
    requestedBudget: 8_000_000,
    docScore: 68,
    interviewScore: 71,
    reviewResult: '선정',
    reviewOpinion: '지역 네트워크 강점, 회계 관리 체계 미흡',
    mentoring: '1회',
    execRate: 62,
    inspection: '1회 · 보완 필요',
    issue: '정산 서류 3회 반려',
    reportStatus: 'rejected',
    reportRejectReason: '집행 내역과 증빙 금액이 일치하지 않습니다. 재제출 바랍니다.',
    reportSummary: '공동체 프로그램 8회 운영',
    scores: { accounting: 1, execution: 2, outcome: 2, sustainability: 1, linkage: 3 },
    nextContact: '2026-07-01',
    manager: '이채림',
    kpis: [{ name: '프로그램 참여 인원', target: 100, actual: 62 }],
    activities: [{ date: '2026-05-12', type: '연락', note: '정산 서류 보완 요청 (3회차)' }],
    settlement: {
      status: 'in_progress',
      items: [
        { name: '공간 임차료', planned: 5_000_000, spent: 5_000_000, proof: '계약서' },
        { name: '프로그램비', planned: 3_000_000, spent: 1_200_000, proof: '일부 누락' },
      ],
      evalSchedule: 'poor',
      evalFaithfulness: 'poor',
      evalCommunication: 'fair',
      note: '증빙 보완 요청 3회',
    },
  },

  // 막 접수된 건 — 관리자 대시보드의 '검토 대기'에 잡힙니다.
  {
    ...기본신청서(),
    id: 'APP-004',
    displayNo: 'FND-2026-0003',
    accountId: 'ACC-001',
    callId: 'CALL-2026-01',
    applicant: { ...ACCOUNTS[0] },
    stage: 'applied',
    status: 'received',
    createdAt: '2026-07-20',
    motive: '회계 담당 인력 부재로 행정 부담이 큽니다. 역량강화 교육이 필요합니다.',
    requestedBudget: 5_000_000,
  },

  // 미선정 사례
  {
    ...기본신청서(),
    id: 'APP-005',
    displayNo: 'FND-2025-0051',
    accountId: 'ACC-002',
    callId: 'CALL-2024-01',
    applicant: { ...ACCOUNTS[1] },
    stage: 'review',
    status: 'rejected',
    createdAt: '2024-03-10',
    motive: '전시 공간 대관 지원',
    requestedBudget: 4_000_000,
    docScore: 61,
    interviewScore: 58,
    reviewResult: '미선정',
    reviewOpinion: '사업 목적과 공모 취지의 연결이 약함',
  },
]

// ---------------------------------------------------------------------
// 조회 함수 — 화면에서는 이것만 부릅니다.
// 나중에 DB로 바꿀 때 이 함수들의 속만 갈아끼우면 됩니다.
// ---------------------------------------------------------------------

export function getCalls() {
  return CALLS
}

export function getOpenCalls() {
  return CALLS.filter((c) => c.status === 'open')
}

export function getCall(id: string) {
  return CALLS.find((c) => c.id === id)
}

export function getApplications() {
  return APPLICATIONS
}

export function getApplication(id: string) {
  return APPLICATIONS.find((a) => a.id === id)
}

/** 특정 회원이 낸 신청서만 */
export function getMyApplications(accountId: string) {
  return APPLICATIONS.filter((a) => a.accountId === accountId)
}

export function getAccount(id: string) {
  return ACCOUNTS.find((a) => a.id === id)
}
