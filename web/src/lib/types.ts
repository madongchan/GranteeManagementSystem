/**
 * 데이터 모양 정의
 *
 * 유니티로 치면 ScriptableObject / 직렬화 클래스 정의에 해당합니다.
 * 나중에 DB를 붙일 때도 이 모양은 그대로 씁니다.
 */

/** 내부 진행 단계 (관리자가 보는 것) */
export type Stage = 'applied' | 'review' | 'in_progress' | 'closed' | 'aftercare'

/** 참여자에게 보이는 상태 */
export type Status = 'received' | 'reviewing' | 'selected' | 'rejected'

/** 기관인지 개인인지 */
export type Kind = 'org' | 'individual'

/** 5축 진단 점수. 0 = 미입력, 1 = 미흡, 2 = 보통, 3 = 우수 */
export type Score = 0 | 1 | 2 | 3

/** 4분류 결과 */
export type Classification = '성장연계' | '집중관리' | '일반 모니터링' | '관찰' | '미분류'

/** 정산 3축 평가 등급 */
export type Grade = 'good' | 'fair' | 'poor'

/** 결과보고 상태 */
export type ReportStatus = 'none' | 'submitted' | 'approved' | 'rejected'

/** 개인정보 동의 항목 */
export interface Consents {
  collect: boolean       // 개인정보 수집·이용 (필수)
  thirdParty: boolean    // 제3자 제공
  research: boolean      // 연구·정책개선 활용
  followup: boolean      // 후속지원 안내 수신
  survey: boolean        // 만족도·성과추적 조사 참여
  agreedAt: string
}

/** 회원 (로그인한 사람) */
export interface Account {
  id: string
  kind: Kind
  name: string           // 기관명 또는 성명
  orgType?: string       // 기관 유형
  affiliation?: string   // 개인 소속
  founded?: string
  rep?: string           // 대표자
  contact?: string
  sido?: string
  sigungu?: string
  ageBand?: string       // 개인: 연령대
  scaleBand?: string     // 기관: 규모
  consents: Consents
}

/** 공모사업 */
export interface Call {
  id: string
  title: string
  description: string
  target: 'org' | 'individual' | 'both'
  startDate: string
  endDate: string
  budget: string
  capacity: string
  status: 'open' | 'closed'
}

/** 성과지표 */
export interface Kpi {
  name: string
  target: number | null
  actual: number | null
}

/** 활동 이력 */
export interface Activity {
  date: string
  type: '방문' | '연락' | '기타'
  note: string
}

/** 정산 항목 */
export interface SettlementItem {
  name: string
  planned: number   // 계획 금액
  spent: number     // 집행 금액
  proof: string     // 증빙
}

/** 정산 */
export interface Settlement {
  status: 'none' | 'in_progress' | 'done'
  items: SettlementItem[]
  /** 3축 평가. 미평가는 null */
  evalSchedule: Grade | null       // 정산 일정 준수
  evalFaithfulness: Grade | null   // 정산 충실도
  evalCommunication: Grade | null  // 소통 원활성
  note: string
}

/** 첨부파일 */
export interface Attachment {
  name: string
  size: number
}

/**
 * 신청서 — 이 시스템의 중심 데이터.
 * 관리자 화면의 "참여자 카드" 하나가 이것입니다.
 */
export interface Application {
  id: string
  displayNo: string      // 사람이 읽는 접수번호 (FND-2024-0137)
  accountId: string
  callId: string

  /** 신청 당시의 기관/개인 정보를 그대로 얼려둔 것.
   *  이후 참여자가 프로필을 고쳐도 제출된 신청서는 바뀌지 않습니다. */
  applicant: Omit<Account, 'id'>

  stage: Stage
  status: Status
  createdAt: string

  // 신청
  motive: string
  requestedBudget: number | null

  // 심사
  docScore: number | null
  interviewScore: number | null
  reviewResult: '선정' | '미선정' | '보류' | ''
  reviewOpinion: string

  // 사업진행
  mentoring: string
  execRate: number | null    // 집행률 %
  inspection: string
  issue: string

  // 종료
  reportStatus: ReportStatus
  reportRejectReason: string
  reportSummary: string
  performance: string

  // 5축 진단
  scores: {
    accounting: Score       // 회계·행정 역량
    execution: Score        // 사업수행 역량
    outcome: Score          // 성과 달성도
    sustainability: Score   // 자립 가능성
    linkage: Score          // 재단 연계 관심
  }

  /** 관리자가 손으로 지정한 분류. 있으면 자동 판정보다 우선합니다. */
  classificationManual: Classification | null

  // 사후관리
  followupSupport: string
  followupLinkage: string
  nextContact: string       // 다음 접촉 예정일
  manager: string

  kpis: Kpi[]
  activities: Activity[]
  settlement: Settlement
  attachments: Attachment[]
  resultFiles: Attachment[]
}
