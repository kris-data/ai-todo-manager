/**
 * 메인 페이지 - AI 할 일 관리 대시보드
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Toolbar } from '@/components/layout/Toolbar';
import { TodoAnalysis } from '@/components/ai/TodoAnalysis';
import { createClient } from '@/lib/supabase/client';
import { TodoList, TodoForm } from '@/components/todo';
import { Todo, Priority, CreateTodoInput } from '@/types/todo';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

/**
 * 메인 페이지 컴포넌트
 */
export default function Home() {
  const router = useRouter();
  
  // 상태 관리
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTodos, setIsLoadingTodos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('createdDate');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  /**
   * Supabase에서 할 일 목록 조회
   */
  const fetchTodos = async (userId: string) => {
    setIsLoadingTodos(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_date', { ascending: false });

      if (error) {
        throw error;
      }

      // Supabase 날짜를 Date 객체로 변환
      const todosWithDates = (data || []).map((todo) => ({
        ...todo,
        created_date: new Date(todo.created_date),
        due_date: todo.due_date ? new Date(todo.due_date) : undefined,
      })) as Todo[];

      setTodos(todosWithDates);
    } catch (error) {
      console.error('할 일 목록 조회 오류:', error);
      toast.error('할 일 목록 조회 실패', {
        description: '할 일 목록을 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoadingTodos(false);
    }
  };

  /**
   * 사용자 인증 상태 확인 및 초기 데이터 로드
   */
  useEffect(() => {
    const checkUserAndFetchData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
          router.push('/login');
          return;
        }
        
        setUser(user);
        // 사용자의 할 일 목록 조회
        await fetchTodos(user.id);
      } catch (error) {
        console.error('사용자 확인 오류:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAndFetchData();
  }, [router]);

  /**
   * 할 일 생성 핸들러 (Create)
   */
  const handleCreateTodo = async (data: CreateTodoInput) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      
      // Supabase에 삽입할 데이터 준비
      const newTodoData = {
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        due_date: data.due_date ? data.due_date.toISOString() : null,
        priority: data.priority,
        category: data.category,
        completed: false,
      };

      const { data: insertedTodo, error } = await supabase
        .from('todos')
        .insert(newTodoData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // 생성된 할 일을 목록에 추가 (날짜 변환)
      const todoWithDates: Todo = {
        ...insertedTodo,
        created_date: new Date(insertedTodo.created_date),
        due_date: insertedTodo.due_date ? new Date(insertedTodo.due_date) : undefined,
      };

      setTodos([todoWithDates, ...todos]);
      
      toast.success('할 일 추가 완료', {
        description: `"${data.title}"이(가) 추가되었습니다.`,
      });
      
      setShowAddDialog(false);
    } catch (error) {
      console.error('할 일 생성 오류:', error);
      toast.error('할 일 추가 실패', {
        description: '할 일을 추가하는 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 할 일 수정 핸들러 (Update)
   */
  const handleUpdateTodo = async (data: CreateTodoInput) => {
    if (!editingTodo || !user) return;

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      
      // Supabase에 업데이트할 데이터 준비
      const updateData = {
        title: data.title,
        description: data.description || null,
        due_date: data.due_date ? data.due_date.toISOString() : null,
        priority: data.priority,
        category: data.category,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedTodo, error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', editingTodo.id)
        .eq('user_id', user.id) // 본인 소유 확인
        .select()
        .single();

      if (error) {
        throw error;
      }

      // 수정된 할 일을 목록에 반영
      const todoWithDates: Todo = {
        ...updatedTodo,
        created_date: new Date(updatedTodo.created_date),
        due_date: updatedTodo.due_date ? new Date(updatedTodo.due_date) : undefined,
      };

      setTodos(
        todos.map((todo) =>
          todo.id === editingTodo.id ? todoWithDates : todo
        )
      );
      
      toast.success('할 일 수정 완료', {
        description: `"${data.title}"이(가) 수정되었습니다.`,
      });
      
      setEditingTodo(null);
    } catch (error) {
      console.error('할 일 수정 오류:', error);
      toast.error('할 일 수정 실패', {
        description: '할 일을 수정하는 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 할 일 완료 토글 핸들러
   */
  const handleToggleTodo = async (id: string, completed: boolean) => {
    if (!user) return;

    try {
      const supabase = createClient();
      
      const updateData = {
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // 로컬 상태 업데이트
      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, completed } : todo
        )
      );
    } catch (error) {
      console.error('할 일 완료 토글 오류:', error);
      toast.error('상태 변경 실패', {
        description: '할 일 상태를 변경하는 중 오류가 발생했습니다.',
      });
    }
  };

  /**
   * 할 일 삭제 핸들러 (Delete)
   */
  const handleDeleteTodo = async (id: string) => {
    if (!user) {
      toast.error('인증 오류', {
        description: '로그인 정보를 확인할 수 없습니다.',
      });
      return;
    }

    // 삭제 확인
    const todoToDelete = todos.find((todo) => todo.id === id);
    if (!todoToDelete) {
      toast.error('삭제 오류', {
        description: '삭제할 할 일을 찾을 수 없습니다.',
      });
      return;
    }

    if (!confirm(`"${todoToDelete.title}"을(를) 정말 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const supabase = createClient();
      
      console.log('삭제 시도:', {
        id,
        user_id: user.id,
        todo_title: todoToDelete.title,
      });
      
      const { data, error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .select(); // 삭제된 데이터를 반환받아 확인

      console.log('삭제 결과:', { data, error });

      if (error) {
        console.error('Supabase 삭제 오류 상세:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      // 삭제된 행이 없으면 권한 문제일 수 있음
      if (!data || data.length === 0) {
        throw new Error('삭제할 항목을 찾을 수 없거나 권한이 없습니다.');
      }

      // 로컬 상태에서 제거
      setTodos(todos.filter((todo) => todo.id !== id));
      
      toast.success('할 일 삭제 완료', {
        description: `"${todoToDelete.title}"이(가) 삭제되었습니다.`,
      });
    } catch (error: any) {
      console.error('할 일 삭제 오류:', error);
      
      const errorMessage = error?.message || '할 일을 삭제하는 중 오류가 발생했습니다.';
      
      toast.error('할 일 삭제 실패', {
        description: errorMessage,
        duration: 5000,
      });
      
      // RLS 정책 문제일 가능성 안내
      if (error?.code === '42501' || errorMessage.includes('policy')) {
        toast.error('권한 오류', {
          description: 'Supabase RLS 정책을 확인해주세요. 콘솔에 상세 정보가 출력되었습니다.',
          duration: 7000,
        });
      }
    }
  };

  /**
   * 로그아웃 핸들러
   * Header 컴포넌트가 자체적으로 Supabase 로그아웃을 처리하므로
   * onLogout prop을 전달하지 않음
   */

  /**
   * 할 일 필터링 및 정렬
   */
  const getFilteredAndSortedTodos = () => {
    let filtered = [...todos];

    // 검색 필터
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

  const filteredTodos = getFilteredAndSortedTodos();

  // 로딩 중일 때 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 사용자 정보가 없으면 아무것도 렌더링하지 않음 (리다이렉트 중)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <Header
        userName={user.user_metadata?.display_name || user.email?.split('@')[0] || '사용자'}
        userEmail={user.email || ''}
      />

      {/* 툴바 */}
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

      {/* 메인 영역 */}
      <main className="container px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 할 일 추가 폼 */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    할 일 추가
                  </CardTitle>
                  <CardDescription>
                    새로운 할 일을 등록하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TodoForm
                    onSubmit={handleCreateTodo}
                    isSubmitting={isSubmitting}
                  />
                </CardContent>
              </Card>

              {/* AI 생성 버튼 (향후 구현) */}
              <Card className="mt-4 bg-secondary/10 border-secondary/20">
                <CardContent className="pt-6">
                  <Button
                    variant="outline"
                    className="w-full border-secondary/40 hover:bg-secondary/10"
                    disabled
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-secondary" />
                    AI로 할 일 생성
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    자연어로 할 일 생성 (준비 중)
                  </p>
                </CardContent>
              </Card>

              {/* 통계 카드 */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base">할 일 통계</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">전체</span>
                    <span className="font-semibold">{todos.length}개</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">진행 중</span>
                    <span className="font-semibold text-primary">
                      {todos.filter((t) => !t.completed).length}개
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">완료</span>
                    <span className="font-semibold text-accent">
                      {todos.filter((t) => t.completed).length}개
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 오른쪽: 할 일 목록 + AI 분석 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 할 일 목록 - 우선 배치 */}
            <TodoList
              todos={filteredTodos}
              onToggle={handleToggleTodo}
              onEdit={setEditingTodo}
              onDelete={handleDeleteTodo}
              isLoading={isLoadingTodos}
            />

            {/* AI 요약 및 분석 - 하단 배치 */}
            <TodoAnalysis todos={todos} />
          </div>
        </div>
      </main>

      {/* 할 일 수정 다이얼로그 */}
      <Dialog open={!!editingTodo} onOpenChange={() => setEditingTodo(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>할 일 수정</DialogTitle>
            <DialogDescription>
              할 일 정보를 수정하세요
            </DialogDescription>
          </DialogHeader>
          {editingTodo && (
            <TodoForm
              todo={editingTodo}
              onSubmit={handleUpdateTodo}
              onCancel={() => setEditingTodo(null)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
