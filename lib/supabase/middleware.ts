/**
 * Middleware용 Supabase 클라이언트
 * Next.js Middleware에서 인증 상태를 확인하고 세션을 갱신
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Supabase 인증 미들웨어
 * @param request - Next.js 요청 객체
 * @returns Next.js 응답 객체
 */
export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 세션 갱신 - 이 작업은 인증 토큰을 자동으로 갱신합니다
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return supabaseResponse;
};
