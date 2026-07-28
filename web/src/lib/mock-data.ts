/**
 * 가짜 데이터
 *
 * 나중에 DB를 붙이면 이 파일만 통째로 갈아끼우면 됩니다.
 * 화면 코드는 아래 조회 함수만 부르므로 손댈 필요가 없습니다.
 *
 * 시연에서 기능이 살아 보이도록 일부러 다양하게 섞었습니다.
 * (분야별·주체별로 골고루, 정산 부실 건, 반려 건, 신규 접수 건 등)
 */
import type { Account, Application, Call, Consents } from '@/lib/types'

// ---------------------------------------------------------------------
// 동의 조합 — 필터 시연을 위해 몇 가지 패턴을 만들어 둡니다
// ---------------------------------------------------------------------
function consent(
  partial: Partial<Omit<Consents, 'agreedAt'>> & { agreedAt: string },
): Consents {
  return {
    collect: true, // 필수라 항상 true
    thirdParty: false,
    research: false,
    followup: false,
    survey: false,
    ...partial,
  }
}

const 전체동의 = (date: string) =>
  consent({ thirdParty: true, research: true, followup: true, survey: true, agreedAt: date })
const 후속지원만 = (date: string) => consent({ followup: true, agreedAt: date })
const 최소동의 = (date: string) => consent({ agreedAt: date })

