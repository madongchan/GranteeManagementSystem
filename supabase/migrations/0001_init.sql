-- =====================================================================
-- 함께일하는재단 통합관리시스템 — 초기 스키마
-- 0001_init.sql
--
-- 이 파일은 "DB 구조 설계도"입니다. Neon(순수 Postgres)에 이걸 실행하면
-- 테이블·자동화가 한 번에 만들어집니다.
-- 유니티로 치면 세이브 데이터 구조 정의 + 마이그레이션 코드에 해당하며,
-- 구조를 바꿀 때마다 0002_, 0003_ 파일을 새로 추가하고 이 파일은 수정하지 않습니다.
--
-- [2026-08-23] Supabase → Neon으로 플랫폼을 바꾸면서 이 파일을 고쳤습니다.
-- Neon은 순수 Postgres라 Supabase가 끼워주던 두 가지가 없습니다.
--   1. auth.users / auth.uid() — 로그인 사용자 테이블·현재 로그인 id 함수.
--      이 앱은 어차피 Supabase Auth를 안 쓰고 web/src/lib/auth.ts에서
--      직접 세션 쿠키를 관리하므로, 원래도 안 맞물리던 부분입니다.
--   2. storage.* — 파일 저장 서비스. 아직 앱 코드가 파일 업로드를
--      구현하지 않았으므로 지금은 없어도 됩니다.
-- 그래서 RLS(행 단위 권한) 정책과 Storage 버킷 설정을 걷어냈습니다.
-- 권한 검사는 Next.js 라우트 코드에서 세션을 보고 직접 합니다
-- (관리자 화면은 아직 로그인 자체가 없어 이 부분은 별도 과제로 남아있음).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. 확장
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()


-- ---------------------------------------------------------------------
-- 1. 열거형(enum)
--    프로토타입은 단계를 정수 0~4로 저장했으나, 단계가 하나만 추가돼도
--    기존 데이터가 전부 밀리므로 텍스트 enum으로 확정한다.
-- ---------------------------------------------------------------------
create type user_role         as enum ('participant', 'admin');
create type profile_kind      as enum ('org', 'individual');
create type call_target       as enum ('org', 'individual', 'both');
create type call_status       as enum ('open', 'closed');

-- 내부 진행 단계(관리자용)
create type app_stage         as enum ('applied', 'review', 'in_progress', 'closed', 'aftercare');
-- 참여자에게 노출되는 상태
create type app_status        as enum ('received', 'reviewing', 'selected', 'rejected');

create type review_result     as enum ('selected', 'rejected', 'hold');
create type report_status     as enum ('none', 'submitted', 'approved', 'rejected');
create type settlement_status as enum ('none', 'in_progress', 'done');
-- 정산 3축 평가: good=최상 / fair=중간 / poor=최하(부실 플래그 대상)
create type settle_grade      as enum ('good', 'fair', 'poor');
create type activity_type     as enum ('visit', 'contact', 'other');
create type file_context      as enum ('application_attachment', 'result_file', 'call_image');


-- ---------------------------------------------------------------------
-- 2. 공통 유틸
-- ---------------------------------------------------------------------

-- updated_at 자동 갱신
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 5축 진단 → 4분류 자동 판정 (프로토타입 computeClass 이관)
--   안정성 = 회계 + 자립          (0~6, 임계 5 이상)
--   잠재력 = 수행 + 성과 + 연계   (0~9, 임계 7 이상)
--   하나라도 0(미입력)이면 '미분류'
-- immutable = 같은 입력이면 항상 같은 출력. 생성 열에 쓰려면 필수.
create or replace function compute_class(
  p_accounting int, p_execution int, p_outcome int,
  p_sustainability int, p_linkage int
) returns text
language sql
immutable
as $$
  select case
    when coalesce(p_accounting,0) = 0
      or coalesce(p_execution,0) = 0
      or coalesce(p_outcome,0) = 0
      or coalesce(p_sustainability,0) = 0
      or coalesce(p_linkage,0) = 0
      then '미분류'
    when (p_accounting + p_sustainability) >= 5
     and (p_execution + p_outcome + p_linkage) >= 7 then '성장연계'
    when (p_accounting + p_sustainability) <  5
     and (p_execution + p_outcome + p_linkage) >= 7 then '집중관리'
    when (p_accounting + p_sustainability) >= 5
     and (p_execution + p_outcome + p_linkage) <  7 then '일반 모니터링'
    else '관찰'
  end;
$$;


