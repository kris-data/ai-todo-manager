-- ============================================
-- RLS 정책 문제 해결 스크립트
-- ============================================
-- 이 스크립트는 todos 테이블의 RLS 정책을 확인하고 재설정합니다.
-- Supabase SQL Editor에서 실행하세요.

-- ============================================
-- 1. 현재 RLS 정책 확인
-- ============================================

-- todos 테이블의 모든 RLS 정책 조회
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'todos';

-- ============================================
-- 2. 기존 정책 삭제 (재설정을 위해)
-- ============================================

-- todos 테이블의 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can create own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can update own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can delete own todos" ON public.todos;

-- 혹시 다른 이름의 정책이 있을 수 있으므로 확인
-- (필요시 위 쿼리 결과를 보고 수동으로 삭제)

-- ============================================
-- 3. RLS 활성화 확인
-- ============================================

-- todos 테이블 RLS 활성화
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. 새로운 RLS 정책 생성
-- ============================================

-- SELECT: 사용자는 자신의 할 일만 조회 가능
CREATE POLICY "Users can view own todos"
  ON public.todos
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: 사용자는 자신의 할 일만 생성 가능
CREATE POLICY "Users can create own todos"
  ON public.todos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: 사용자는 자신의 할 일만 수정 가능
CREATE POLICY "Users can update own todos"
  ON public.todos
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: 사용자는 자신의 할 일만 삭제 가능
CREATE POLICY "Users can delete own todos"
  ON public.todos
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. 정책 재확인
-- ============================================

-- todos 테이블의 모든 RLS 정책 다시 조회
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'todos'
ORDER BY cmd;

-- ============================================
-- 6. 테스트 쿼리 (선택 사항)
-- ============================================

-- 현재 인증된 사용자의 할 일 조회 테스트
-- SELECT * FROM public.todos WHERE user_id = auth.uid();

-- RLS가 활성화되어 있는지 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'todos');

-- ============================================
-- 7. 문제 진단
-- ============================================

-- todos 테이블의 모든 데이터 확인 (RLS 무시 - 관리자만 가능)
-- SELECT id, user_id, title, created_date FROM public.todos;

-- 특정 할 일의 소유자 확인
-- SELECT id, user_id, title FROM public.todos WHERE id = 'your-todo-id';

-- 현재 인증된 사용자 ID 확인
-- SELECT auth.uid();

-- ============================================
-- 완료!
-- ============================================

-- 이제 다시 앱에서 삭제를 시도해보세요.
-- 여전히 문제가 있다면 브라우저 콘솔에서 에러 메시지를 확인하세요.
