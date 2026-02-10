-- ============================================
-- 예시 마이그레이션: tags 컬럼 추가
-- ============================================
-- 설명: todos 테이블에 tags 컬럼을 추가하여
--       태그 기반 필터링 기능을 지원합니다.
-- 날짜: 2026-01-09
-- ============================================

-- tags 컬럼 추가
alter table public.todos 
add column if not exists tags text[] default '{}';

-- GIN 인덱스 추가 (배열 검색 최적화)
create index if not exists todos_tags_idx 
on public.todos using gin(tags);

-- 주석 추가
comment on column public.todos.tags is '할 일 태그 배열 (예: 긴급, 중요, 검토필요 등)';

-- ============================================
-- 롤백 방법:
-- ============================================
-- alter table public.todos drop column if exists tags;
-- drop index if exists todos_tags_idx;
