# Supabase 데이터베이스 스키마

AI Todo Manager를 위한 Supabase 데이터베이스 스키마입니다.

## 📋 테이블 구조

### 1. `public.users`

사용자 프로필 테이블 (auth.users와 1:1 관계)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | uuid | Primary Key (auth.users.id 참조) |
| `email` | text | 이메일 (unique) |
| `display_name` | text | 표시 이름 |
| `avatar_url` | text | 아바타 이미지 URL |
| `created_at` | timestamp | 생성 시각 |
| `updated_at` | timestamp | 수정 시각 |

**특징:**
- ✅ auth.users에 새 사용자 등록 시 자동으로 프로필 생성
- ✅ RLS 활성화 (본인만 읽기/수정/삭제)

---

### 2. `public.todos`

할 일 관리 테이블

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | uuid | Primary Key |
| `user_id` | uuid | 사용자 ID (auth.users.id 참조) |
| `title` | text | 할 일 제목 (필수) |
| `description` | text | 상세 설명 |
| `created_date` | timestamp | 생성 시각 |
| `due_date` | timestamp | 마감 기한 |
| `priority` | text | 우선순위 (high/medium/low) |
| `category` | text[] | 카테고리 배열 |
| `completed` | boolean | 완료 여부 |
| `completed_at` | timestamp | 완료 시각 |
| `updated_at` | timestamp | 수정 시각 |

**제약조건:**
- `priority`: 'high', 'medium', 'low' 중 하나
- `completed`: 기본값 false

**특징:**
- ✅ 완료 상태 변경 시 `completed_at` 자동 업데이트
- ✅ 수정 시 `updated_at` 자동 업데이트
- ✅ RLS 활성화 (본인만 CRUD)
- ✅ 성능 최적화 인덱스

---

## 🔐 Row Level Security (RLS)

### Users 테이블 정책

```sql
-- 조회: 본인 프로필만
"Users can view own profile"

-- 수정: 본인 프로필만
"Users can update own profile"

-- 삭제: 본인 프로필만
"Users can delete own profile"
```

### Todos 테이블 정책

```sql
-- 조회: 본인 할 일만
"Users can view own todos"

-- 생성: 본인 할 일만
"Users can create own todos"

-- 수정: 본인 할 일만
"Users can update own todos"

-- 삭제: 본인 할 일만
"Users can delete own todos"
```

---

## 🚀 설치 방법

### 1. Supabase 프로젝트 생성

