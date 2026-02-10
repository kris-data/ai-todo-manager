/**
 * 클라이언트 컴포넌트용 Supabase 클라이언트
 * 브라우저 환경에서 실행되는 컴포넌트에서 사용
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * 클라이언트 사이드 Supabase 클라이언트 생성
 * @returns Supabase 클라이언트 인스턴스
 */
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
};
