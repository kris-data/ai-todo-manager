# 회원가입 페이지 - Supabase 연동

Supabase Auth를 활용한 회원가입 기능이 완전히 구현되었습니다.

## ✅ 구현된 기능

### 1. 폼 데이터 수집 및 유효성 검사

#### 이메일 검증
```typescript
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```
- ✅ 정규식을 사용한 이메일 형식 검증
- ✅ 유효하지 않은 경우 "올바른 이메일 형식을 입력해주세요." 메시지 표시

#### 비밀번호 검증
- ✅ **최소 길이**: 6자 이상
- ✅ **일치 확인**: 비밀번호와 비밀번호 확인 일치 여부
- ✅ **HTML5 검증**: `minLength={6}` 속성 사용

#### 약관 동의 검증
- ✅ 체크박스 필수 확인
- ✅ 동의하지 않으면 버튼 비활성화

---

### 2. Supabase signUp 호출

```typescript
const supabase = createClient();

const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      display_name: email.split('@')[0], // 기본 이름 설정
    },
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

**특징:**
- ✅ 클라이언트 사이드 Supabase 클라이언트 사용
- ✅ 사용자 메타데이터에 `display_name` 자동 설정
- ✅ 이메일 인증 콜백 URL 설정

---

### 3. 성공 시 처리

#### 이메일 인증이 필요한 경우 (기본)
```typescript
if (data.user && !data.session) {
  setNeedsEmailConfirmation(true);
  // 3초 후 로그인 페이지로 이동
  setTimeout(() => {
    router.push('/login');
  }, 3000);
}
```

**화면 메시지:**
```
🎉
회원가입이 완료되었습니다!
example@email.com로 인증 이메일을 발송했습니다.
이메일을 확인하여 계정을 활성화한 후 로그인해주세요.
잠시 후 로그인 페이지로 자동 이동됩니다...
```

#### 이메일 인증이 불필요한 경우 (개발 환경)
```typescript
if (data.session) {
  // 메인 페이지로 이동
  setTimeout(() => {
    router.push('/');
  }, 2000);
}
```

**화면 메시지:**
```
🎉
회원가입이 완료되었습니다!
메인 페이지로 이동합니다.
잠시만 기다려주세요...
```

---

### 4. 실패 시 처리

#### 사용자 친화적 오류 메시지

Supabase의 기술적 오류를 한글로 변환:

| Supabase 오류 | 사용자 메시지 |
|--------------|-------------|
| `already registered` | 이미 가입된 이메일입니다. 로그인 페이지로 이동해주세요. |
| `Password` 관련 | 비밀번호가 너무 약합니다. 더 강력한 비밀번호를 사용해주세요. |
| `Email` 관련 | 유효하지 않은 이메일 주소입니다. |
| `rate limit` | 너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요. |
| 기타 | 회원가입 중 오류가 발생했습니다. |

```typescript
if (signUpError.message.includes('already registered')) {
  errorMessage = '이미 가입된 이메일입니다. 로그인 페이지로 이동해주세요.';
}
```

#### Alert 컴포넌트로 표시
```tsx
{error && (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

---

### 5. 로딩 상태 처리

#### 버튼 비활성화
```typescript
disabled={isLoading || !agreedToTerms}
```
- ✅ 제출 중 중복 클릭 방지
- ✅ 약관 미동의 시 버튼 비활성화

#### 로딩 스피너 및 텍스트
```tsx
{isLoading ? (
  <>
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    가입 중...
  </>
) : (
  '회원가입'
)}
```

**효과:**
- ✅ 회전하는 스피너 아이콘
- ✅ "가입 중..." 텍스트 표시
- ✅ 시각적 피드백 제공

#### 입력 필드 비활성화
```tsx
disabled={isLoading}
```
- ✅ 모든 입력 필드 비활성화
- ✅ 제출 중 데이터 변경 방지

---

## 🎨 UI 변경 사항 (최소한)

### 1. Loader2 아이콘 추가
```typescript
import { CheckSquare, ArrowLeft, Loader2 } from 'lucide-react';
```
- 로딩 스피너용 아이콘

### 2. useRouter 추가
```typescript
import { useRouter } from 'next/navigation';
const router = useRouter();
```
- 회원가입 성공 후 페이지 이동

### 3. Supabase 클라이언트 import
```typescript
import { createClient } from '@/lib/supabase/client';
```

### 4. needsEmailConfirmation 상태 추가
```typescript
const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
```
- 이메일 인증 필요 여부 표시

---

## 🚀 사용 흐름

### 정상 흐름 (이메일 인증 필요)

```
1. 사용자 입력
   ↓
2. 유효성 검증 (이메일, 비밀번호, 약관)
   ↓
3. 로딩 시작 (버튼 비활성화, 스피너 표시)
   ↓
4. Supabase signUp 호출
   ↓
5. 성공 메시지 표시
   - "인증 이메일을 발송했습니다"
   ↓
6. 3초 후 로그인 페이지로 이동
```

### 이메일 인증 불필요 (개발 환경)

```
1. 사용자 입력
   ↓
2. 유효성 검증
   ↓
3. Supabase signUp 호출
   ↓
4. 즉시 세션 생성됨
   ↓
5. 2초 후 메인 페이지로 이동
```

### 오류 발생 시

```
1. 사용자 입력
   ↓
2. Supabase signUp 호출
   ↓
3. 오류 발생
   ↓
4. 사용자 친화적 메시지 표시
   ↓
5. 로딩 종료, 재시도 가능
```

---

## 🔧 Supabase 설정

### 이메일 인증 설정

**Supabase 대시보드:**
1. **Authentication** → **Providers** → **Email**
2. **Confirm email** 옵션 확인
   - ✅ 활성화: 이메일 인증 필요
   - ❌ 비활성화: 즉시 로그인 가능

### 이메일 템플릿 커스터마이징

**Supabase 대시보드:**
1. **Authentication** → **Email Templates**
2. **Confirm signup** 템플릿 수정
3. 한글 메시지로 변경 가능

---

## 🐛 문제 해결

### 1. 이메일이 발송되지 않음

**확인 사항:**
- Supabase 프로젝트 설정에서 이메일 제공자 확인
- 스팸 폴더 확인
- 이메일 주소 오타 확인

**개발 환경:**
- Supabase Local Development: 콘솔에서 확인 링크 출력
- 프로덕션: 실제 이메일 발송

### 2. "이미 가입된 이메일" 오류

**해결:**
- 로그인 페이지로 이동
- 비밀번호 찾기 기능 사용

### 3. "비밀번호가 너무 약함" 오류

**해결:**
- 영문 대소문자, 숫자, 특수문자 포함
- 8자 이상 권장

---

## 📝 테스트 시나리오

### 정상 케이스

1. [ ] 유효한 이메일과 비밀번호로 회원가입 성공
2. [ ] 이메일 인증 메시지 확인
3. [ ] 3초 후 로그인 페이지로 자동 이동

### 유효성 검증

1. [ ] 잘못된 이메일 형식 → 오류 메시지
2. [ ] 비밀번호 6자 미만 → 오류 메시지
3. [ ] 비밀번호 불일치 → 오류 메시지
4. [ ] 약관 미동의 → 버튼 비활성화

### 오류 처리

1. [ ] 중복 이메일 → "이미 가입된 이메일" 메시지
2. [ ] 네트워크 오류 → "예기치 않은 오류" 메시지
3. [ ] Rate limit → "너무 많은 시도" 메시지

### 로딩 상태

1. [ ] 제출 중 버튼 비활성화
2. [ ] 스피너 아이콘 표시
3. [ ] "가입 중..." 텍스트 표시
4. [ ] 입력 필드 비활성화

---

## 🎉 완료!

회원가입 기능이 완전히 구현되었습니다.

**다음 단계:**
- 로그인 페이지에도 Supabase 연동
- 이메일 인증 콜백 페이지 구현 (`/auth/callback`)
- 비밀번호 찾기 기능 추가
