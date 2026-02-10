-- ============================================
-- AI Todo Manager - Supabase 데이터베이스 스키마
-- ============================================

-- 확장 기능 활성화
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. Users 프로필 테이블
-- ============================================

/**
 * public.users
 * auth.users와 1:1로 연결되는 사용자 프로필 테이블
 */
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 사용자 프로필 자동 생성 트리거 함수
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- auth.users에 새 사용자 추가 시 자동으로 프로필 생성
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 2. Todos 테이블
-- ============================================

/**
 * public.todos
 * 사용자별 할 일 관리 테이블
 */
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  created_date timestamp with time zone default now(),
  due_date timestamp with time zone,
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  category text[] default '{}',
  completed boolean not null default false,
  completed_at timestamp with time zone,
  updated_at timestamp with time zone default now()
);

-- 완료 시간 자동 업데이트 트리거 함수
create or replace function public.handle_todo_completed()
returns trigger as $$
begin
  if new.completed = true and old.completed = false then
    new.completed_at = now();
  elsif new.completed = false and old.completed = true then
    new.completed_at = null;
  end if;
  return new;
end;
$$ language plpgsql;

-- 완료 상태 변경 시 completed_at 자동 업데이트
drop trigger if exists on_todo_completed on public.todos;
create trigger on_todo_completed
  before update on public.todos
  for each row execute function public.handle_todo_completed();

-- updated_at 자동 업데이트 트리거 함수
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- todos 테이블 업데이트 시 updated_at 자동 갱신
drop trigger if exists on_todo_updated on public.todos;
create trigger on_todo_updated
  before update on public.todos
  for each row execute function public.handle_updated_at();

-- ============================================
-- 3. 인덱스 생성 (성능 최적화)
-- ============================================

-- users 테이블 인덱스
create index if not exists users_email_idx on public.users(email);

-- todos 테이블 인덱스
create index if not exists todos_user_id_idx on public.todos(user_id);
create index if not exists todos_created_date_idx on public.todos(created_date desc);
create index if not exists todos_due_date_idx on public.todos(due_date) where due_date is not null;
create index if not exists todos_priority_idx on public.todos(priority);
create index if not exists todos_completed_idx on public.todos(completed);
create index if not exists todos_category_idx on public.todos using gin(category);

-- 복합 인덱스 (자주 사용되는 쿼리 최적화)
create index if not exists todos_user_completed_idx on public.todos(user_id, completed);
create index if not exists todos_user_priority_idx on public.todos(user_id, priority);

-- ============================================
-- 4. Row Level Security (RLS) 활성화
-- ============================================

-- users 테이블 RLS 활성화
alter table public.users enable row level security;

-- todos 테이블 RLS 활성화
alter table public.todos enable row level security;

-- ============================================
-- 5. Users 테이블 RLS 정책
-- ============================================

-- 사용자는 자신의 프로필만 조회 가능
create policy "Users can view own profile"
  on public.users
  for select
  using (auth.uid() = id);

-- 사용자는 자신의 프로필만 수정 가능
create policy "Users can update own profile"
  on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 사용자는 자신의 프로필만 삭제 가능
create policy "Users can delete own profile"
  on public.users
  for delete
  using (auth.uid() = id);

-- ============================================
-- 6. Todos 테이블 RLS 정책
-- ============================================

-- 사용자는 자신의 할 일만 조회 가능
create policy "Users can view own todos"
  on public.todos
  for select
  using (auth.uid() = user_id);

-- 사용자는 자신의 할 일만 생성 가능
create policy "Users can create own todos"
  on public.todos
  for insert
  with check (auth.uid() = user_id);

-- 사용자는 자신의 할 일만 수정 가능
create policy "Users can update own todos"
  on public.todos
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 사용자는 자신의 할 일만 삭제 가능
create policy "Users can delete own todos"
  on public.todos
  for delete
  using (auth.uid() = user_id);

-- ============================================
-- 7. 유용한 함수 (선택 사항)
-- ============================================

/**
 * 사용자별 할 일 통계 조회 함수
 * @param user_uuid - 사용자 ID
 * @return 전체, 완료, 미완료, 지연 개수
 */
create or replace function get_todo_stats(user_uuid uuid)
returns table (
  total_count bigint,
  completed_count bigint,
  incomplete_count bigint,
  overdue_count bigint
) as $$
begin
  return query
  select
    count(*)::bigint as total_count,
    count(*) filter (where completed = true)::bigint as completed_count,
    count(*) filter (where completed = false)::bigint as incomplete_count,
    count(*) filter (where completed = false and due_date < now())::bigint as overdue_count
  from public.todos
  where user_id = user_uuid;
end;
$$ language plpgsql security definer;

/**
 * 카테고리별 할 일 개수 조회 함수
 * @param user_uuid - 사용자 ID
 * @return 카테고리별 개수
 */
create or replace function get_todos_by_category(user_uuid uuid)
returns table (
  category_name text,
  todo_count bigint
) as $$
begin
  return query
  select
    unnest(category) as category_name,
    count(*)::bigint as todo_count
  from public.todos
  where user_id = user_uuid
  group by category_name
  order by todo_count desc;
end;
$$ language plpgsql security definer;

-- ============================================
-- 8. 초기 데이터 (선택 사항)
-- ============================================

-- 샘플 카테고리 (앱에서 사용할 기본 카테고리)
comment on column public.todos.category is '할 일 카테고리 (예: 업무, 개인, 학습, 운동, 취미)';

-- ============================================
-- 완료! 이제 Supabase에서 실행 가능합니다.
-- ============================================

-- 실행 순서:
-- 1. Supabase SQL Editor에서 이 파일 전체를 복사
-- 2. 'Run' 버튼 클릭하여 실행
-- 3. 성공 메시지 확인
--
-- 테이블 확인:
-- select * from public.users;
-- select * from public.todos;
--
-- RLS 정책 확인:
-- select tablename, policyname, permissive, roles, cmd, qual
-- from pg_policies
-- where schemaname = 'public';
