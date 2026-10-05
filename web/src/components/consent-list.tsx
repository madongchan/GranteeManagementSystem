/**
 * 개인정보 동의 목록 — 항목마다 '자세히 보기'로 상세 내역을 펼칠 수 있습니다.
 *
 * ⚠️ 상세 문구는 일반적인 예시입니다. 실제 서비스 전에 재단의
 *    개인정보 처리방침에 맞게 검토·수정해야 합니다.
 */
import type { Consents } from '@/lib/types'

export const CONSENTS = [
  {
    key: 'collect',
    label: '개인정보 수집·이용',
    required: true,
    details: [
      ['수집 목적', '공모사업 신청 접수, 심사, 선정 결과 안내, 사업 진행 및 사후관리'],
      ['수집 항목', '성명(기관·기업명), 이메일, 연락처, 생년월일(설립일), 소속(대표자), 지역, 사업자등록번호 또는 고유번호'],
      ['보유 기간', '회원 탈퇴 시까지. 단, 신청·지원 이력은 사업 종료 후 5년간 보관'],
      ['거부 시 불이익', '동의하지 않을 수 있으나, 이 경우 공모사업 신청이 불가능합니다.'],
    ],
  },
  {
    key: 'thirdParty',
    label: '제3자 제공',
    required: false,
    details: [
      ['제공받는 자', '공모사업 공동 주관·후원 기관, 외부 심사위원'],
      ['제공 목적', '신청서 심사 및 사업 운영 협력'],
      ['제공 항목', '성명(기관·기업명), 연락처, 신청서 내용'],
      ['보유 기간', '해당 사업 종료 후 1년'],
      ['거부 시 불이익', '없음. 다만 공동 주관 사업은 신청이 제한될 수 있습니다.'],
    ],
  },
  {
    key: 'research',
    label: '연구·정책개선 목적 활용',
    required: false,
    details: [
      ['이용 목적', '지원사업 성과 분석, 통계 작성, 정책 개선 연구'],
      ['이용 항목', '기관 유형, 사업 분야, 지역, 규모, 사업 성과 (개인을 알아볼 수 없게 처리 후 활용)'],
      ['보유 기간', '사업 종료 후 5년'],
      ['거부 시 불이익', '없음'],
    ],
  },
  {
    key: 'followup',
    label: '후속지원 프로그램 안내 수신',
    required: false,
    details: [
      ['이용 목적', '후속지원·연계 프로그램 및 신규 공모사업 안내'],
      ['이용 항목', '성명(기관·기업명), 이메일, 연락처'],
      ['보유 기간', '수신 동의 철회 시까지'],
      ['거부 시 불이익', '없음'],
    ],
  },
  {
    key: 'survey',
    label: '만족도·성과추적 조사 참여',
    required: false,
    details: [
      ['이용 목적', '사업 만족도 조사 및 종료 후 성과 추적 조사'],
      ['이용 항목', '성명(기관·기업명), 이메일, 연락처'],
      ['보유 기간', '사업 종료 후 3년'],
      ['거부 시 불이익', '없음'],
    ],
  },
] as const

export function ConsentList({ consents }: { consents: Consents }) {
  return (
    <div className="border border-line rounded-[7px] divide-y divide-line">
      {CONSENTS.map((c) => (
        <div key={c.key} className="px-3 py-2.5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              name={c.key}
              required={c.required}
              defaultChecked={consents[c.key] === true}
              className="accent-[#1d7a5f] w-4 h-4"
            />
            <span className="text-[13.5px]">{c.label}</span>
            <span
              className={`text-[11.5px] ml-auto ${c.required ? 'text-[#a32d2d]' : 'text-faint'}`}
            >
              {c.required ? '필수' : '선택'}
            </span>
          </label>
          <details className="mt-1.5 ml-[26px]">
            <summary className="text-[12px] text-muted cursor-pointer hover:text-text">
              자세히 보기
            </summary>
            <dl className="mt-2 bg-bg rounded-[7px] px-3 py-2.5 space-y-1.5 text-[12.5px] leading-relaxed">
              {c.details.map(([term, desc]) => (
                <div key={term} className="flex gap-2">
                  <dt className="text-muted w-[84px] shrink-0">{term}</dt>
                  <dd>{desc}</dd>
                </div>
              ))}
            </dl>
          </details>
        </div>
      ))}
    </div>
  )
}
