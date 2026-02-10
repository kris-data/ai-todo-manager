/**
 * 할 일 관련 타입 정의
 */

/**
 * 우선순위 타입
 */
export type Priority = 'high' | 'medium' | 'low';

/**
 * 할 일 인터페이스
 */
export interface Todo {
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

/**
 * 할 일 생성 시 필요한 데이터
 */
export interface CreateTodoInput {
  title: string;
  description?: string;
  due_date?: Date;
  priority: Priority;
  category: string[];
}

/**
 * 할 일 수정 시 필요한 데이터
 */
export interface UpdateTodoInput extends Partial<CreateTodoInput> {
  id: string;
  completed?: boolean;
}
