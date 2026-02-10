/**
 * Supabase 인증 콜백 라우트
 * 이메일 인증 링크 클릭 시 처리
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 인증 콜백 GET 요청 처리
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();

    // 코드를 세션으로 교환
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('인증 코드 교환 오류:', error);
      // 오류 발생 시 로그인 페이지로 리다이렉트 (에러 메시지 포함)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('이메일 인증에 실패했습니다.')}`
      );
    }
  }

  // 인증 성공 시 메인 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/`);
}
