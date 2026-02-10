/**
 * 서버 컴포넌트용 Supabase 클라이언트
 * 서버 사이드에서 실행되는 컴포넌트 및 API 라우트에서 사용
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * 서버 사이드 Supabase 클라이언트 생성
 * @returns Supabase 클라이언트 인스턴스
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // setAll 메서드는 서버 컴포넌트에서 호출될 수 있으며,
            // 이 경우 쿠키 설정이 실패할 수 있습니다.
            // 이는 정상적인 동작이므로 무시합니다.
          }
        },
      },
    }
  );
};
