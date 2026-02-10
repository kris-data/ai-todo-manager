# Supabase 클라이언트 설정

Next.js 15 App Router와 Supabase를 연동하기 위한 클라이언트 설정입니다.

## 📁 파일 구조

```
lib/supabase/
├── client.ts       # 클라이언트 컴포넌트용
├── server.ts       # 서버 컴포넌트용
├── middleware.ts   # Middleware용
└── README.md       # 이 문서
```

---

## 🔧 환경 변수

`.env.local` 파일에 다음 환경 변수를 설정해야 합니다:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

---

## 📖 사용 방법

### 1. 클라이언트 컴포넌트

`'use client'` 지시어를 사용하는 컴포넌트에서 사용합니다.

```tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function ClientComponent() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, []);

  return <div>사용자: {user?.email}</div>;
}
```

**주요 사용 사례:**
- 실시간 구독 (Realtime)
- 클라이언트 사이드 인증
- 브라우저에서 직접 데이터 조회/수정

---

### 2. 서버 컴포넌트

기본 서버 컴포넌트에서 사용합니다 (비동기 함수).

```tsx
import { createClient } from '@/lib/supabase/server';

export default async function ServerComponent() {
  const supabase = await createClient();
  
  const { data: todos } = await supabase
    .from('todos')
    .select('*')
    .order('created_date', { ascending: false });

  return (
    <div>
      {todos?.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  );
}
```

**주요 사용 사례:**
- 서버 사이드 렌더링 (SSR)
- 초기 데이터 페칭
- SEO가 중요한 페이지

---

### 3. Server Actions

Form submission 및 서버 액션에서 사용합니다.

```tsx
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createTodo(formData: FormData) {
  const supabase = await createClient();
  
  const title = formData.get('title') as string;
  
  const { error } = await supabase
    .from('todos')
    .insert([{ title }]);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/');
}
```

**주요 사용 사례:**
- 폼 제출 처리
- 데이터 변경 (CRUD)
- 서버 사이드 로직

---

### 4. API 라우트

Route Handler에서 사용합니다.

```tsx
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('todos')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('todos')
    .insert([body]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

**주요 사용 사례:**
- RESTful API 엔드포인트
- 외부 서비스 연동
- Webhook 처리

---

### 5. Middleware (선택 사항)

인증 상태를 확인하고 보호된 라우트를 설정합니다.

`middleware.ts` 파일을 루트에 생성:

```tsx
import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Supabase 세션 업데이트
  const response = await updateSession(request);

  // 인증이 필요한 페이지 보호 (선택 사항)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Middleware에서는 쿠키 설정 불필요
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 로그인하지 않은 사용자를 로그인 페이지로 리다이렉트
  if (!user && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 로그인한 사용자를 대시보드로 리다이렉트
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

## 🔐 인증 예시

### 로그인

```tsx
'use client';

import { createClient } from '@/lib/supabase/client';

const handleLogin = async (email: string, password: string) => {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('로그인 오류:', error.message);
    return;
  }

  console.log('로그인 성공:', data.user);
};
```

### 회원가입

```tsx
'use client';

import { createClient } from '@/lib/supabase/client';

const handleSignup = async (email: string, password: string) => {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('회원가입 오류:', error.message);
    return;
  }

  console.log('회원가입 성공:', data.user);
};
```

### 로그아웃

```tsx
'use client';

import { createClient } from '@/lib/supabase/client';

const handleLogout = async () => {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('로그아웃 오류:', error.message);
    return;
  }

  console.log('로그아웃 성공');
};
```

### 현재 사용자 가져오기

```tsx
// 서버 컴포넌트
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// 클라이언트 컴포넌트
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

---

## 📊 데이터베이스 작업 예시

### 조회 (SELECT)

```tsx
const { data, error } = await supabase
  .from('todos')
  .select('*')
  .eq('user_id', userId)
  .order('created_date', { ascending: false });
```

### 생성 (INSERT)

```tsx
const { data, error } = await supabase
  .from('todos')
  .insert([
    {
      title: '새로운 할 일',
      description: '설명',
      priority: 'high',
      category: ['업무'],
    }
  ])
  .select();
```

### 수정 (UPDATE)

```tsx
const { data, error } = await supabase
  .from('todos')
  .update({ completed: true })
  .eq('id', todoId)
  .select();
```

### 삭제 (DELETE)

```tsx
const { error } = await supabase
  .from('todos')
  .delete()
  .eq('id', todoId);
```

---

## 🔒 Row Level Security (RLS)

Supabase에서 RLS 정책을 설정하여 데이터 접근을 제어합니다.

### 사용자 본인 데이터만 접근 허용

```sql
-- SELECT 정책
CREATE POLICY "Users can view own todos"
ON todos
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT 정책
CREATE POLICY "Users can create own todos"
ON todos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE 정책
CREATE POLICY "Users can update own todos"
ON todos
FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE 정책
CREATE POLICY "Users can delete own todos"
ON todos
FOR DELETE
USING (auth.uid() = user_id);
```

---

## 🚨 주의사항

1. **서버/클라이언트 구분**: 올바른 클라이언트를 사용해야 합니다.
   - 서버 컴포넌트 → `lib/supabase/server.ts`
   - 클라이언트 컴포넌트 → `lib/supabase/client.ts`

2. **비동기 처리**: 서버 클라이언트는 `async`로 생성됩니다.
   ```tsx
   const supabase = await createClient(); // ✅
   const supabase = createClient();       // ❌
   ```

3. **환경 변수**: 반드시 `NEXT_PUBLIC_` 접두사 사용
   - 클라이언트에서 접근 가능하게 하기 위함

4. **쿠키 관리**: @supabase/ssr이 자동으로 처리
   - 세션 토큰을 쿠키에 저장
   - 자동 갱신 지원

---

## 🔗 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js App Router with Supabase](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [@supabase/ssr 패키지](https://github.com/supabase/ssr)
