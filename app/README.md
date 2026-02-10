# AI Todo Manager - 메인 애플리케이션

## 📋 페이지 구조

### 메인 페이지 (`page.tsx`)

할 일 관리 대시보드입니다.

**URL:** `http://localhost:3000/`

---

## 🎨 레이아웃 구성

```
┌──────────────────────────────────────────────────┐
│  Header: 로고 | 사용자 정보 | 로그아웃             │
├──────────────────────────────────────────────────┤
│  Toolbar: 🔍 검색 | 🏷️ 필터 | 📊 정렬           │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │ 할 일 추가   │  │   할 일 목록               │  │
│  │             │  │                          │  │
│  │ [폼 입력]   │  │   ◻️ 할 일 1 (높음)       │  │
│  │             │  │   ◻️ 할 일 2 (보통)       │  │
│  │             │  │   ✅ 할 일 3 (완료)       │  │
│  │             │  │                          │  │
│  │ [AI 생성]   │  │                          │  │
│  │             │  │                          │  │
│  │ [통계]      │  │                          │  │
│  └─────────────┘  └──────────────────────────┘  │
│   (좌측 1/3)          (우측 2/3)                │
└──────────────────────────────────────────────────┘
```

---

## 🧩 컴포넌트 계층

```
Home (app/page.tsx)
├── Header (components/layout/Header.tsx)
│   ├── 로고 및 서비스 이름
│   └── 사용자 드롭다운 메뉴
│       ├── 프로필
│       └── 로그아웃
│
├── Toolbar (components/layout/Toolbar.tsx)
│   ├── 검색 Input
│   ├── 필터 Dropdown
│   │   ├── 상태 (진행 중/완료/지연)
│   │   └── 우선순위 (높음/보통/낮음)
│   └── 정렬 Select
│
└── Main Area
    ├── 좌측 (lg:col-span-1)
    │   ├── TodoForm (할 일 추가)
    │   ├── AI 생성 버튼 (준비 중)
    │   └── 통계 카드
    │
    └── 우측 (lg:col-span-2)
        └── TodoList
            └── TodoCard (각 할 일)
```

---

## 📦 주요 기능

### 1. 할 일 관리 (CRUD)

**생성 (Create)**
```typescript
const handleCreateTodo = (data: CreateTodoInput) => {
  const newTodo: Todo = {
    ...data,
    id: crypto.randomUUID(),
    user_id: 'user-1',
    created_date: new Date(),
    completed: false,
  };
  setTodos([newTodo, ...todos]);
};
```

**조회 (Read)**
- 필터링 및 정렬이 적용된 목록 표시
- 검색어 매칭

**수정 (Update)**
```typescript
const handleUpdateTodo = (data: CreateTodoInput) => {
  setTodos(
    todos.map((todo) =>
      todo.id === editingTodo.id ? { ...todo, ...data } : todo
    )
  );
};
```

**삭제 (Delete)**
```typescript
const handleDeleteTodo = (id: string) => {
  if (confirm('정말 삭제하시겠습니까?')) {
    setTodos(todos.filter((todo) => todo.id !== id));
  }
};
```

---

### 2. 검색

할 일 제목 및 설명에서 부분 일치 검색:

```typescript
filtered = filtered.filter(
  (todo) =>
    todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    todo.description?.toLowerCase().includes(searchQuery.toLowerCase())
);
```

---

### 3. 필터

**상태 필터:**
- `incomplete`: 진행 중 (완료되지 않았고 마감일이 지나지 않음)
- `completed`: 완료됨
- `overdue`: 지연됨 (완료되지 않았고 마감일이 지남)

**우선순위 필터:**
- `high`: 높음 🔴
- `medium`: 보통 🟡
- `low`: 낮음 ⚪

---

### 4. 정렬

**우선순위순** (기본값)
```typescript
const priorityOrder = { high: 0, medium: 1, low: 2 };
return priorityOrder[a.priority] - priorityOrder[b.priority];
```

**마감일순**
```typescript
return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
```

**생성일순** (최신순)
```typescript
return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
```

---

### 5. 통계 표시

- 전체 할 일 개수
- 진행 중 개수
- 완료 개수

---

## 🎯 상태 관리

```typescript
// 할 일 목록
const [todos, setTodos] = useState<Todo[]>(mockTodos);

// 검색 및 필터
const [searchQuery, setSearchQuery] = useState('');
const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
const [sortBy, setSortBy] = useState('priority');

// UI 상태
const [showAddDialog, setShowAddDialog] = useState(false);
const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
```

