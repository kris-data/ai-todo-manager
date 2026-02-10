# AI 컴포넌트

AI 기반 할 일 분석 및 요약 기능을 제공하는 컴포넌트입니다.

## 📁 파일 구조

```
components/ai/
├── TodoAnalysis.tsx   # AI 분석 메인 컴포넌트
├── index.ts          # Export 파일
└── README.md         # 문서
```

## 🎯 TodoAnalysis 컴포넌트

사용자의 할 일 목록을 AI가 분석하여 요약, 인사이트, 추천 사항을 제공합니다.

### Props

```typescript
interface TodoAnalysisProps {
  todos: Todo[];  // 전체 할 일 목록
}
```

### 기능

#### 1. 오늘의 요약
- 오늘 마감인 할 일만 분석
- 완료율, 긴급 작업, 인사이트 제공

#### 2. 이번 주 요약
- 이번 주(일요일~토요일) 할 일 분석
- 주간 패턴, 업무 분포, 추천 사항 제공

### 분석 항목

1. **요약 (summary)**
   - 전체 할 일 개수
   - 완료율

2. **긴급 작업 (urgentTasks)**
   - 우선순위 높음
   - 마감 임박 (3일 이내)
   - 최대 5개

3. **인사이트 (insights)**
   - 시간 관리 패턴
   - 마감일 분석
   - 업무 분포
   - 완료율 추이
   - 3-5개

4. **추천 사항 (recommendations)**
   - 실행 가능한 조언
   - 동기부여 메시지
   - 3-5개

## 💻 사용 예시

### 기본 사용

```tsx
import { TodoAnalysis } from '@/components/ai';
import type { Todo } from '@/types/todo';

export default function Dashboard() {
  const [todos, setTodos] = useState<Todo[]>([]);

  return (
    <div>
      <TodoAnalysis todos={todos} />
    </div>
  );
}
```

### 레이아웃 통합

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* 왼쪽: 입력 폼 & AI 분석 */}
  <div className="lg:col-span-1">
    <TodoForm />
    <TodoAnalysis todos={todos} />
  </div>

  {/* 오른쪽: 할 일 목록 */}
  <div className="lg:col-span-2">
    <TodoList todos={todos} />
  </div>
</div>
```

## 🔧 API 연동

### API 엔드포인트

```
POST /api/ai/analyze-todos
```

### 요청

```typescript
{
  todos: Todo[],           // 할 일 목록
  period: 'today' | 'week' // 분석 기간
}
```

### 응답

```typescript
{
  success: true,
  data: {
    summary: string,
    urgentTasks: string[],
    insights: string[],
    recommendations: string[]
  },
  meta: {
    analyzed_at: string,
    period: string,
    total_todos: number,
    completion_rate: number
  }
}
```

## 🎨 UI 구성

### 탭 구조

```
┌─────────────────────────────────┐
│  AI 요약 및 분석               │
├─────────────────────────────────┤
│ [오늘의 요약] [이번 주 요약]    │
├─────────────────────────────────┤
│ 📊 요약                         │
│ ⚠️  긁급 작업                   │
│ 📈 인사이트                     │
│ 💡 추천 사항                    │
│ [다시 분석하기]                 │
└─────────────────────────────────┘
```

### 상태별 UI

#### 1. 초기 상태 (분석 전)
```
✨ AI로 오늘 할 일을 분석해보세요
[AI 분석 시작]
```

#### 2. 로딩 상태
```
⏳ 분석 중...
```

#### 3. 분석 완료
```
요약, 긴급 작업, 인사이트, 추천 사항 표시
[다시 분석하기]
```

#### 4. 에러 상태
```
❌ AI 분석 실패
에러 메시지 표시
```

## 🧪 테스트 시나리오

### 1. 정상 케이스

```typescript
// 할 일 5개, 완료 3개
const todos = [
  { title: '회의', priority: 'high', completed: false, due_date: '2026-02-09' },
  { title: '보고서', priority: 'high', completed: false, due_date: '2026-02-09' },
  { title: '운동', priority: 'medium', completed: true, due_date: '2026-02-09' },
  { title: '공부', priority: 'low', completed: true, due_date: '2026-02-09' },
  { title: '장보기', priority: 'low', completed: true, due_date: '2026-02-09' },
];

// 예상 결과:
// - 요약: "총 5개 중 3개 완료 (60%)"
// - 긴급: ["회의", "보고서"]
// - 인사이트: 시간 관리, 우선순위 분석
// - 추천: 긴급 업무 우선 처리
```

### 2. 할 일 없음

```typescript
const todos = [];

// 예상 결과:
// - 요약: "오늘 등록된 할 일이 없습니다."
// - 인사이트: 할 일 추가 권장
// - 추천: 계획 세우기
```

### 3. 모두 완료

```typescript
const todos = [
  { title: '회의', completed: true, due_date: '2026-02-09' },
  { title: '보고서', completed: true, due_date: '2026-02-09' },
];

// 예상 결과:
// - 요약: "총 2개 중 2개 완료 (100%)"
// - 긴급: []
// - 인사이트: 완료율 칭찬
// - 추천: 계속 유지
```

## 🚨 에러 처리

### 클라이언트 에러

```typescript
try {
  const response = await fetch('/api/ai/analyze-todos', { ... });
  // 처리
} catch (error) {
  toast.error('AI 분석 실패', {
    description: error.message
  });
}
```

### 서버 에러

- `400`: 잘못된 입력
- `401`: API 키 인증 실패
- `429`: 사용량 초과
- `500`: 서버 오류

## 🎯 Best Practices

### 1. 성능 최적화

```typescript
// 할 일이 변경될 때만 분석 (수동 트리거)
<Button onClick={() => handleAnalyze('today')}>
  AI 분석
</Button>
```

### 2. 캐싱

```typescript
// 동일 기간은 재분석하지 않음
const [todayAnalysis, setTodayAnalysis] = useState<AnalysisResult | null>(null);
```

### 3. 로딩 상태

```typescript
const [isAnalyzing, setIsAnalyzing] = useState(false);

{isAnalyzing ? <Loader /> : <Button>분석</Button>}
```

## 📚 관련 문서

- [AI Parse Todo API](/app/api/ai/parse-todo/route.ts)
- [Todo Types](/types/todo.ts)
- [Supabase Setup](/lib/supabase/README.md)