// ---------------------------------------------------------------------
// 공모사업
// ---------------------------------------------------------------------
export const CALLS: Call[] = [
  {
    id: 'CALL-2024-01',
    title: '모두의공모 2024',
    description:
      '지역 비영리단체의 방과후·돌봄 사업을 지원합니다. 아동이 안전하게 머물 수 있는 환경을 만드는 활동에 우선 지원합니다.',
    targets: ['org', 'company', 'individual'],
    sectors: ['아동·청소년'],
    startDate: '2024-02-01',
    endDate: '2024-03-15',
    budget: '최대 1,200만원',
    capacity: '20팀',
    status: 'closed',
  },
  {
    id: 'CALL-2025-01',
    title: '모두의공모 2025',
    description:
      '청년·창작자와 단체의 지역 활동을 지원합니다. 지역 자원을 활용한 문화·예술 기반 사업을 환영합니다.',
    targets: ['org', 'company', 'individual'],
    sectors: ['문화·예술', '지역사회·마을'],
    startDate: '2025-01-15',
    endDate: '2026-12-31',
    budget: '최대 1,000만원',
    capacity: '25팀',
    status: 'open',
  },
  {
    id: 'CALL-2026-01',
    title: '지역돌봄 역량강화 지원사업',
    description:
      '돌봄 기관의 회계·행정 역량 강화를 지원합니다. 회계 담당 인력이 없는 소규모 기관을 우선 선발합니다.',
    targets: ['org'],
    sectors: ['아동·청소년', '노인', '장애인'],
    startDate: '2026-06-01',
    endDate: '2026-09-30',
    budget: '최대 500만원',
    capacity: '15팀',
    status: 'open',
  },
  {
    id: 'CALL-2026-02',
    title: '소셜벤처 성장 지원 프로그램',
    description:
      '사회문제 해결형 기업의 성장 단계를 지원합니다. 고용·자립 성과를 낼 수 있는 사업모델을 찾습니다.',
    targets: ['company'],
    sectors: ['일자리·자립', '저소득·자활'],
    startDate: '2026-07-01',
    endDate: '2026-08-31',
    budget: '최대 3,000만원',
    capacity: '8팀',
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
    type: '지역아동센터',
    sector: '아동·청소년',
    email: 'sunshine@care.or.kr',
    contact: '02-000-0001',
    birthDate: '2016-03-02',
    rep: '김민서',
    sido: '서울특별시',
    sigungu: '구로구',
    scaleBand: '1~5억',
    consents: 전체동의('2024-02-20'),
    createdAt: '2024-02-20',
  },
  {
    id: 'ACC-002',
    kind: 'individual',
    name: '이준호',
    type: '창작자·예술인',
    sector: '문화·예술',
    email: 'junho.lee@example.com',
    contact: '010-0000-0002',
    birthDate: '1992-08-14',
    affiliation: '프리랜서 디자이너',
    sido: '경기도',
    sigungu: '성남시',
    ageBand: '30대',
    consents: 최소동의('2025-02-01'),
    createdAt: '2025-02-01',
  },
  {
    id: 'ACC-003',
    kind: 'company',
    name: '나눔마을협동조합',
    type: '사회적협동조합',
    sector: '지역사회·마을',
    email: 'contact@nanum-village.kr',
    contact: '031-000-0003',
    birthDate: '2019-05-20',
    rep: '박서연',
    sido: '경기도',
    sigungu: '고양시',
    scaleBand: '연 1억 미만',
    consents: 후속지원만('2025-01-20'),
    createdAt: '2025-01-20',
  },
  {
    id: 'ACC-004',
    kind: 'org',
    name: '늘봄노인복지관',
    type: '노인복지관',
    sector: '노인',
    email: 'welfare@neulbom.or.kr',
    contact: '051-000-0004',
    birthDate: '2008-11-01',
    rep: '정하윤',
    sido: '부산광역시',
    sigungu: '해운대구',
    scaleBand: '5~10억',
    consents: 전체동의('2025-04-10'),
    createdAt: '2025-04-10',
  },
  {
    id: 'ACC-005',
    kind: 'company',
    name: '이음소셜벤처',
    type: '소셜벤처',
    sector: '일자리·자립',
    email: 'hello@ieum.social',
    contact: '02-000-0005',
    birthDate: '2022-01-17',
    rep: '최도현',
    sido: '서울특별시',
    sigungu: '성동구',
    scaleBand: '1~5억',
    consents: 전체동의('2026-06-15'),
    createdAt: '2026-06-15',
  },
  {
    id: 'ACC-006',
    kind: 'org',
    name: '든든장애인주간보호센터',
    type: '장애인주간보호시설',
    sector: '장애인',
    email: 'deundeun@care.or.kr',
    contact: '042-000-0006',
    birthDate: '2014-07-08',
    rep: '한지우',
    sido: '대전광역시',
    sigungu: '유성구',
    scaleBand: '연 1억 미만',
    consents: 후속지원만('2026-05-02'),
    createdAt: '2026-05-02',
  },
  {
    id: 'ACC-007',
    kind: 'individual',
    name: '윤소라',
    type: '사회복지사',
    sector: '정신건강',
    email: 'sora.yoon@example.com',
    contact: '010-0000-0007',
    birthDate: '1988-02-27',
    affiliation: '지역정신건강복지센터',
    sido: '인천광역시',
    sigungu: '남동구',
    ageBand: '30대',
    consents: 전체동의('2026-03-11'),
    createdAt: '2026-03-11',
  },
  {
    id: 'ACC-008',
    kind: 'org',
    name: '하나다문화가족지원센터',
    type: '다문화가족지원센터',
    sector: '다문화·이주민',
    email: 'hana@multi.or.kr',
    contact: '063-000-0008',
    birthDate: '2011-09-15',
    rep: '오세진',
    sido: '전북특별자치도',
    sigungu: '전주시',
    scaleBand: '1~5억',
    consents: 최소동의('2026-02-19'),
    createdAt: '2026-02-19',
  },
  {
    id: 'ACC-009',
    kind: 'company',
    name: '다시봄자활기업',
    type: '자활기업',
    sector: '저소득·자활',
    email: 'info@dasibom.kr',
    contact: '053-000-0009',
    birthDate: '2020-04-06',
    rep: '신다은',
    sido: '대구광역시',
    sigungu: '남구',
    scaleBand: '연 1억 미만',
    consents: 전체동의('2026-06-30'),
    createdAt: '2026-06-30',
  },
  {
    id: 'ACC-010',
    kind: 'individual',
    name: '강태윤',
    type: '현장 활동가',
    sector: '노숙인·주거취약',
    email: 'taeyun.kang@example.com',
    contact: '010-0000-0010',
    birthDate: '1979-12-03',
    affiliation: '주거복지네트워크',
    sido: '서울특별시',
    sigungu: '영등포구',
    ageBand: '40대',
    consents: 후속지원만('2026-07-05'),
    createdAt: '2026-07-05',
  },
]

/** 로그인 붙이기 전까지 "지금 로그인한 참여자"로 가정할 계정 */
export const CURRENT_ACCOUNT_ID = 'ACC-001'

// ---------------------------------------------------------------------
// 신청서
// ---------------------------------------------------------------------

/** 새 신청서의 기본값 */
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

/** 회원 정보를 신청 시점 그대로 얼려 넣습니다 */
function snapshot(accountId: string) {
  const acc = ACCOUNTS.find((a) => a.id === accountId)!
  const { id: _id, ...rest } = acc
  return rest
}

