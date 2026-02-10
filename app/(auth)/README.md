# 인증 페이지

Supabase Auth를 활용한 사용자 인증 페이지입니다.

## 페이지 구성

### 로그인 페이지 (`/login`)

이메일과 비밀번호를 사용한 로그인 페이지입니다.

**주요 기능:**
- ✅ 이메일/비밀번호 입력 폼
- 🔐 비밀번호 찾기 링크
- 🎨 브랜드 소개 섹션 (왼쪽)
- 📱 반응형 디자인
- 🔄 로딩 상태 처리
- ⚠️ 오류 메시지 표시
- 🔗 회원가입 페이지 링크
- 🌐 소셜 로그인 준비 (Google - 향후 활성화)

**화면 구성:**

```
┌─────────────────────────────────────────┐
│ [왼쪽: 브랜딩]  │  [오른쪽: 로그인 폼]    │
│                 │                        │
│ • 로고          │  • 이메일 입력          │
│ • 서비스 소개    │  • 비밀번호 입력        │
│ • 주요 기능     │  • 로그인 버튼          │
│ • 핵심 가치     │  • 회원가입 링크        │
└─────────────────────────────────────────┘
```

**URL:** `http://localhost:3000/login`

---

### 회원가입 페이지 (`/signup`)

새 사용자 등록을 위한 회원가입 페이지입니다.

**주요 기능:**
- ✅ 이메일/비밀번호 입력 폼
- 🔁 비밀번호 확인 입력
- 📋 이용약관 동의 체크박스
- ✔️ 클라이언트 사이드 유효성 검증
- 🎉 가입 완료 성공 메시지
- 🔙 로그인 페이지로 돌아가기
- ⚠️ 오류 처리

**유효성 검증:**
- 비밀번호 최소 6자 이상
- 비밀번호와 비밀번호 확인 일치
- 이용약관 동의 필수

**URL:** `http://localhost:3000/signup`

---

## 디자인 시스템

### 색상 테마
- **Primary (Blue)**: 메인 버튼, 링크
- **Secondary (Violet)**: 그라데이션 배경
- **Accent (Emerald)**: 성공 메시지
- **Destructive (Red)**: 오류 메시지

### 레이아웃
- **로그인**: 2단 레이아웃 (데스크톱) / 1단 (모바일)
- **회원가입**: 센터 정렬 카드

### 컴포넌트 사용
- `Card`, `CardHeader`, `CardContent`, `CardFooter`
- `Input`, `Label`
- `Button`
- `Alert`, `AlertDescription`
- `Checkbox`

---

## 구현 예정 (TODO)

### Supabase Auth 연동

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 로그인 로직

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // 로그인 성공
    router.push('/dashboard');
  } catch (err: any) {
    setError(err.message || '로그인 중 오류가 발생했습니다.');
  } finally {
    setIsLoading(false);
  }
};
```

### 회원가입 로직

```typescript
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    setSuccess(true);
    
    // 이메일 인증 안내
    setTimeout(() => router.push('/login'), 2000);
  } catch (err: any) {
    setError(err.message || '회원가입 중 오류가 발생했습니다.');
  } finally {
    setIsLoading(false);
  }
};
```

---

## 환경 변수 설정

`.env.local` 파일에 Supabase 설정 추가:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 라우팅 구조

```
app/
├── login/
│   └── page.tsx          # 로그인 페이지
├── signup/
│   └── page.tsx          # 회원가입 페이지
├── reset-password/
│   └── page.tsx          # 비밀번호 찾기 (구현 예정)
└── (auth)/
    └── README.md         # 이 문서
```

---

## 접근성 (Accessibility)

- ✅ 적절한 `label`과 `input` 연결
- ✅ `aria-label` 속성 사용
- ✅ 키보드 네비게이션 지원
- ✅ 포커스 관리
- ✅ 오류 메시지 명확한 전달

---

## 보안 고려사항

1. **비밀번호 저장**: Supabase가 자동으로 해시 처리
2. **HTTPS**: 프로덕션 환경에서 필수
3. **CSRF 보호**: Supabase Auth가 자동 처리
4. **Rate Limiting**: Supabase가 기본 제공
5. **이메일 인증**: 가입 후 이메일 확인 권장

---

## 테스트 시나리오

### 로그인
1. [ ] 올바른 이메일/비밀번호로 로그인 성공
2. [ ] 잘못된 비밀번호로 오류 메시지 표시
3. [ ] 빈 필드로 제출 시 유효성 검증
4. [ ] 로딩 중 버튼 비활성화
5. [ ] 회원가입 링크 클릭 시 이동

### 회원가입
1. [ ] 올바른 정보로 회원가입 성공
2. [ ] 비밀번호 불일치 시 오류 메시지
3. [ ] 6자 미만 비밀번호 거부
4. [ ] 약관 미동의 시 제출 불가
5. [ ] 성공 메시지 후 로그인 페이지 이동

---

## 향후 개선 사항

- [ ] 소셜 로그인 (Google, GitHub 등)
- [ ] 비밀번호 재설정 기능
- [ ] 이메일 인증 플로우
- [ ] 로그인 상태 유지 (Remember Me)
- [ ] 2단계 인증 (2FA)
- [ ] OAuth 제공자 추가
