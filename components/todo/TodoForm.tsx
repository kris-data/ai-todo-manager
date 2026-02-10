/**
 * 할 일 추가/편집 폼 컴포넌트
 */

'use client';

import { useState } from 'react';
import { Todo, Priority, CreateTodoInput } from '@/types/todo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, X, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';

interface TodoFormProps {
  todo?: Todo | null;
  onSubmit: (data: CreateTodoInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

// 기본 카테고리 목록
const defaultCategories = ['업무', '개인', '학습', '운동', '취미'];

/**
 * 할 일 추가/편집 폼
 * @param todo - 수정할 할 일 (없으면 새로 생성)
 * @param onSubmit - 폼 제출 핸들러
 * @param onCancel - 취소 버튼 핸들러
 * @param isSubmitting - 제출 중 상태
 */
export const TodoForm = ({
  todo,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TodoFormProps) => {
  const [title, setTitle] = useState(todo?.title || '');
  const [description, setDescription] = useState(todo?.description || '');
  const [priority, setPriority] = useState<Priority>(todo?.priority || 'medium');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    todo?.due_date ? new Date(todo.due_date) : undefined
  );
  const [categories, setCategories] = useState<string[]>(todo?.category || []);
  const [newCategory, setNewCategory] = useState('');
  
  // AI 생성 관련 상태
  const [aiInput, setAiInput] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);

  // AI로 할 일 파싱
  const handleAiParse = async () => {
    const trimmedInput = aiInput.trim();
    
    // 프론트엔드 입력 검증
    if (!trimmedInput) {
      toast.error('입력이 필요합니다', {
        description: '자연어로 할 일을 입력해주세요.',
      });
      return;
    }

    if (trimmedInput.length < 2) {
      toast.error('입력이 너무 짧습니다', {
        description: '최소 2자 이상 입력해주세요.',
      });
      return;
    }

    if (trimmedInput.length > 500) {
      toast.error('입력이 너무 깁니다', {
        description: '최대 500자까지 입력 가능합니다.',
      });
      return;
    }

    setIsAiParsing(true);
    
    try {
      const response = await fetch('/api/ai/parse-todo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: trimmedInput }),
      });

      // 🔍 디버깅: 원본 응답 먼저 확인
      const text = await response.text();
      console.log('🔍 AI API Response Status:', response.status);
      console.log('🔍 AI API Response Raw:', text);

      let result: any = null;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ JSON 파싱 실패:', parseError);
        throw new Error(`서버 응답을 파싱할 수 없습니다 (HTTP ${response.status}): ${text.substring(0, 200)}`);
      }

      if (!response.ok) {
        // 서버에서 반환한 상세 에러 메시지 추출
        const errorMsg = result?.error || 'AI 파싱에 실패했습니다.';
        const errorDetails = result?.details || '';
        const errorRetry = result?.retry || '';
        
        const fullErrorMsg = [
          errorMsg,
          errorDetails,
          errorRetry
        ].filter(Boolean).join(' ');
        
        console.error('❌ API 에러:', { 
          status: response.status, 
          error: result,
          fullMessage: fullErrorMsg 
        });
        
        throw new Error(fullErrorMsg);
      }

      const parsedData = result.data;

      // 폼 필드 자동 채우기
      setTitle(parsedData.title || '');
      setDescription(parsedData.description || '');
      setPriority(parsedData.priority || 'medium');
      setCategories(parsedData.category || []);

      // 날짜 및 시간 처리 (빈 문자열 처리)
      if (parsedData.due_date && parsedData.due_date.trim() !== '') {
        let dateString = parsedData.due_date;
        
        // 시간이 있으면 날짜와 결합
        if (parsedData.due_time && parsedData.due_time.trim() !== '') {
          dateString = `${parsedData.due_date}T${parsedData.due_time}:00`;
        }
        
        const parsedDate = new Date(dateString);
        if (!isNaN(parsedDate.getTime())) {
          setDueDate(parsedDate);
        }
      }

      toast.success('AI 변환 완료', {
        description: '자연어 입력이 할 일로 변환되었습니다.',
      });

      // AI 입력 섹션 닫기
      setShowAiInput(false);
      setAiInput('');
    } catch (error: any) {
      console.error('AI 파싱 오류:', error);
      toast.error('AI 변환 실패', {
        description: error.message || '다시 시도해주세요.',
        duration: 5000,
      });
    } finally {
      setIsAiParsing(false);
    }
  };

  // 카테고리 추가
  const handleAddCategory = (category: string) => {
    const trimmed = category.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setNewCategory('');
    }
  };

  // 카테고리 제거
  const handleRemoveCategory = (category: string) => {
    setCategories(categories.filter((c) => c !== category));
  };

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate,
      category: categories,
    });
  };

  // 우선순위 라벨
  const priorityLabels = {
    high: '높음',
    medium: '보통',
    low: '낮음',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI 생성 섹션 */}
      {!todo && (
        <div className="space-y-3 p-4 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-lg border border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">AI로 할 일 생성</Label>
            </div>
            {!showAiInput && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAiInput(true)}
                className="text-primary hover:text-primary"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                시작하기
              </Button>
            )}
          </div>

          {showAiInput && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-sm text-muted-foreground">
                자연어로 할 일을 입력하면 AI가 자동으로 제목, 마감일, 우선순위 등을 파악합니다.
              </p>
              
              <div className="space-y-2">
                <Textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="예: 내일 오후 3시까지 중요한 팀 회의 준비하기"
                  className="min-h-[80px] resize-none"
                  disabled={isAiParsing}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleAiParse();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    💡 Tip: Ctrl+Enter로 빠르게 변환
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAiInput(false);
                        setAiInput('');
                      }}
                      disabled={isAiParsing}
                    >
                      취소
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAiParse}
                      disabled={isAiParsing || !aiInput.trim()}
                      className="bg-primary"
                    >
                      {isAiParsing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          변환 중...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          AI 변환
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 제목 */}
      <div className="space-y-2">
        <Label htmlFor="title">
          할 일 제목 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 프로젝트 기획서 작성"
          required
          autoFocus={!showAiInput}
        />
      </div>

      {/* 설명 */}
      <div className="space-y-2">
        <Label htmlFor="description">상세 설명</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="할 일에 대한 상세한 설명을 입력하세요"
          rows={3}
        />
      </div>

      {/* 우선순위 및 마감일 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 우선순위 */}
        <div className="space-y-2">
          <Label htmlFor="priority">우선순위</Label>
          <Select
            value={priority}
            onValueChange={(value) => setPriority(value as Priority)}
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">
                <span className="text-red-600">🔴 {priorityLabels.high}</span>
              </SelectItem>
              <SelectItem value="medium">
                <span className="text-amber-600">🟡 {priorityLabels.medium}</span>
              </SelectItem>
              <SelectItem value="low">
                <span className="text-slate-600">⚪ {priorityLabels.low}</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 마감일 */}
        <div className="space-y-2">
          <Label>마감일</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dueDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? (
                  format(dueDate, 'PPP', { locale: ko })
                ) : (
                  <span>날짜 선택</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
                locale={ko}
              />
              {dueDate && (
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setDueDate(undefined)}
                  >
                    날짜 지우기
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 카테고리 */}
      <div className="space-y-2">
        <Label htmlFor="category">카테고리</Label>
        
        {/* 선택된 카테고리 */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="gap-1">
                {cat}
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat)}
                  className="hover:text-destructive"
                  aria-label={`${cat} 제거`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* 카테고리 입력 */}
        <div className="flex gap-2">
          <Input
            id="category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCategory(newCategory);
              }
            }}
            placeholder="카테고리 입력 후 Enter"
          />
        </div>

        {/* 기본 카테고리 선택 */}
        <div className="flex flex-wrap gap-2">
          {defaultCategories
            .filter((cat) => !categories.includes(cat))
            .map((cat) => (
              <Button
                key={cat}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddCategory(cat)}
                className="h-7 text-xs"
              >
                + {cat}
              </Button>
            ))}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting || !title.trim()}
        >
          {isSubmitting ? '저장 중...' : todo ? '수정하기' : '추가하기'}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            취소
          </Button>
        )}
      </div>

      {/* AI 생성 안내 */}
      {!todo && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">
          <Sparkles className="h-4 w-4 text-secondary-foreground" />
          <span>
            <strong>Tip:</strong> 자연어로 할 일을 생성하려면 AI 생성 버튼을 사용해 보세요.
          </span>
        </div>
      )}
    </form>
  );
};
