# Supabase 마이그레이션

데이터베이스 스키마 변경 이력을 관리하는 폴더입니다.

## 📋 마이그레이션 파일 명명 규칙

```
[순번]_[설명].sql
```

**예시:**
- `001_initial_schema.sql` - 초기 스키마
- `002_add_tags_column.sql` - tags 컬럼 추가
- `003_add_todo_attachments.sql` - 첨부파일 테이블 추가

---

## 🚀 사용 방법

### 1. 새 마이그레이션 생성

```bash
# 파일 생성
touch supabase/migrations/002_add_tags_column.sql
```

### 2. SQL 작성

```sql
-- 002_add_tags_column.sql

-- tags 컬럼 추가
alter table public.todos 
add column if not exists tags text[];

-- 인덱스 추가
create index if not exists todos_tags_idx 
on public.todos using gin(tags);

-- 주석 추가
comment on column public.todos.tags is '할 일 태그 배열';
```

### 3. Supabase SQL Editor에서 실행

1. SQL Editor 열기
2. 마이그레이션 파일 내용 복사
3. 실행 (`Run` 버튼)
4. 성공 확인

---

## 📝 마이그레이션 예시

### 컬럼 추가

```sql
-- 할 일에 첨부파일 URL 추가
alter table public.todos 
add column if not exists attachment_urls text[];
```

### 새 테이블 추가

```sql
-- 할 일 댓글 테이블
create table if not exists public.todo_comments (
  id uuid primary key default gen_random_uuid(),
  todo_id uuid not null references public.todos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS 활성화
alter table public.todo_comments enable row level security;

-- 정책 추가
create policy "Users can view comments on own todos"
  on public.todo_comments
  for select
  using (
    exists (
      select 1 from public.todos
      where todos.id = todo_comments.todo_id
      and todos.user_id = auth.uid()
    )
  );
```

### 인덱스 추가

```sql
-- 검색 성능 향상을 위한 전문 검색 인덱스
create index if not exists todos_title_search_idx 
on public.todos using gin(to_tsvector('korean', title));

create index if not exists todos_description_search_idx 
on public.todos using gin(to_tsvector('korean', coalesce(description, '')));
```

### 함수 추가

```sql
-- 할 일 검색 함수
create or replace function search_todos(
  user_uuid uuid,
  search_query text
)
returns setof public.todos as $$
begin
  return query
  select *
  from public.todos
  where user_id = user_uuid
  and (
    title ilike '%' || search_query || '%'
    or description ilike '%' || search_query || '%'
  )
  order by created_date desc;
end;
$$ language plpgsql security definer;
```

---

## 🔄 롤백

마이그레이션을 되돌려야 할 경우:

```sql
-- 컬럼 삭제
alter table public.todos 
drop column if exists tags;

-- 테이블 삭제
drop table if exists public.todo_comments cascade;

-- 인덱스 삭제
drop index if exists todos_tags_idx;

-- 함수 삭제
drop function if exists search_todos(uuid, text);
```

---

## 💡 Best Practices

1. **항상 `if not exists` 사용**
   - 중복 실행 방지
   - 멱등성 보장

2. **롤백 계획 수립**
   - 각 마이그레이션에 대한 롤백 스크립트 준비
   - 테스트 환경에서 먼저 검증

3. **주석 작성**
   - 변경 이유 명시
   - 영향받는 테이블/기능 기록

4. **트랜잭션 사용** (가능한 경우)
   ```sql
   begin;
   -- 마이그레이션 내용
   commit;
   -- 또는 문제 발생 시: rollback;
   ```

5. **백업**
   - 중요한 변경 전 데이터베이스 백업
   - Supabase 대시보드에서 자동 백업 확인

---

## 📁 파일 구조

```
supabase/
├── schema.sql              # 초기 스키마 (전체)
├── migrations/
│   ├── README.md          # 이 문서
│   ├── 001_example.sql    # 예시 마이그레이션
│   └── ...
└── README.md              # Supabase 설정 가이드
```

---

## 🐛 트러블슈팅

### 마이그레이션 충돌

**문제:** 다른 개발자가 이미 같은 번호의 마이그레이션을 만듦

**해결:**
1. 다른 번호로 변경
2. 팀과 조율하여 번호 체계 정리

### RLS 정책 오류

**문제:** 정책 추가 시 permission denied

**해결:**
```sql
-- 기존 정책 확인
select * from pg_policies where tablename = 'your_table';

-- 충돌하는 정책 삭제
drop policy if exists "policy_name" on public.your_table;

-- 새 정책 추가
create policy ...
```

### 외래키 제약 위반

**문제:** 참조 무결성 위반

**해결:**
```sql
-- 제약 조건 비활성화 (임시)
alter table public.your_table disable trigger all;

-- 데이터 수정

-- 제약 조건 재활성화
alter table public.your_table enable trigger all;
```

---

**주의:** 프로덕션 환경에서는 마이그레이션을 신중하게 실행하세요!
