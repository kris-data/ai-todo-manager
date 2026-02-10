-- ============================================
-- Supabase 스키마 검증 쿼리
-- ============================================
-- 이 파일을 SQL Editor에서 실행하여
-- 데이터베이스 설정을 확인하세요.
-- ============================================

-- ============================================
-- 1. 테이블 존재 확인
-- ============================================

select 
  '✅ 테이블 확인' as check_name,
  table_name,
  (select count(*) from information_schema.columns where c.table_name = columns.table_name) as column_count
from information_schema.tables c
where table_schema = 'public'
  and table_name in ('users', 'todos')
order by table_name;

-- ============================================
-- 2. RLS 활성화 확인
-- ============================================

select 
  '✅ RLS 활성화' as check_name,
  tablename,
  case 
    when rowsecurity then '활성화됨 ✓'
    else '비활성화됨 ✗'
  end as rls_status
from pg_tables
where schemaname = 'public'
  and tablename in ('users', 'todos')
order by tablename;

-- ============================================
-- 3. RLS 정책 확인
-- ============================================

select 
  '✅ RLS 정책' as check_name,
  tablename,
  policyname,
  cmd as operation,
  case 
    when permissive = 'PERMISSIVE' then '허용 ✓'
    else '제한 ✗'
  end as policy_type
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- ============================================
-- 4. 인덱스 확인
-- ============================================

select 
  '✅ 인덱스' as check_name,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('users', 'todos')
order by tablename, indexname;

-- ============================================
-- 5. 트리거 확인
-- ============================================

select 
  '✅ 트리거' as check_name,
  trigger_name,
  event_object_table as table_name,
  event_manipulation as event_type,
  action_timing as timing
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;

-- ============================================
-- 6. 함수 확인
-- ============================================

select 
  '✅ 함수' as check_name,
  routine_name as function_name,
  routine_type as type,
  data_type as return_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'handle_new_user',
    'handle_todo_completed',
    'handle_updated_at',
    'get_todo_stats',
    'get_todos_by_category'
  )
order by routine_name;

-- ============================================
-- 7. 컬럼 상세 정보
-- ============================================

-- users 테이블
select 
  '✅ users 컬럼' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'users'
order by ordinal_position;

-- todos 테이블
select 
  '✅ todos 컬럼' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'todos'
order by ordinal_position;

-- ============================================
-- 8. 외래키 제약 확인
-- ============================================

select 
  '✅ 외래키' as check_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  rc.delete_rule
from information_schema.table_constraints as tc
join information_schema.key_column_usage as kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage as ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema = tc.table_schema
join information_schema.referential_constraints as rc
  on rc.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.table_name in ('users', 'todos')
order by tc.table_name, kcu.column_name;

-- ============================================
-- 9. 권한 확인
-- ============================================

select 
  '✅ 권한' as check_name,
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('users', 'todos')
  and grantee != 'postgres'
order by table_name, grantee;

-- ============================================
-- 10. 요약 정보
-- ============================================

select 
  '📊 요약' as summary,
  json_build_object(
    'tables', (
      select count(*) 
      from information_schema.tables 
      where table_schema = 'public' 
        and table_name in ('users', 'todos')
    ),
    'rls_enabled', (
      select count(*) 
      from pg_tables 
      where schemaname = 'public' 
        and tablename in ('users', 'todos')
        and rowsecurity = true
    ),
    'policies', (
      select count(*) 
      from pg_policies 
      where schemaname = 'public'
    ),
    'indexes', (
      select count(*) 
      from pg_indexes 
      where schemaname = 'public'
        and tablename in ('users', 'todos')
    ),
    'triggers', (
      select count(*) 
      from information_schema.triggers 
      where trigger_schema = 'public'
    ),
    'functions', (
      select count(*) 
      from information_schema.routines 
      where routine_schema = 'public'
    )
  ) as database_status;

-- ============================================
-- ✅ 검증 완료!
-- ============================================
-- 모든 결과를 확인하여 데이터베이스가
-- 올바르게 설정되었는지 확인하세요.
--
-- 예상 결과:
-- - 테이블: 2개 (users, todos)
-- - RLS 활성화: 2개
-- - RLS 정책: 8개 (각 테이블당 4개)
-- - 인덱스: 10개 이상
-- - 트리거: 3개
-- - 함수: 5개
-- ============================================
