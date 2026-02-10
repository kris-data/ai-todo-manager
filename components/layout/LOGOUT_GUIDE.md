# 로그아웃 기능 가이드

Header 컴포넌트에 Supabase 로그아웃 기능이 완전히 구현되었습니다.

## ✅ 구현된 기능

### 1. Supabase signOut 호출

```typescript
const supabase = createClient();
const { error } = await supabase.auth.signOut();
```

**특징:**
- ✅ 클라이언트 사이드 Supabase 클라이언트 사용
- ✅ 세션 완전 제거
- ✅ 쿠키 삭제

---

### 2. 로그아웃 성공 시 처리

```typescript
if (!error) {
  console.log('로그아웃 성공');
  
  toast.success('로그아웃 완료', {
    description: '안전하게 로그아웃되었습니다.',
  });

  // 로그인 페이지로 리다이렉트
  router.push('/login');
  router.refresh(); // 서버 컴포넌트 새로고침
}
```

**동작:**
- ✅ 성공 토스트 메시지 표시
- ✅ 로그인 페이지(`/login`)로 리다이렉트
- ✅ 서버 컴포넌트 새로고침으로 사용자 정보 제거
- ✅ 세션이 완전히 제거됨

**토스트 메시지:**
```
✓ 로그아웃 완료
안전하게 로그아웃되었습니다.
```

---

### 3. 로그아웃 실패 시 처리

```typescript
if (error) {
  console.error('로그아웃 오류:', error);
  
  toast.error('로그아웃 실패', {
    description: '로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.',
  });
  return;
}
```

**에러 토스트 메시지:**
```
✗ 로그아웃 실패
로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.
```

**예외 처리:**
```typescript
catch (err) {
  console.error('로그아웃 오류:', err);
  
  toast.error('로그아웃 실패', {
    description: '예기치 않은 오류가 발생했습니다.',
  });
}
```

---

### 4. 로딩 상태 처리

#### 상태 관리
```typescript
const [isLoggingOut, setIsLoggingOut] = useState(false);
```

#### UI 표시
```tsx
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
```

**효과:**
- ✅ 로그아웃 중 메뉴 아이템 비활성화
- ✅ 회전하는 스피너 아이콘
- ✅ "로그아웃 중..." 텍스트
- ✅ 중복 클릭 방지

---

## 🎯 UI 위치

### Header 드롭다운 메뉴

```
┌──────────────────────────┐
│ 👤 김개발                │
│    dev@example.com       │
├──────────────────────────┤
│ 👤 프로필                │
├──────────────────────────┤
│ 🚪 로그아웃              │ ← 여기
└──────────────────────────┘
```

**접근 방법:**
1. 우측 상단 아바타 클릭
2. 드롭다운 메뉴 열림
3. "로그아웃" 항목 클릭

---

## 🚀 사용 흐름

### 정상 흐름

```
1. 사용자가 Header 아바타 클릭
   ↓
2. 드롭다운 메뉴 열림
   ↓
3. "로그아웃" 클릭
   ↓
4. 로딩 시작 (스피너 표시, 메뉴 비활성화)
   ↓
5. Supabase signOut 호출
   ↓
6. 세션 제거 확인
   ↓
7. 성공 토스트 메시지
   ↓
8. 로그인 페이지(/login)로 리다이렉트
```

### 오류 발생 시

```
1. "로그아웃" 클릭
   ↓
2. Supabase signOut 호출
   ↓
3. 오류 발생
   ↓
4. 에러 토스트 메시지 표시
   ↓
5. 로딩 종료, 재시도 가능
   ↓
6. 페이지 이동 없음 (현재 페이지 유지)
```

---

## 🎨 Header 컴포넌트 Props

```typescript
interface HeaderProps {
  userName?: string;       // 사용자 이름 (기본: '사용자')
  userEmail?: string;      // 사용자 이메일
  onLogout?: () => void;   // 커스텀 로그아웃 핸들러 (선택)
}
```

### 기본 사용 (Supabase 자동)

```tsx
<Header
  userName="김개발"
  userEmail="dev@example.com"
/>
```
- ✅ 내장된 Supabase 로그아웃 사용
- ✅ 토스트 메시지 표시
- ✅ 로그인 페이지로 이동

### 커스텀 핸들러 사용

```tsx
<Header
  userName="김개발"
  userEmail="dev@example.com"
  onLogout={async () => {
    // 커스텀 로그아웃 로직
    await customLogout();
  }}
/>
```
- ✅ 커스텀 핸들러가 우선
- ✅ 기본 Supabase 로직 대체

---

## 🔐 세션 제거 확인

