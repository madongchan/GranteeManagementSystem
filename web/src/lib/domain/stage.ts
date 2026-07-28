/**
 * 진행 단계와 참여자 노출 상태
 *
 * 관리자가 보는 "단계"와 참여자에게 보이는 "상태"는 다릅니다.
 * 예를 들어 관리자 화면이 '사업진행'이어도 참여자에게는 '선정'으로만 보입니다.
 * 이 두 가지를 분리한 것이 원본 프로토타입의 좋은 설계라 그대로 가져왔습니다.
 */
import type { Stage, Status } from '@/lib/types'

/** 관리자 화면의 5단계. 순서가 곧 진행 순서입니다. */
export const STAGES: { key: Stage; label: string }[] = [
  { key: 'applied', label: '신청' },
  { key: 'review', label: '심사' },
  { key: 'in_progress', label: '사업진행' },
  { key: 'closed', label: '종료' },
  { key: 'aftercare', label: '사후관리' },
]

export function stageLabel(stage: Stage): string {
  return STAGES.find((s) => s.key === stage)?.label ?? stage
}

/** 몇 번째 단계인지 (진행 막대 그릴 때 사용) */
export function stageIndex(stage: Stage): number {
  return STAGES.findIndex((s) => s.key === stage)
}

/** 참여자 화면에 보여줄 문구 */
export const STATUS_LABEL: Record<Status, string> = {
  received: '접수 완료',
  reviewing: '심사 중',
  selected: '선정',
  rejected: '미선정',
}

/** 참여자 상태별 배지 색 */
export const STATUS_STYLE: Record<Status, string> = {
  received: 'bg-[#f1efe8] text-[#5f5e5a]',
  reviewing: 'bg-[#faeeda] text-[#854f0b]',
  selected: 'bg-[#e1f5ee] text-[#0f6e56]',
  rejected: 'bg-[#f1efe8] text-[#9c9a92]',
}

/**
 * 참여자 화면에 보여줄 설명 문구.
 * 같은 '선정' 상태라도 단계에 따라 다르게 안내합니다.
 */
export function participantMessage(stage: Stage, status: Status): string {
  if (status === 'rejected') return '아쉽게도 이번에는 선정되지 않았습니다.'
  if (status === 'received') return '신청이 접수되었습니다. 심사 일정은 개별 안내드립니다.'
  if (status === 'reviewing') return '심사가 진행 중입니다.'

  switch (stage) {
    case 'in_progress':
      return '사업을 수행 중입니다. 종료 후 결과보고를 제출해 주세요.'
    case 'closed':
      return '사업이 종료되었습니다.'
    case 'aftercare':
      return '사후관리 중입니다. 후속지원 안내를 받으실 수 있습니다.'
    default:
      return '선정되었습니다.'
  }
}

/** 참여자가 신청서를 아직 고칠 수 있는지 (심사 시작 전까지만) */
export function canEdit(stage: Stage): boolean {
  return stage === 'applied'
}

/** 참여자가 결과보고를 제출할 수 있는 단계인지 */
export function canSubmitReport(stage: Stage, status: Status): boolean {
  return status === 'selected' && (stage === 'in_progress' || stage === 'closed')
}