-- ---------------------------------------------------------------------
-- 3. profiles — 회원 프로필
--    Neon엔 auth.users가 없으므로 독립된 기본키를 쓴다.
--    구글 로그인의 sub 값이나 체험 계정 id를 앱 코드에서 그대로 넣으면 된다.
-- ---------------------------------------------------------------------
create table profiles (
  id           uuid primary key default gen_random_uuid(),
  role         user_role   not null default 'participant',
  kind         profile_kind not null default 'org',
  email        text,
  name         text        not null default '',   -- 기관명 또는 성명
  org_type     text,                              -- 기관 유형(개인은 null)
  affiliation  text,                              -- 개인 소속
  founded      text,
  rep          text,
  contact      text,
  sido         text,
  sigungu      text,
  age_band     text,                              -- 개인: 연령대
  scale_band   text,                              -- 기관: 규모
  consents     jsonb       not null default '{}'::jsonb,
  approved     boolean     not null default true, -- 가입 승인제 미사용(기본 허용). 켜려면 default false
  profile_done boolean     not null default false,-- 소셜 로그인 후 추가정보 입력 완료 여부
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on profiles (role);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();


-- ---------------------------------------------------------------------
-- 4. calls — 공모사업
-- ---------------------------------------------------------------------
create table calls (
  id          uuid primary key default gen_random_uuid(),
  title       text        not null,
  description text        not null default '',
  target      call_target not null default 'both',
  start_date  date,
  end_date    date,
  budget      text,                                -- "최대 1,200만원" 같은 표기용 자유 문자열
  capacity    text,
  status      call_status not null default 'open',
  image_path  text,                                -- 대표 이미지 경로(파일 저장소 붙이면 사용)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on calls (status, end_date);
create trigger trg_calls_updated before update on calls
  for each row execute function set_updated_at();


-- ---------------------------------------------------------------------
-- 5. applications — 신청서 (관리자 화면의 참여자 카드)
--    프로토타입의 거대한 JSON 하나가 이 테이블 + kpis + activities +
--    settlements + files 로 나뉜다.
-- ---------------------------------------------------------------------
create sequence application_no_seq;

create table applications (
  id          uuid primary key default gen_random_uuid(),
  display_no  text unique not null
                default 'FND-' || to_char(now(), 'YYYY') || '-'
                       || lpad(nextval('application_no_seq')::text, 4, '0'),
  account_id  uuid not null references profiles(id) on delete restrict,
  call_id     uuid          references calls(id)    on delete set null,

  -- 신청 당시 기관/개인 정보를 그대로 동결한다(심사 공정성).
  -- 이후 참여자가 프로필을 수정해도 제출된 신청서 내용은 바뀌지 않는다.
  applicant_snapshot jsonb not null default '{}'::jsonb,

  stage       app_stage  not null default 'applied',
  status      app_status not null default 'received',
  from_participant boolean not null default true,   -- 포털 접수 여부(관리자 직접 등록 시 false)

  -- 신청
  motive           text,
  requested_budget numeric(14,0),

  -- 심사
  doc_score        numeric(5,2),
  interview_score  numeric(5,2),
  review_result    review_result,
  review_opinion   text,

  -- 사업진행
  mentoring   text,
  exec_rate   numeric(5,2),      -- 집행률 %
  inspection  text,
  issue       text,

  -- 종료
  report_status        report_status not null default 'none',
  report_reject_reason text,
  report_summary       text,
  report_submitted_at  timestamptz,
  performance          text,

  -- 5축 진단 (0=미입력, 1=미흡, 2=보통, 3=우수)
  score_accounting     smallint not null default 0 check (score_accounting     between 0 and 3),
  score_execution      smallint not null default 0 check (score_execution      between 0 and 3),
  score_outcome        smallint not null default 0 check (score_outcome        between 0 and 3),
  score_sustainability smallint not null default 0 check (score_sustainability between 0 and 3),
  score_linkage        smallint not null default 0 check (score_linkage        between 0 and 3),

  -- 분류: 자동 판정값은 저장하지 않고 점수에서 매번 계산한다(불일치 방지).
  -- 관리자가 손으로 지정한 값만 별도 저장하며, 지정 시 자동값보다 우선한다.
  classification_manual text,
  classification_auto text generated always as (
    compute_class(score_accounting, score_execution, score_outcome,
                  score_sustainability, score_linkage)
  ) stored,
  classification text generated always as (
    coalesce(
      classification_manual,
      compute_class(score_accounting, score_execution, score_outcome,
                    score_sustainability, score_linkage)
    )
  ) stored,

  -- 사후관리
  followup_support text,
  followup_linkage text,
  next_contact     date,
  manager          text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on applications (account_id);
create index on applications (call_id);
create index on applications (stage);
create index on applications (classification);
create index on applications (next_contact);
create trigger trg_applications_updated before update on applications
  for each row execute function set_updated_at();


-- ---------------------------------------------------------------------
-- 6. kpis / activities — 설계서에 누락됐던 테이블(프로토타입에는 존재)
-- ---------------------------------------------------------------------
create table kpis (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  name           text not null default '',
  target_value   numeric(14,2),
  actual_value   numeric(14,2),
  sort_order     int  not null default 0,
  created_at     timestamptz not null default now()
);
create index on kpis (application_id);

create table activities (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  occurred_on    date not null,
  type           activity_type not null default 'contact',
  note           text not null default '',
  created_by     uuid references profiles(id),
  created_at     timestamptz not null default now()
);
create index on activities (application_id, occurred_on desc);


-- ---------------------------------------------------------------------
-- 7. settlements / settlement_items — 정산
--    3축 정산평가는 설계서에 누락됐으나 프로토타입에 있어 반영한다.
-- ---------------------------------------------------------------------
create table settlements (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references applications(id) on delete cascade,
  status         settlement_status not null default 'none',
  eval_schedule      settle_grade,   -- 정산 일정 준수
  eval_faithfulness  settle_grade,   -- 정산 충실도
  eval_communication settle_grade,   -- 소통 원활성
  eval_note      text,
  -- 3축 중 하나라도 최하 등급이면 '정산 부실'. 대시보드 경고 대상.
  -- 미평가(null)는 부실이 아니므로 coalesce로 false 처리한다.
  is_poor boolean generated always as (
    coalesce(eval_schedule      = 'poor', false)
    or coalesce(eval_faithfulness  = 'poor', false)
    or coalesce(eval_communication = 'poor', false)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_settlements_updated before update on settlements
  for each row execute function set_updated_at();

create table settlement_items (
  id            uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references settlements(id) on delete cascade,
  name          text not null default '',
  planned       numeric(14,0) not null default 0,
  spent         numeric(14,0) not null default 0,
  proof         text,
  sort_order    int not null default 0
);
create index on settlement_items (settlement_id);


-- ---------------------------------------------------------------------
-- 8. files — 첨부 메타데이터
--    실제 파일을 어디 둘지(Vercel Blob 등)는 업로드 기능을 만들 때 정한다.
--    이 표는 "어떤 파일이 어느 신청서/공모에 딸려있나"만 기록한다.
-- ---------------------------------------------------------------------
create table files (
  id               uuid primary key default gen_random_uuid(),
  owner_account_id uuid not null references profiles(id) on delete restrict,
  application_id   uuid references applications(id) on delete cascade,
  call_id          uuid references calls(id) on delete cascade,
  context          file_context not null,
  storage_path     text not null unique,
  file_name        text not null,
  mime_type        text,
  size             bigint,
  created_at       timestamptz not null default now()
);
create index on files (application_id);
create index on files (call_id);


-- ---------------------------------------------------------------------
-- 9. audit_logs — 변경 이력
--    누가 언제 단계·심사결과·점수·분류를 바꿨는지 추적한다.
-- ---------------------------------------------------------------------
create table audit_logs (
  id          bigserial primary key,
  actor_id    uuid references profiles(id),
  table_name  text not null,
  record_id   uuid not null,
  field       text not null,
  old_value   text,
  new_value   text,
  created_at  timestamptz not null default now()
);
create index on audit_logs (record_id, created_at desc);

-- ponytail: actor_id는 지금 항상 null로 남는다. Supabase에서는 auth.uid()로
-- "지금 로그인한 사람"을 DB가 알아서 채워줬지만, Neon은 그런 개념이 없다.
-- 관리자 로그인이 생기면 앱 코드에서 `set_config('app.actor_id', ...)`로
-- 세션 변수를 넘기고 아래 트리거가 그 값을 읽게 바꾼다.
create or replace function audit_application_changes()
returns trigger language plpgsql as $$
declare
  f text;
  watched text[] := array[
    'stage','status','review_result','report_status',
    'score_accounting','score_execution','score_outcome',
    'score_sustainability','score_linkage','classification_manual'
  ];
  -- 레코드를 jsonb로 바꿔 필드명으로 접근한다.
  -- (동적 SQL로 ($1).필드명 을 쓰면 파라미터 타입을 알 수 없어 실패한다)
  o jsonb := to_jsonb(old);
  n jsonb := to_jsonb(new);
begin
  foreach f in array watched loop
    if (o ->> f) is distinct from (n ->> f) then
      insert into audit_logs (actor_id, table_name, record_id, field, old_value, new_value)
      values (null, 'applications', new.id, f, o ->> f, n ->> f);
    end if;
  end loop;
  return new;
end;
$$;
create trigger trg_applications_audit
  after update on applications
  for each row execute function audit_application_changes();
