# Todo 컴포넌트

할 일 관리를 위한 React 컴포넌트 모음입니다.

## 컴포넌트 목록

### TodoCard

개별 할 일을 표시하는 카드 컴포넌트입니다.

**주요 기능:**
- 할 일 제목 및 설명 표시
- 우선순위 배지 (높음/보통/낮음)
- 카테고리 배지
- 마감일 표시 (오늘, 내일, 지연 등)
- 완료 체크박스
- 수정/삭제 버튼
- 완료 상태에 따른 시각적 피드백

**Props:**
```typescript
interface TodoCardProps {
  todo: Todo;                                      // 표시할 할 일
  onToggle: (id: string, completed: boolean) => void; // 완료 토글
  onEdit?: (todo: Todo) => void;                   // 수정 핸들러
  onDelete?: (id: string) => void;                 // 삭제 핸들러
}
```

**사용 예시:**
```tsx
<TodoCard
  todo={todo}
  onToggle={(id, completed) => updateTodo(id, { completed })}
  onEdit={(todo) => setEditingTodo(todo)}
  onDelete={(id) => deleteTodo(id)}
/>
```

---

### TodoList

할 일 목록을 표시하는 컴포넌트입니다.

**주요 기능:**
- 진행 중 / 완료된 할 일 그룹화
- 로딩 스켈레톤
- 빈 상태 UI
- 각 그룹별 개수 표시

**Props:**
```typescript
interface TodoListProps {
  todos: Todo[];                                   // 할 일 배열
  onToggle: (id: string, completed: boolean) => void; // 완료 토글
  onEdit?: (todo: Todo) => void;                   // 수정 핸들러
  onDelete?: (id: string) => void;                 // 삭제 핸들러
  isLoading?: boolean;                             // 로딩 상태
}
```

**사용 예시:**
```tsx
<TodoList
  todos={todos}
  onToggle={handleToggle}
  onEdit={handleEdit}
  onDelete={handleDelete}
  isLoading={isLoading}
/>
```

---

### TodoForm

할 일을 추가하거나 수정하는 폼 컴포넌트입니다.

**주요 기능:**
- 제목, 설명 입력
- 우선순위 선택
- 마감일 캘린더 선택
- 카테고리 다중 선택
- 기본 카테고리 제공
- 새 카테고리 추가
- 유효성 검증

**Props:**
```typescript
interface TodoFormProps {
  todo?: Todo | null;                    // 수정할 할 일 (없으면 새로 생성)
  onSubmit: (data: CreateTodoInput) => void; // 제출 핸들러
  onCancel?: () => void;                 // 취소 핸들러
  isSubmitting?: boolean;                // 제출 중 상태
}
```

**사용 예시:**
```tsx
// 새 할 일 추가
<TodoForm
  onSubmit={(data) => createTodo(data)}
  onCancel={() => setShowForm(false)}
  isSubmitting={isCreating}
/>

// 할 일 수정
<TodoForm
  todo={editingTodo}
  onSubmit={(data) => updateTodo(editingTodo.id, data)}
  onCancel={() => setEditingTodo(null)}
  isSubmitting={isUpdating}
/>
```

---

## 타입 정의

`types/todo.ts`에 정의된 타입들:

```typescript
// 우선순위
type Priority = 'high' | 'medium' | 'low';

// 할 일
interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  created_date: Date;
  due_date?: Date;
  priority: Priority;
  category: string[];
  completed: boolean;
}

// 생성 입력
interface CreateTodoInput {
  title: string;
  description?: string;
  due_date?: Date;
  priority: Priority;
  category: string[];
}

// 수정 입력
interface UpdateTodoInput extends Partial<CreateTodoInput> {
  id: string;
  completed?: boolean;
}
```

---

## 스타일링

모든 컴포넌트는 Tailwind CSS와 Shadcn/ui를 사용하며, 다음 브랜드 컬러를 따릅니다:

- **Primary (Blue)**: 메인 액션, 포커스
- **Secondary (Violet)**: AI 기능
- **Accent (Emerald)**: 완료 상태, 성공
- **Destructive (Red)**: 삭제, 높은 우선순위
- **Muted (Slate)**: 보조 텍스트, 비활성

---

## 접근성

- 시맨틱 HTML 사용
- ARIA 속성 적용
- 키보드 네비게이션 지원
- 명확한 aria-label 제공

---

## 예시: 전체 통합

```tsx
'use client';

import { useState } from 'react';
import { TodoList, TodoForm } from '@/components/todo';
import { Todo, CreateTodoInput } from '@/types/todo';

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const handleCreate = (data: CreateTodoInput) => {
    // API 호출하여 할 일 생성
    const newTodo = {
      ...data,
      id: crypto.randomUUID(),
      user_id: 'current-user-id',
      created_date: new Date(),
      completed: false,
    };
    setTodos([...todos, newTodo]);
    setShowForm(false);
  };

  const handleToggle = (id: string, completed: boolean) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed } : todo
    ));
  };

  const handleDelete = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      {showForm ? (
        <TodoForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button onClick={() => setShowForm(true)}>
          할 일 추가
        </button>
      )}

      <TodoList
        todos={todos}
        onToggle={handleToggle}
        onEdit={setEditingTodo}
        onDelete={handleDelete}
      />
    </div>
  );
}
```