export const APPLICATIONS: Application[] = [
  // ── 사후관리 단계. 5축이 모두 채워져 자동 분류가 나옵니다.
  //    안정성 = 회계2 + 자립2 = 4 (5 미만) / 잠재력 = 수행3 + 성과3 + 연계3 = 9 (7 이상)
  //    → 안정성 낮음 + 잠재력 높음 = '집중관리'
  {
    ...기본신청서(),
    id: 'APP-001',
    displayNo: 'FND-2024-0137',
    accountId: 'ACC-001',
    callId: 'CALL-2024-01',
    applicant: snapshot('ACC-001'),
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
        { name: '강사비', planned: 6_000_000, spent: 5_800_000, proof: '영수증 8건' },
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

  // ── 사업진행 중. 5축이 비어 '미분류'.
  {
    ...기본신청서(),
    id: 'APP-002',
    displayNo: 'FND-2025-0042',
    accountId: 'ACC-002',
    callId: 'CALL-2025-01',
    applicant: snapshot('ACC-002'),
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

  // ── 정산 부실 + 결과보고 반려. 대시보드 경고 2곳에 잡힙니다.
  {
    ...기본신청서(),
    id: 'APP-003',
    displayNo: 'FND-2025-0088',
    accountId: 'ACC-003',
    callId: 'CALL-2025-01',
    applicant: snapshot('ACC-003'),
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

  // ── 막 접수된 건. 대시보드 '검토 대기'.
  {
    ...기본신청서(),
    id: 'APP-004',
    displayNo: 'FND-2026-0003',
    accountId: 'ACC-001',
    callId: 'CALL-2026-01',
    applicant: snapshot('ACC-001'),
    stage: 'applied',
    status: 'received',
    createdAt: '2026-07-20',
    motive: '회계 담당 인력 부재로 행정 부담이 큽니다. 역량강화 교육이 필요합니다.',
    requestedBudget: 5_000_000,
  },

  // ── 미선정
  {
    ...기본신청서(),
    id: 'APP-005',
    displayNo: 'FND-2024-0151',
    accountId: 'ACC-002',
    callId: 'CALL-2024-01',
    applicant: snapshot('ACC-002'),
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

  // ── 성장연계 사례 (안정성 6, 잠재력 8)
  {
    ...기본신청서(),
    id: 'APP-006',
    displayNo: 'FND-2025-0104',
    accountId: 'ACC-004',
    callId: 'CALL-2025-01',
    applicant: snapshot('ACC-004'),
    stage: 'aftercare',
    status: 'selected',
    createdAt: '2025-05-08',
    motive: '어르신 대상 세대통합 문화 프로그램 운영',
    requestedBudget: 9_500_000,
    docScore: 90,
    interviewScore: 88,
    reviewResult: '선정',
    reviewOpinion: '조직 안정성과 사업 기획력 모두 우수',
    mentoring: '3회',
    execRate: 96,
    inspection: '2회 · 우수',
    reportStatus: 'approved',
    reportSummary: '세대통합 프로그램 24회 운영, 지역 언론 보도 2건',
    performance: '참여 어르신 120명 · 청소년 60명',
    scores: { accounting: 3, execution: 3, outcome: 3, sustainability: 3, linkage: 2 },
    followupSupport: '우수사례 발표 요청',
    followupLinkage: '재단 네트워크 허브 기관 후보',
    nextContact: '2026-10-20',
    manager: '박도윤',
    kpis: [
      { name: '참여 어르신 수', target: 100, actual: 120 },
      { name: '프로그램 운영 횟수', target: 20, actual: 24 },
    ],
    activities: [{ date: '2026-04-18', type: '방문', note: '우수사례 인터뷰 촬영' }],
    settlement: {
      status: 'done',
      items: [
        { name: '프로그램 운영비', planned: 6_000_000, spent: 5_950_000, proof: '영수증 일체' },
        { name: '인건비', planned: 3_500_000, spent: 3_500_000, proof: '급여대장' },
      ],
      evalSchedule: 'good',
      evalFaithfulness: 'good',
      evalCommunication: 'good',
      note: '',
    },
  },

  // ── 심사 중
  {
    ...기본신청서(),
    id: 'APP-007',
    displayNo: 'FND-2026-0011',
    accountId: 'ACC-005',
    callId: 'CALL-2026-02',
    applicant: snapshot('ACC-005'),
    stage: 'review',
    status: 'reviewing',
    createdAt: '2026-07-08',
    motive: '경력단절 여성 대상 IT 교육 후 채용 연계 모델 확장',
    requestedBudget: 28_000_000,
    docScore: 84,
    reviewOpinion: '서류 통과, 면접 예정',
    manager: '박도윤',
  },

  // ── 관찰 사례 (안정성 5, 잠재력 5) → 일반 모니터링
  {
    ...기본신청서(),
    id: 'APP-008',
    displayNo: 'FND-2026-0007',
    accountId: 'ACC-006',
    callId: 'CALL-2026-01',
    applicant: snapshot('ACC-006'),
    stage: 'in_progress',
    status: 'selected',
    createdAt: '2026-06-12',
    motive: '이용인 개별화 지원계획 수립을 위한 행정 체계 정비',
    requestedBudget: 4_800_000,
    docScore: 72,
    interviewScore: 70,
    reviewResult: '선정',
    reviewOpinion: '안정적으로 운영 중이나 확장 의지는 크지 않음',
    mentoring: '1회',
    execRate: 35,
    scores: { accounting: 3, execution: 2, outcome: 2, sustainability: 2, linkage: 1 },
    nextContact: '2026-11-05',
    manager: '이채림',
  },

  // ── 접수 대기 (개인)
  {
    ...기본신청서(),
    id: 'APP-009',
    displayNo: 'FND-2026-0014',
    accountId: 'ACC-007',
    callId: 'CALL-2025-01',
    applicant: snapshot('ACC-007'),
    stage: 'applied',
    status: 'received',
    createdAt: '2026-07-24',
    motive: '정신건강 회복 당사자와 함께하는 기록 워크숍',
    requestedBudget: 2_500_000,
  },

  // ── 지연 후속관리 (접촉 예정일이 지남)
  {
    ...기본신청서(),
    id: 'APP-010',
    displayNo: 'FND-2025-0122',
    accountId: 'ACC-008',
    callId: 'CALL-2025-01',
    applicant: snapshot('ACC-008'),
    stage: 'aftercare',
    status: 'selected',
    createdAt: '2025-06-30',
    motive: '결혼이주여성 통번역 인력 양성',
    requestedBudget: 7_200_000,
    docScore: 79,
    interviewScore: 76,
    reviewResult: '선정',
    reviewOpinion: '지역 수요 명확, 성과 측정 계획 보완 필요',
    execRate: 91,
    reportStatus: 'approved',
    performance: '통번역 인력 12명 양성, 8명 활동 연계',
    scores: { accounting: 2, execution: 3, outcome: 2, sustainability: 2, linkage: 2 },
    nextContact: '2026-06-10',
    manager: '박도윤',
    activities: [{ date: '2026-02-14', type: '연락', note: '후속 활동 현황 확인' }],
    settlement: {
      status: 'done',
      items: [{ name: '교육 운영비', planned: 7_200_000, spent: 6_900_000, proof: '영수증 일체' }],
      evalSchedule: 'fair',
      evalFaithfulness: 'good',
      evalCommunication: 'good',
      note: '',
    },
  },

  // ── 기업 신청 (자활)
  {
    ...기본신청서(),
    id: 'APP-011',
    displayNo: 'FND-2026-0018',
    accountId: 'ACC-009',
    callId: 'CALL-2026-02',
    applicant: snapshot('ACC-009'),
    stage: 'applied',
    status: 'received',
    createdAt: '2026-07-26',
    motive: '자활 참여자 정규 채용 전환을 위한 설비 확충',
    requestedBudget: 25_000_000,
  },

  // ── 개인 활동가 (주거)
  {
    ...기본신청서(),
    id: 'APP-012',
    displayNo: 'FND-2026-0019',
    accountId: 'ACC-010',
    callId: 'CALL-2025-01',
    applicant: snapshot('ACC-010'),
    stage: 'applied',
    status: 'received',
    createdAt: '2026-07-27',
    motive: '주거취약 1인가구 실태조사와 기록집 발간',
    requestedBudget: 3_800_000,
  },
]

// ---------------------------------------------------------------------
// 조회 함수 — 화면에서는 이것만 부릅니다.
// DB로 바꿀 때 이 함수들의 속만 갈아끼우면 됩니다.
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

export function getAccounts() {
  return ACCOUNTS
}

export function getAccount(id: string) {
  return ACCOUNTS.find((a) => a.id === id)
}

/** 이 회원이 신청한 공모 목록 (회원 관리 화면의 '사업별' 필터에 씁니다) */
export function getCallIdsOf(accountId: string): string[] {
  return [...new Set(APPLICATIONS.filter((a) => a.accountId === accountId).map((a) => a.callId))]
}

/** 담당 매니저 목록 */
export function getManagers(): string[] {
  return [...new Set(APPLICATIONS.map((a) => a.manager).filter(Boolean))]
}
