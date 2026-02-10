/**
 * 할 일 목록을 표시하는 컴포넌트
 */

'use client';

import { Todo } from '@/types/todo';
import { TodoCard } from './TodoCard';
import { CheckCircle2 } from 'lucide-react';

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string, completed: boolean) => void;
  onEdit?: (todo: Todo) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

/**
 * 할 일 목록 컴포넌트
 * @param todos - 표시할 할 일 배열
 * @param onToggle - 할 일 완료 상태 토글 핸들러
 * @param onEdit - 할 일 수정 핸들러
 * @param onDelete - 할 일 삭제 핸들러
 * @param isLoading - 로딩 상태
 */
export const TodoList = ({
  todos,
  onToggle,
  onEdit,
  onDelete,
  isLoading = false,
}: TodoListProps) => {
  // 로딩 스켈레톤
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-muted animate-pulse rounded-lg"
            role="status"
            aria-label="로딩 중"
          />
        ))}
      </div>
    );
  }

  // 빈 상태
  if (!todos || todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">아직 등록된 할 일이 없습니다</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          새로운 할 일을 추가하거나 AI를 활용해 자연어로 할 일을 생성해 보세요.
        </p>
      </div>
    );
  }

  // 완료/미완료로 그룹화
  const incompleteTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);

  return (
    <div className="space-y-6">
      {/* 진행 중인 할 일 */}
      {incompleteTodos.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            진행 중 ({incompleteTodos.length})
          </h2>
          <div className="space-y-3">
            {incompleteTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* 완료된 할 일 */}
      {completedTodos.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            완료됨 ({completedTodos.length})
          </h2>
          <div className="space-y-3">
            {completedTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
