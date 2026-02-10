# 삭제 문제 해결 가이드

## 🐛 문제 상황
할 일을 삭제했지만 Supabase 데이터베이스에서 실제로 삭제되지 않음

## 🔍 원인 분석
주요 원인:
1. **RLS 정책 미적용**: Supabase RLS 정책이 실제로 적용되지 않음
2. **정책 오류**: RLS 정책이 잘못 설정됨
3. **권한 문제**: `auth.uid()`와 `user_id`가 일치하지 않음

## 🛠️ 해결 방법

### 1단계: 브라우저 콘솔에서 에러 확인

1. **브라우저 개발자 도구 열기**
   - Chrome/Edge: `F12` 또는 `Ctrl+Shift+I`
   - 콘솔(Console) 탭 선택

2. **할 일 삭제 시도**
   - 할 일 카드의 삭제 버튼 클릭
   - 확인 창에서 "확인" 클릭

3. **콘솔 메시지 확인**
   - "삭제 시도:" 로그 확인
   - "삭제 결과:" 로그 확인
   - 에러 메시지가 있다면 캡처

### 2단계: Supabase에서 RLS 정책 재설정

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 좌측 메뉴에서 "SQL Editor" 클릭
   - "New query" 클릭

3. **RLS 정책 재설정 스크립트 실행**
   ```sql
   -- supabase/fix-rls-policies.sql 파일의 내용을 복사하여 붙여넣기
   ```

4. **"Run" 버튼 클릭**

5. **결과 확인**
   - 4개의 정책이 생성되었는지 확인
   - 에러가 없는지 확인

### 3단계: 정책 확인

Supabase SQL Editor에서 다음 쿼리 실행:

```sql
-- todos 테이블의 RLS 정책 확인
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'todos';
```

**예상 결과:**
```
policyname                          | operation | using_expression
------------------------------------|-----------|------------------
Users can view own todos            | SELECT    | (auth.uid() = user_id)
Users can create own todos          | INSERT    | 
Users can update own todos          | UPDATE    | (auth.uid() = user_id)
Users can delete own todos          | DELETE    | (auth.uid() = user_id)
```

### 4단계: 사용자 ID 확인

```sql
-- 현재 인증된 사용자 ID 확인
SELECT auth.uid() as current_user_id;

-- todos 테이블의 user_id와 비교
SELECT id, user_id, title 
FROM public.todos 
LIMIT 5;
```

**확인 사항:**
- `auth.uid()`가 `NULL`이 아닌지 확인
- todos의 `user_id`가 `auth.uid()`와 일치하는지 확인

### 5단계: 앱에서 재시도

1. **브라우저 새로고침** (`F5` 또는 `Ctrl+R`)
2. **로그인 상태 확인**
3. **할 일 삭제 재시도**
4. **브라우저 콘솔에서 로그 확인**

## 🔧 고급 문제 해결

### 문제 1: RLS가 비활성화된 경우

```sql
-- RLS 활성화 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'todos';

-- rowsecurity가 false인 경우
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
```

### 문제 2: user_id가 auth.uid()와 다른 경우

이는 데이터 불일치 문제입니다:

```sql
-- 문제가 있는 데이터 찾기
SELECT id, user_id, title
FROM public.todos
WHERE user_id IS NULL 
   OR user_id != auth.uid();

-- 본인 데이터로 수정 (주의: 본인 데이터만 수정 가능)
UPDATE public.todos
SET user_id = auth.uid()
WHERE id = 'your-todo-id';
```

### 문제 3: 정책 충돌

기존 정책과 새 정책이 충돌하는 경우:

```sql
-- 모든 기존 정책 삭제
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'todos'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.todos';
    END LOOP;
END $$;

-- 그 후 fix-rls-policies.sql 재실행
```

## 📊 진단 체크리스트

- [ ] RLS가 활성화되어 있음
- [ ] 4개의 RLS 정책이 존재함 (SELECT, INSERT, UPDATE, DELETE)
- [ ] `auth.uid()`가 NULL이 아님
- [ ] todos의 `user_id`가 `auth.uid()`와 일치함
- [ ] 브라우저 콘솔에 "삭제 결과"가 정상적으로 출력됨
- [ ] 삭제 후 토스트 알림이 표시됨
- [ ] Supabase Table Editor에서 데이터가 실제로 삭제됨

## 🎯 빠른 해결 (요약)

```sql
-- Supabase SQL Editor에서 실행

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "Users can delete own todos" ON public.todos;

-- 2. 새 정책 생성
CREATE POLICY "Users can delete own todos"
  ON public.todos
  FOR DELETE
  USING (auth.uid() = user_id);

-- 3. 확인
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'todos' AND cmd = 'DELETE';
```

## 💡 추가 도움

여전히 문제가 해결되지 않는다면:

1. **브라우저 콘솔 스크린샷** 캡처
2. **Supabase SQL Editor에서 다음 실행:**
   ```sql
   -- 디버깅 정보 수집
   SELECT 
     'Current User' as info,
     auth.uid() as value
   UNION ALL
   SELECT 
     'RLS Enabled',
     rowsecurity::text
   FROM pg_tables
   WHERE tablename = 'todos'
   UNION ALL
   SELECT 
     'Delete Policy Exists',
     count(*)::text
   FROM pg_policies
   WHERE tablename = 'todos' AND cmd = 'DELETE';
   ```
3. **결과를 함께 공유**

## 🎉 해결 확인

삭제가 성공하면:
- ✅ 브라우저 콘솔에 "삭제 결과: { data: [...], error: null }" 출력
- ✅ "할 일 삭제 완료" 토스트 알림 표시
- ✅ 목록에서 항목이 즉시 사라짐
- ✅ Supabase Table Editor에서 데이터가 실제로 삭제됨
- ✅ 페이지 새로고침 후에도 삭제된 상태 유지