### 로그아웃 전
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log(session); // { access_token: '...', user: {...} }
```

### 로그아웃 후
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log(session); // null
```

**효과:**
- ✅ 쿠키에서 세션 토큰 제거
- ✅ 로컬 스토리지 클리어
- ✅ 모든 인증 상태 초기화

---

## 📱 Toast 알림 (Sonner)

### 성공 메시지

```typescript
toast.success('로그아웃 완료', {
  description: '안전하게 로그아웃되었습니다.',
});
```

**화면 표시:**
```
┌─────────────────────────────┐
│ ✓ 로그아웃 완료              │
│ 안전하게 로그아웃되었습니다.  │
└─────────────────────────────┘
```

### 에러 메시지

```typescript
toast.error('로그아웃 실패', {
  description: '로그아웃 중 오류가 발생했습니다.',
});
```

**화면 표시:**
```
┌─────────────────────────────┐
│ ✗ 로그아웃 실패              │
│ 로그아웃 중 오류가 발생...    │
└─────────────────────────────┘
```

---

## 🔧 Layout에 Toaster 추가

`app/layout.tsx`에 Toaster 컴포넌트가 추가되었습니다:

```tsx
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Toaster />  {/* ← 여기 */}
      </body>
    </html>
  );
}
```

**필수 사항:**
- ✅ Toaster는 전역에서 한 번만 선언
- ✅ body 태그 내부에 위치
- ✅ 모든 페이지에서 toast 사용 가능

---

## 🧪 테스트 시나리오

### 정상 케이스

1. [ ] 로그인 상태에서 Header 아바타 클릭
2. [ ] 드롭다운 메뉴 열림
3. [ ] "로그아웃" 클릭
4. [ ] ✅ 스피너 표시, "로그아웃 중..." 텍스트
5. [ ] ✅ 성공 토스트 메시지
6. [ ] ✅ 로그인 페이지로 리다이렉트

### 세션 제거 확인

1. [ ] 개발자 도구 → Application → Cookies
2. [ ] Supabase 세션 쿠키 확인
3. [ ] 로그아웃 클릭
4. [ ] ✅ 쿠키 삭제 확인

### 로딩 상태

1. [ ] 로그아웃 클릭
2. [ ] ✅ 메뉴 아이템 비활성화
3. [ ] ✅ 스피너 회전
4. [ ] ✅ "로그아웃 중..." 텍스트
5. [ ] ✅ 중복 클릭 불가

### 에러 처리 (네트워크 끊김 시뮬레이션)

1. [ ] 개발자 도구 → Network → Offline
2. [ ] 로그아웃 클릭
3. [ ] ❌ 에러 토스트 메시지
4. [ ] ✅ 페이지 유지 (이동 안 함)
5. [ ] ✅ 재시도 가능

---

## 🎯 보안 고려사항

### 1. 세션 완전 제거

```typescript
await supabase.auth.signOut();
```
- ✅ 모든 디바이스에서 로그아웃 (기본)
- ✅ 리프레시 토큰도 무효화

### 2. 서버 컴포넌트 새로고침

```typescript
router.refresh();
```
- ✅ 서버에서 사용자 정보 다시 확인
- ✅ 보호된 페이지 접근 차단

### 3. 클라이언트 상태 초기화

```typescript
router.push('/login');
```
- ✅ 로그인 페이지로 강제 이동
- ✅ 이전 페이지 히스토리 대체

---

## 📚 추가 기능 (향후)

### 모든 디바이스에서 로그아웃

```typescript
const { error } = await supabase.auth.signOut({ scope: 'global' });
```

### 확인 다이얼로그 추가

```tsx
const handleLogout = async () => {
  const confirmed = confirm('정말 로그아웃하시겠습니까?');
  if (!confirmed) return;
  
  // 로그아웃 로직
};
```

---

## ✅ 체크리스트

구현 완료:
- [x] Supabase signOut 호출
- [x] 세션 제거 확인
- [x] 성공 토스트 메시지
- [x] 에러 토스트 메시지
- [x] 로그인 페이지 리다이렉트
- [x] 서버 컴포넌트 새로고침
- [x] 로딩 스피너 및 텍스트
- [x] 메뉴 아이템 비활성화
- [x] 중복 클릭 방지
- [x] 예외 처리
- [x] Toaster 전역 설정
- [x] 커스텀 핸들러 지원
- [x] Linter 오류 없음

---

## 🎉 완료!

로그아웃 기능이 완전히 작동합니다!

**사용 방법:**
1. Header 컴포넌트 import
2. 사용자 정보 전달
3. 로그아웃 버튼 자동으로 작동
4. 토스트 메시지 자동으로 표시
