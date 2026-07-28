-- =====================================================================
-- 함께일하는재단 통합관리시스템 — 초기 스키마
-- 0001_init.sql
--
-- 이 파일은 "DB 구조 설계도"입니다. Supabase에 이걸 실행하면
-- 테이블·권한·자동화가 한 번에 만들어집니다.
-- 유니티로 치면 세이브 데이터 구조 정의 + 마이그레이션 코드에 해당하며,
-- 구조를 바꿀 때마다 0002_, 0003_ 파일을 새로 추가하고 이 파일은 수정하지 않습니다.
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

-- 관리자 판정.
-- security definer = 이 함수 안에서는 RLS를 무시하고 조회한다는 뜻.
-- 이렇게 하지 않으면 "profiles를 읽으려면 관리자인지 확인해야 하고,
-- 관리자인지 확인하려면 profiles를 읽어야 하는" 무한 재귀에 빠진다.
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
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
--    Supabase Auth(auth.users)와 1:1. 비밀번호는 여기 저장하지 않는다.
--    참여자는 구글/카카오로, 관리자는 이메일+비밀번호로 로그인하지만
--    계정 저장소는 auth.users 하나로 공유된다.
-- ---------------------------------------------------------------------
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
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

-- 소셜 로그인으로 새 계정이 생기면 프로필 행을 자동 생성한다.
-- 여기서 role은 항상 participant. 관리자 승격은 대시보드에서 수동으로만 한다.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


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
  image_path  text,                                -- Storage 경로
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
-- 8. files — 첨부 메타데이터 (실제 파일은 Storage)
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
--    참여자는 조회할 수 없다.
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

create or replace function audit_application_changes()
returns trigger language plpgsql security definer set search_path = public as $$
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
      values (auth.uid(), 'applications', new.id, f, o ->> f, n ->> f);
    end if;
  end loop;
  return new;
end;
$$;
create trigger trg_applications_audit
  after update on applications
  for each row execute function audit_application_changes();


-- =====================================================================
-- 10. 권한 (RLS)
--
--     여기가 이 시스템 보안의 전부다.
--     "화면에서 안 보여준다"는 방어가 아니다. 브라우저 개발자도구로
--     요청을 직접 쏘면 그만이기 때문이다. 아래 정책은 DB 엔진이
--     직접 강제하므로 우회할 수 없다.
-- =====================================================================
alter table profiles         enable row level security;
alter table calls            enable row level security;
alter table applications     enable row level security;
alter table kpis             enable row level security;
alter table activities       enable row level security;
alter table settlements      enable row level security;
alter table settlement_items enable row level security;
alter table files            enable row level security;
alter table audit_logs       enable row level security;

-- profiles: 본인 행만. 관리자는 전체.
create policy p_profiles_select on profiles for select
  using (id = auth.uid() or is_admin());
create policy p_profiles_update on profiles for update
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());
create policy p_profiles_admin_all on profiles for all
  using (is_admin()) with check (is_admin());

-- 참여자가 스스로를 관리자로 승격시키는 것을 막는다.
-- (RLS만으로는 role 컬럼 변경을 막을 수 없어 트리거로 차단)
create or replace function guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    raise exception '권한을 변경할 수 없습니다.';
  end if;
  return new;
end;
$$;
create trigger trg_profiles_guard_role before update on profiles
  for each row execute function guard_profile_role();

-- calls: 로그인 사용자는 모집중인 공모를 조회.
-- 이미 신청한 공모는 마감된 뒤에도 계속 볼 수 있어야 한다.
-- (이 조건이 없으면 마감 후 "내 신청 내역"에서 사업명이 사라진다)
create policy p_calls_select on calls for select
  using (
    status = 'open'
    or is_admin()
    or exists (select 1 from applications a
               where a.call_id = calls.id and a.account_id = auth.uid())
  );
create policy p_calls_admin_all on calls for all
  using (is_admin()) with check (is_admin());

-- applications: 참여자는 본인 것만. 수정은 심사 시작 전('applied')까지만.
create policy p_apps_select on applications for select
  using (account_id = auth.uid() or is_admin());
create policy p_apps_insert on applications for insert
  with check (account_id = auth.uid());
create policy p_apps_update_own on applications for update
  using (account_id = auth.uid() and stage = 'applied')
  with check (account_id = auth.uid() and stage = 'applied');
create policy p_apps_admin_all on applications for all
  using (is_admin()) with check (is_admin());

-- kpis / activities / settlements: 참여자는 읽기만, 쓰기는 관리자만.
create policy p_kpis_select on kpis for select
  using (exists (select 1 from applications a
                 where a.id = application_id and (a.account_id = auth.uid() or is_admin())));
create policy p_kpis_admin_all on kpis for all
  using (is_admin()) with check (is_admin());

create policy p_acts_select on activities for select using (is_admin());
create policy p_acts_admin_all on activities for all
  using (is_admin()) with check (is_admin());

create policy p_settle_select on settlements for select
  using (exists (select 1 from applications a
                 where a.id = application_id and (a.account_id = auth.uid() or is_admin())));
create policy p_settle_admin_all on settlements for all
  using (is_admin()) with check (is_admin());

create policy p_settleitem_select on settlement_items for select
  using (exists (select 1 from settlements s join applications a on a.id = s.application_id
                 where s.id = settlement_id and (a.account_id = auth.uid() or is_admin())));
create policy p_settleitem_admin_all on settlement_items for all
  using (is_admin()) with check (is_admin());

-- files: 소유자 또는 관리자.
create policy p_files_select on files for select
  using (owner_account_id = auth.uid() or is_admin());
create policy p_files_insert on files for insert
  with check (owner_account_id = auth.uid() or is_admin());
create policy p_files_delete on files for delete
  using (owner_account_id = auth.uid() or is_admin());
create policy p_files_admin_all on files for all
  using (is_admin()) with check (is_admin());

-- audit_logs: 관리자만 조회. 아무도 직접 쓰지 못한다(트리거만 기록).
create policy p_audit_select on audit_logs for select using (is_admin());


-- =====================================================================
-- 11. 파일 저장소 (Storage)
--     테이블 RLS와 버킷 정책은 별개다. 버킷 정책을 빠뜨리면
--     경로를 아는 사람이 첨부파일을 전부 받아갈 수 있다.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)   -- 신청 첨부·결과 파일 (비공개)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('call-images', 'call-images', true)    -- 공모 대표 이미지 (공개 읽기)
on conflict (id) do nothing;

-- attachments: 경로 규칙 {account_id}/{application_id}/{파일명}
-- 경로 첫 칸이 본인 uid와 같아야 접근 가능.
create policy s_attach_read on storage.objects for select
  using (bucket_id = 'attachments'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy s_attach_write on storage.objects for insert
  with check (bucket_id = 'attachments'
              and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy s_attach_delete on storage.objects for delete
  using (bucket_id = 'attachments'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- call-images: 누구나 읽기, 관리자만 쓰기.
create policy s_callimg_read on storage.objects for select
  using (bucket_id = 'call-images');
create policy s_callimg_write on storage.objects for all
  using (bucket_id = 'call-images' and public.is_admin())
  with check (bucket_id = 'call-images' and public.is_admin());
