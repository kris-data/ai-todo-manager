/**
 * 로그인 페이지
 * Supabase Auth를 활용한 이메일/비밀번호 로그인
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckSquare, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';

/**
 * 로그인 페이지 컴포넌트
 */
const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * 이메일 형식 유효성 검증
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * 로그인 폼 제출 핸들러
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 이메일 형식 검증
    if (!validateEmail(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // 비밀번호 공백 방지
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Supabase 로그인
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        // Supabase 오류를 사용자 친화적인 메시지로 변환
        let errorMessage = '로그인 중 오류가 발생했습니다.';

        if (signInError.message.includes('Invalid login credentials')) {
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMessage = '이메일 인증이 필요합니다. 이메일을 확인해주세요.';
        } else if (signInError.message.includes('rate limit')) {
          errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
        } else if (signInError.message.includes('User not found')) {
          errorMessage = '등록되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.';
        }

        setError(errorMessage);
        console.error('로그인 오류:', signInError);
        return;
      }

      // 로그인 성공
      if (data.session) {
        console.log('로그인 성공:', data.user?.email);
        
        // 메인 페이지로 리다이렉트
        router.push('/');
        router.refresh(); // 서버 컴포넌트 새로고침
      }
    } catch (err) {
      setError('로그인 중 예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.');
      console.error('로그인 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* 왼쪽 섹션: 브랜딩 및 소개 */}
      <div className="lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-secondary p-8 lg:p-12 flex flex-col justify-center text-white">
        <div className="max-w-md mx-auto space-y-8">
          {/* 로고 */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
              <CheckSquare className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Todo</h1>
              <p className="text-sm text-white/80">똑똑한 할 일 관리</p>
            </div>
          </div>

          {/* 서비스 소개 */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-3">
                생각보다 실행에 집중하세요
              </h2>
              <p className="text-white/90 text-lg leading-relaxed">
                AI가 도와주는 영리한 할 일 관리로 <br />
                생산성을 한 단계 높여보세요.
              </p>
            </div>

            {/* 주요 기능 */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/10 rounded-lg mt-0.5">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI 자동 생성</h3>
                  <p className="text-sm text-white/80">
                    자연어로 말하면 AI가 구조화된 할 일로 변환
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/10 rounded-lg mt-0.5">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">스마트 관리</h3>
                  <p className="text-sm text-white/80">
                    우선순위, 마감일, 카테고리로 체계적인 관리
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/10 rounded-lg mt-0.5">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">인사이트 제공</h3>
                  <p className="text-sm text-white/80">
                    일일/주간 요약으로 생산성 향상 지원
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 핵심 가치 */}
          <div className="pt-6 border-t border-white/20">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold mb-1">✅</div>
                <p className="text-xs text-white/80">입력 최소화</p>
              </div>
              <div>
                <div className="text-2xl font-bold mb-1">📊</div>
                <p className="text-xs text-white/80">관리 구조화</p>
              </div>
              <div>
                <div className="text-2xl font-bold mb-1">🤖</div>
                <p className="text-xs text-white/80">통찰 자동화</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽 섹션: 로그인 폼 */}
      <div className="lg:w-1/2 p-8 lg:p-12 flex items-center justify-center bg-background">
        <Card className="w-full max-w-md border-none shadow-none lg:shadow-lg lg:border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">로그인</CardTitle>
            <CardDescription>
              이메일과 비밀번호를 입력하여 시작하세요
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* 이메일 입력 */}
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              {/* 비밀번호 입력 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">비밀번호</Label>
                  <Link
                    href="/reset-password"
                    className="text-xs text-primary hover:underline"
                    tabIndex={-1}
                  >
                    비밀번호 찾기
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>

              {/* 오류 메시지 */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 로그인 버튼 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </Button>
            </form>

            {/* 구분선 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  또는
                </span>
              </div>
            </div>

            {/* 소셜 로그인 (향후 확장용) */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 계속하기
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {/* 회원가입 링크 */}
            <div className="text-sm text-center text-muted-foreground">
              아직 계정이 없으신가요?{' '}
              <Link
                href="/signup"
                className="text-primary font-medium hover:underline"
              >
                회원가입
              </Link>
            </div>

            {/* 개인정보처리방침 등 */}
            <div className="text-xs text-center text-muted-foreground">
              로그인 시{' '}
              <Link href="/terms" className="underline hover:text-foreground">
                이용약관
              </Link>
              {' '}및{' '}
              <Link href="/privacy" className="underline hover:text-foreground">
                개인정보처리방침
              </Link>
              에 동의하게 됩니다.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
