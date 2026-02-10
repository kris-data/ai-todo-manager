# Layout 컴포넌트

애플리케이션 레이아웃을 구성하는 컴포넌트 모음입니다.

## 컴포넌트 목록

### Header

애플리케이션 상단 헤더 컴포넌트입니다.

**주요 기능:**
- 🎨 서비스 로고 및 이름 표시
- 👤 사용자 정보 표시 (아바타, 이름, 이메일)
- 🚪 로그아웃 버튼
- 📱 반응형 디자인
- 🎯 Sticky 헤더 (스크롤 시 상단 고정)

**Props:**
```typescript
interface HeaderProps {
  userName?: string;      // 사용자 이름 (기본값: "사용자")
  userEmail?: string;     // 사용자 이메일
  onLogout?: () => void;  // 로그아웃 핸들러
}
```

**사용 예시:**
```tsx
<Header
  userName="김개발"
  userEmail="dev@example.com"
  onLogout={() => {
    // 로그아웃 로직
    supabase.auth.signOut();
  }}
/>
```

**컴포넌트 구조:**
```
┌─────────────────────────────────────────┐
│ 🔲 AI Todo           👤 [사용자 메뉴]    │
│    똑똑한 할 일 관리                      │
└─────────────────────────────────────────┘
```

---

### Toolbar

검색, 필터, 정렬 기능을 제공하는 툴바 컴포넌트입니다.

**주요 기능:**
- 🔍 할 일 검색
- 🏷️ 상태 필터 (진행 중/완료됨/지연됨)
- ⭐ 우선순위 필터 (높음/보통/낮음)
- 📊 정렬 (우선순위/마감일/생성일순)
- 🎯 활성 필터 표시 및 제거

**Props:**
```typescript
interface ToolbarProps {
  searchQuery: string;                       // 검색어
  onSearchChange: (query: string) => void;   // 검색 변경 핸들러
  selectedStatus: string[];                  // 선택된 상태 필터
  onStatusChange: (status: string[]) => void;// 상태 변경 핸들러
  selectedPriorities: string[];              // 선택된 우선순위 필터
  onPriorityChange: (priorities: string[]) => void; // 우선순위 변경 핸들러
  sortBy: string;                            // 정렬 기준
  onSortChange: (sort: string) => void;      // 정렬 변경 핸들러
}
```

**사용 예시:**
```tsx
const [searchQuery, setSearchQuery] = useState('');
const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
const [sortBy, setSortBy] = useState('priority');

<Toolbar
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  selectedStatus={selectedStatus}
  onStatusChange={setSelectedStatus}
  selectedPriorities={selectedPriorities}
  onPriorityChange={setSelectedPriorities}
  sortBy={sortBy}
  onSortChange={setSortBy}
/>
```

**필터 값:**

**상태 필터:**
- `'incomplete'` - 진행 중
- `'completed'` - 완료됨
- `'overdue'` - 지연됨

**우선순위 필터:**
- `'high'` - 높음
- `'medium'` - 보통
- `'low'` - 낮음

**정렬 옵션:**
- `'priority'` - 우선순위순
- `'dueDate'` - 마감일순
- `'createdDate'` - 생성일순

**컴포넌트 구조:**
```
┌──────────────────────────────────────────────────┐
│ 🔍 [검색...] [필터 3] [정렬 ▼]                    │
│                                                  │
│ 활성 필터: [진행 중 ×] [높음 ×] [보통 ×]           │
└──────────────────────────────────────────────────┘
```

---

## 메인 페이지 통합 예시

```tsx
'use client';

import { useState } from 'react';
import { Header, Toolbar } from '@/components/layout';
import { TodoList, TodoForm } from '@/components/todo';
import { Todo } from '@/types/todo';

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('priority');

  // 필터링 및 정렬 로직
  const getFilteredTodos = () => {
    let filtered = [...todos];

    // 검색
    if (searchQuery) {
      filtered = filtered.filter(
        (todo) =>
          todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          todo.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 상태 필터
    if (selectedStatus.length > 0) {
      filtered = filtered.filter((todo) => {
        const now = new Date();
        const isOverdue = todo.due_date && new Date(todo.due_date) < now && !todo.completed;

        if (selectedStatus.includes('completed') && todo.completed) return true;
        if (selectedStatus.includes('incomplete') && !todo.completed && !isOverdue) return true;
        if (selectedStatus.includes('overdue') && isOverdue) return true;

        return false;
      });
    }

    // 우선순위 필터
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter((todo) =>
        selectedPriorities.includes(todo.priority)
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'dueDate':
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'createdDate':
          return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        userName="김개발"
        userEmail="dev@example.com"
        onLogout={() => console.log('로그아웃')}
      />

      <Toolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedPriorities={selectedPriorities}
        onPriorityChange={setSelectedPriorities}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <main className="container px-4 py-6">
        {/* 할 일 목록 */}
        <TodoList
          todos={getFilteredTodos()}
          onToggle={(id, completed) => {
            setTodos(todos.map(t => t.id === id ? { ...t, completed } : t));
          }}
        />
      </main>
    </div>
  );
}
```

---

## 스타일링

### Header
- **Sticky 헤더**: `sticky top-0 z-50`
- **Backdrop blur**: 스크롤 시 반투명 효과
- **높이**: `h-16` (64px)

### Toolbar
- **Border**: 하단 경계선
- **Backdrop blur**: 반투명 효과
- **Padding**: `py-4` (16px)

---

## 접근성 (Accessibility)

### Header
- ✅ `button` 태그로 올바른 시맨틱 사용
- ✅ Avatar에 Fallback 제공
- ✅ 드롭다운 메뉴 키보드 네비게이션

### Toolbar
- ✅ 검색 Input에 placeholder
- ✅ 필터 체크박스 명확한 라벨
- ✅ 활성 필터 제거 버튼
- ✅ Select 컴포넌트 키보드 접근

---

## 반응형 디자인

### Header
- 모바일: 로고와 사용자 메뉴 양끝 배치
- 데스크톱: 동일 레이아웃

### Toolbar
- 모바일: 세로 스택 (`flex-col`)
- 데스크톱: 가로 배치 (`md:flex-row`)
- 검색창: 최대 너비 제한 (`max-w-md`)

---

## 향후 개선 사항

- [ ] Header에 알림 기능 추가
- [ ] Toolbar에 커스텀 필터 저장 기능
- [ ] 다크 모드 토글 버튼
- [ ] 키보드 단축키 지원
- [ ] 모바일 햄버거 메뉴