1. [Supabase 대시보드](https://app.supabase.com)에 로그인
2. "New Project" 클릭
3. 프로젝트 이름, 비밀번호, 리전 선택
4. "Create new project" 클릭

### 2. 스키마 실행

1. Supabase 대시보드에서 **SQL Editor** 메뉴 클릭
2. "New query" 클릭
3. `supabase/schema.sql` 파일의 **전체 내용**을 복사
4. SQL Editor에 붙여넣기
5. **"Run"** 버튼 클릭 (또는 `Ctrl/Cmd + Enter`)
6. 성공 메시지 확인

### 3. 테이블 확인

**Table Editor**에서 확인:
- `public.users` 테이블 생성 확인
- `public.todos` 테이블 생성 확인

**SQL Editor**에서 확인:
```sql
-- 테이블 목록 조회
select table_name 
from information_schema.tables 
where table_schema = 'public';

-- RLS 정책 확인
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public';
```

---

## 📊 유용한 쿼리

### 할 일 통계 조회

```sql
select * from get_todo_stats(auth.uid());
```

**반환값:**
- `total_count`: 전체 개수
- `completed_count`: 완료 개수
- `incomplete_count`: 미완료 개수
- `overdue_count`: 지연 개수

### 카테고리별 할 일 개수

```sql
select * from get_todos_by_category(auth.uid());
```

**반환값:**
- `category_name`: 카테고리 이름
- `todo_count`: 할 일 개수

---

## 🔍 인덱스 목록

성능 최적화를 위한 인덱스:

### Users 테이블
- `users_email_idx`: 이메일 검색

### Todos 테이블
- `todos_user_id_idx`: 사용자별 조회
- `todos_created_date_idx`: 생성일순 정렬
- `todos_due_date_idx`: 마감일 검색
- `todos_priority_idx`: 우선순위 필터
- `todos_completed_idx`: 완료 상태 필터
- `todos_category_idx`: 카테고리 검색 (GIN 인덱스)
- `todos_user_completed_idx`: 사용자별 완료 상태 (복합)
- `todos_user_priority_idx`: 사용자별 우선순위 (복합)

---

## 🤖 자동화 트리거

### 1. 사용자 프로필 자동 생성

```sql
handle_new_user()
```

**동작:**
- auth.users에 새 사용자 등록 시
- public.users에 자동으로 프로필 생성
- display_name은 이메일 앞부분 또는 메타데이터에서 추출

### 2. 완료 시각 자동 업데이트

```sql
handle_todo_completed()
```

**동작:**
- 할 일 완료 시 `completed_at`에 현재 시각 기록
- 완료 취소 시 `completed_at`을 null로 설정

### 3. 수정 시각 자동 업데이트

```sql
handle_updated_at()
```

**동작:**
- todos 테이블 업데이트 시
- `updated_at`에 현재 시각 자동 기록

---

## 📝 샘플 데이터 삽입 (테스트용)

### 사용자 생성 후 할 일 추가

```sql
-- 1. 먼저 Supabase Auth를 통해 사용자 생성 (앱에서 회원가입)
-- 2. 로그인 후 다음 쿼리 실행

insert into public.todos (user_id, title, description, priority, category, due_date)
values
  (auth.uid(), '프로젝트 기획서 작성', '2026년 1분기 신규 프로젝트 기획서 초안 작성', 'high', array['업무'], now() + interval '5 days'),
  (auth.uid(), '운동하기', '헬스장에서 1시간 운동', 'medium', array['개인', '운동'], now() + interval '1 day'),
  (auth.uid(), 'Next.js 공부', 'App Router 문서 읽고 실습하기', 'high', array['학습'], now() + interval '3 days');
```

---

## 🔧 마이그레이션

### 스키마 변경 시

1. 새로운 마이그레이션 파일 생성
```sql
-- supabase/migrations/001_add_column.sql
alter table public.todos 
add column if not exists tags text[];
```

2. SQL Editor에서 실행

### 롤백

```sql
-- 테이블 삭제 (주의!)
drop table if exists public.todos cascade;
drop table if exists public.users cascade;

-- 함수 삭제
drop function if exists handle_new_user() cascade;
drop function if exists handle_todo_completed() cascade;
drop function if exists handle_updated_at() cascade;
drop function if exists get_todo_stats(uuid);
drop function if exists get_todos_by_category(uuid);
```

---

## 🐛 문제 해결

### RLS 정책이 작동하지 않음

**확인 사항:**
1. RLS가 활성화되었는지 확인
   ```sql
   select tablename, rowsecurity 
   from pg_tables 
   where schemaname = 'public';
   ```

2. 정책이 올바르게 생성되었는지 확인
   ```sql
   select * from pg_policies where schemaname = 'public';
   ```

3. 사용자가 로그인했는지 확인
   ```sql
   select auth.uid(); -- null이 아니어야 함
   ```

### 트리거가 작동하지 않음

**확인:**
```sql
select trigger_name, event_manipulation, event_object_table
from information_schema.triggers
where trigger_schema = 'public';
```

### 인덱스 성능 확인

```sql
-- 쿼리 실행 계획 확인
explain analyze
select * from todos where user_id = auth.uid() order by created_date desc;
```

---

## 📚 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

---

## ✅ 체크리스트

설치 완료 확인:
- [ ] Supabase 프로젝트 생성
- [ ] schema.sql 실행 완료
- [ ] users 테이블 생성 확인
- [ ] todos 테이블 생성 확인
- [ ] RLS 정책 활성화 확인
- [ ] 트리거 생성 확인
- [ ] 인덱스 생성 확인
- [ ] 환경 변수 설정 (`.env.local`)
- [ ] Supabase 클라이언트 초기화 (`lib/supabase/*`)

---

**이제 Next.js 앱에서 Supabase를 사용할 준비가 완료되었습니다!** 🎉
