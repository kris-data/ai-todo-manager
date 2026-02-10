/**
 * 개별 할 일을 표시하는 카드 컴포넌트
 */

'use client';

import { Calendar, Edit, Trash2 } from 'lucide-react';
import { Todo } from '@/types/todo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface TodoCardProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onEdit?: (todo: Todo) => void;
  onDelete?: (id: string) => void;
}

/**
 * 할 일 카드 컴포넌트
 * @param todo - 표시할 할 일 데이터
 * @param onToggle - 완료 상태 토글 핸들러
 * @param onEdit - 수정 버튼 클릭 핸들러
 * @param onDelete - 삭제 버튼 클릭 핸들러
 */
export const TodoCard = ({ todo, onToggle, onEdit, onDelete }: TodoCardProps) => {
  // 우선순위별 색상 매핑
  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  // 우선순위 한글 표시
  const priorityLabels = {
    high: '높음',
    medium: '보통',
    low: '낮음',
  };

  // 마감일 포맷팅
  const formatDueDate = (date?: Date) => {
    if (!date) return null;
    
    const dueDate = new Date(date);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 지연 여부 확인
    const isOverdue = !todo.completed && diffDays < 0;
    const isToday = diffDays === 0;
    const isTomorrow = diffDays === 1;

    let label = dueDate.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });

    if (isToday) label = '오늘';
    else if (isTomorrow) label = '내일';
    else if (diffDays > 0 && diffDays <= 7) label = `${diffDays}일 후`;

    return {
      label,
      isOverdue,
      className: cn(
        'text-xs flex items-center gap-1',
        isOverdue && 'text-red-600 font-medium',
        isToday && 'text-blue-600 font-medium',
      ),
    };
  };

  const dueDateInfo = formatDueDate(todo.due_date);

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        todo.completed && 'opacity-60 bg-muted',
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* 완료 체크박스 */}
          <Checkbox
            checked={todo.completed}
            onCheckedChange={(checked) => onToggle(todo.id, checked as boolean)}
            className="mt-1 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
          />

          <div className="flex-1 space-y-2">
            {/* 제목 */}
            <h3
              className={cn(
                'text-base font-semibold leading-tight',
                todo.completed && 'line-through text-muted-foreground',
              )}
            >
              {todo.title}
            </h3>

            {/* 우선순위 및 카테고리 배지 */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={priorityColors[todo.priority]}
              >
                {priorityLabels[todo.priority]}
              </Badge>

              {todo.category.map((cat) => (
                <Badge key={cat} variant="secondary" className="text-xs">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(todo)}
                aria-label="할 일 수정"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(todo.id)}
                aria-label="할 일 삭제"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {(todo.description || dueDateInfo) && (
        <CardContent className="pt-0">
          {/* 설명 */}
          {todo.description && (
            <p
              className={cn(
                'text-sm text-muted-foreground mb-2',
                todo.completed && 'line-through',
              )}
            >
              {todo.description}
            </p>
          )}

          {/* 마감일 */}
          {dueDateInfo && (
            <div className={dueDateInfo.className}>
              <Calendar className="h-3 w-3" />
              <span>{dueDateInfo.label}</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
