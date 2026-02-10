/**
 * 헤더 컴포넌트
 * 서비스 로고, 사용자 정보, 로그아웃 버튼 포함
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, LogOut, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

/**
 * 애플리케이션 헤더
 * @param userName - 사용자 이름
 * @param userEmail - 사용자 이메일
 * @param onLogout - 로그아웃 핸들러 (선택사항, 기본은 Supabase 로그아웃)
 */
export const Header = ({
  userName = '사용자',
  userEmail = 'user@example.com',
  onLogout,
}: HeaderProps) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 사용자 이름의 첫 글자 추출
  const userInitial = userName.charAt(0).toUpperCase();

  /**
   * 로그아웃 핸들러
   */
  const handleLogout = async () => {
    // 커스텀 핸들러가 제공된 경우 사용
    if (onLogout) {
      onLogout();
      return;
    }

    // 기본 Supabase 로그아웃 로직
    setIsLoggingOut(true);

    try {
      const supabase = createClient();

      // Supabase 로그아웃
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('로그아웃 오류:', error);
        
        toast.error('로그아웃 실패', {
          description: '로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.',
        });
        return;
      }

      // 로그아웃 성공
      console.log('로그아웃 성공');
      
      toast.success('로그아웃 완료', {
        description: '안전하게 로그아웃되었습니다.',
      });

      // 로그인 페이지로 리다이렉트
      router.push('/login');
      router.refresh(); // 서버 컴포넌트 새로고침
    } catch (err) {
      console.error('로그아웃 오류:', err);
      
      toast.error('로그아웃 실패', {
        description: '예기치 않은 오류가 발생했습니다.',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* 로고 및 서비스 이름 */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CheckSquare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Todo</h1>
            <p className="text-xs text-muted-foreground">
              똑똑한 할 일 관리
            </p>
          </div>
        </div>

        {/* 사용자 정보 및 로그아웃 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>프로필</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>로그아웃 중...</span>
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃</span>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