---

## 📱 반응형 레이아웃

### 데스크톱 (lg 이상)
```css
grid-cols-1 lg:grid-cols-3
```
- 좌측: `lg:col-span-1` (33.33%)
- 우측: `lg:col-span-2` (66.67%)

### 모바일
- 세로 스택 (1단)
- 좌측 영역이 상단에 표시
- 우측 목록이 하단에 표시

---

## 🔄 데이터 흐름

```
사용자 액션
    ↓
이벤트 핸들러 (handle*)
    ↓
상태 업데이트 (setTodos)
    ↓
필터링 및 정렬 (getFilteredAndSortedTodos)
    ↓
컴포넌트 리렌더링
    ↓
UI 업데이트
```

---

## 🗂️ Mock 데이터

```typescript
const mockTodos: Todo[] = [
  {
    id: '1',
    user_id: 'user-1',
    title: '프로젝트 기획서 작성',
    description: '2026년 1분기 신규 프로젝트 기획서 초안 작성',
    created_date: new Date('2026-01-20'),
    due_date: new Date('2026-01-25'),
    priority: 'high',
    category: ['업무'],
    completed: false,
  },
  // ... 더 많은 데이터
];
```

**Mock 데이터 특징:**
- 다양한 우선순위 (high/medium/low)
- 완료/미완료 상태
- 여러 카테고리
- 마감일 설정

---

## 🚀 실행 방법

### 개발 서버 시작
```bash
npm run dev
```

### 브라우저에서 확인
```
http://localhost:3000
```

---

## 🎨 UI/UX 특징

### 1. Sticky Header
- 스크롤 시 상단 고정
- Backdrop blur 효과

### 2. Sticky Sidebar
- 좌측 폼 영역 고정
- 우측 스크롤 가능

### 3. Dialog 수정
- 할 일 수정 시 다이얼로그 팝업
- 최대 높이 제한 및 스크롤

### 4. 빈 상태 UI
- 할 일이 없을 때 안내 메시지
- 할 일 추가 유도

---

## 🔧 향후 구현 사항

### Supabase 연동
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 할 일 조회
const { data, error } = await supabase
  .from('todos')
  .select('*')
  .order('created_date', { ascending: false });

// 할 일 생성
const { data, error } = await supabase
  .from('todos')
  .insert([newTodo]);

// 할 일 수정
const { data, error } = await supabase
  .from('todos')
  .update({ completed: true })
  .eq('id', todoId);

// 할 일 삭제
const { data, error } = await supabase
  .from('todos')
  .delete()
  .eq('id', todoId);
```

### AI 기능
- AI 자연어 할 일 생성
- AI 일일/주간 요약

### 추가 기능
- 카테고리 필터
- 마감일 알림
- 드래그 앤 드롭 정렬
- 대량 작업 (일괄 삭제/완료)

---

## 📂 파일 구조

```
app/
├── page.tsx                    # 메인 페이지
├── login/
│   └── page.tsx               # 로그인
├── signup/
│   └── page.tsx               # 회원가입
└── layout.tsx                  # 루트 레이아웃

components/
├── todo/                       # Todo 관련 컴포넌트
│   ├── TodoCard.tsx
│   ├── TodoList.tsx
│   ├── TodoForm.tsx
│   └── index.ts
├── layout/                     # 레이아웃 컴포넌트
│   ├── Header.tsx
│   ├── Toolbar.tsx
│   └── index.ts
└── ui/                         # Shadcn/ui 컴포넌트

types/
└── todo.ts                     # 타입 정의
```

---

## ✅ 체크리스트

구현 완료:
- [x] Header 컴포넌트
- [x] Toolbar 컴포넌트
- [x] TodoForm 통합
- [x] TodoList 통합
- [x] 검색 기능
- [x] 필터 기능 (상태, 우선순위)
- [x] 정렬 기능
- [x] CRUD 핸들러
- [x] Mock 데이터
- [x] 반응형 레이아웃
- [x] 통계 표시

구현 예정:
- [ ] Supabase Auth 연동
- [ ] Supabase DB 연동
- [ ] AI 할 일 생성
- [ ] AI 요약 기능
- [ ] 카테고리 필터
- [ ] 알림 기능
