/**
 * 회원가입 페이지
 * Supabase Auth를 활용한 이메일/비밀번호 회원가입
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckSquare, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/lib/supabase/client';

/**
 * 회원가입 페이지 컴포넌트
 */
const SignupPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  /**
   * 이메일 형식 유효성 검증
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * 회원가입 폼 제출 핸들러
   */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setNeedsEmailConfirmation(false);

    // 이메일 형식 검증
    if (!validateEmail(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // 비밀번호 일치 확인
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 길이 확인
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    // 약관 동의 확인
    if (!agreedToTerms) {
      setError('이용약관 및 개인정보처리방침에 동의해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Supabase 회원가입
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: email.split('@')[0], // 이메일 앞부분을 기본 이름으로 사용
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        // Supabase 오류를 사용자 친화적인 메시지로 변환
        let errorMessage = '회원가입 중 오류가 발생했습니다.';

        if (signUpError.message.includes('already registered')) {
          errorMessage = '이미 가입된 이메일입니다. 로그인 페이지로 이동해주세요.';
        } else if (signUpError.message.includes('Password')) {
          errorMessage = '비밀번호가 너무 약합니다. 더 강력한 비밀번호를 사용해주세요.';
        } else if (signUpError.message.includes('Email')) {
          errorMessage = '유효하지 않은 이메일 주소입니다.';
        } else if (signUpError.message.includes('rate limit')) {
          errorMessage = '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
        }

        setError(errorMessage);
        console.error('회원가입 오류:', signUpError);
        return;
      }

      // 회원가입 성공
      setSuccess(true);

      // 이메일 인증이 필요한 경우
      if (data.user && !data.session) {
        setNeedsEmailConfirmation(true);
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else if (data.session) {
        // 이메일 인증 없이 바로 로그인된 경우 (개발 환경 등)
        // 메인 페이지로 이동
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (err) {
      setError('회원가입 중 예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.');
      console.error('회원가입 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          {/* 로고 및 뒤로가기 */}
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              로그인으로
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-lg">AI Todo</span>
            </div>
          </div>

          <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
          <CardDescription>
            무료로 계정을 만들고 AI 할 일 관리를 시작하세요
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            // 성공 메시지
            <Alert className="bg-accent/10 border-accent">
              <AlertDescription className="text-center py-4">
                <div className="text-4xl mb-2">🎉</div>
                <p className="font-semibold mb-1">회원가입이 완료되었습니다!</p>
                {needsEmailConfirmation ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>{email}</strong>로 인증 이메일을 발송했습니다.
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      이메일을 확인하여 계정을 활성화한 후 로그인해주세요.
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                      잠시 후 로그인 페이지로 자동 이동됩니다...
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-1">
                      메인 페이지로 이동합니다.
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                      잠시만 기다려주세요...
                    </p>
                  </>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              {/* 이메일 입력 */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  이메일 <span className="text-destructive">*</span>
                </Label>
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
                <Label htmlFor="password">
                  비밀번호 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="최소 6자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  영문, 숫자를 포함하여 6자 이상 입력하세요
                </p>
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  비밀번호 확인 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>

              {/* 약관 동의 */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    disabled={isLoading}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    <Link
                      href="/terms"
                      className="text-primary hover:underline"
                      target="_blank"
                    >
                      이용약관
                    </Link>
                    {' '}및{' '}
                    <Link
                      href="/privacy"
                      className="text-primary hover:underline"
                      target="_blank"
                    >
                      개인정보처리방침
                    </Link>
                    에 동의합니다. <span className="text-destructive">*</span>
                  </label>
                </div>
              </div>

              {/* 오류 메시지 */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 회원가입 버튼 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !agreedToTerms}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    가입 중...
                  </>
                ) : (
                  '회원가입'
                )}
              </Button>
            </form>
          )}
        </CardContent>

        {!success && (
          <CardFooter className="flex flex-col space-y-4">
            {/* 로그인 링크 */}
            <div className="text-sm text-center text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                로그인
              </Link>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default SignupPage;
