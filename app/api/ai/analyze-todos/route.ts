/**
 * AI 할 일 분석 API Route
 * 사용자의 할 일 목록을 분석하여 요약과 인사이트 제공
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * 분석 결과 스키마
 */
const AnalysisSchema = z.object({
  summary: z.string().describe('전체 할 일 요약 (완료율 포함)'),
  urgentTasks: z.array(z.string()).describe('긴급하게 처리해야 할 작업 목록 (최대 5개)'),
  insights: z.array(z.string()).describe('데이터 기반 인사이트 (3-5개)'),
  recommendations: z.array(z.string()).describe('실행 가능한 추천 사항 (3-5개)'),
});

/**
 * POST /api/ai/analyze-todos
 * 할 일 목록을 분석하여 인사이트 제공
 */
export async function POST(req: NextRequest) {
  try {
    const { todos, period } = await req.json();

    // 입력 검증
    if (!todos || !Array.isArray(todos)) {
      return NextResponse.json(
        { 
          error: '유효하지 않은 데이터',
          details: '할 일 목록이 필요합니다.'
        },
        { status: 400 }
      );
    }

    if (!period || !['today', 'week'].includes(period)) {
      return NextResponse.json(
        { 
          error: '유효하지 않은 기간',
          details: 'period는 "today" 또는 "week"이어야 합니다.'
        },
        { status: 400 }
      );
    }

    // 할 일이 없는 경우
    if (todos.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: period === 'today' ? '오늘 등록된 할 일이 없습니다.' : '이번 주 등록된 할 일이 없습니다.',
          urgentTasks: [],
          insights: [
            '새로운 할 일을 추가해보세요! 🎯',
            'AI 생성 기능을 활용하면 더 빠르게 할 일을 등록할 수 있습니다.'
          ],
          recommendations: [
            '오늘 해야 할 일을 계획해보세요.',
            '우선순위를 정하고 하나씩 실행해보세요.'
          ]
        }
      });
    }

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'AI 서비스 설정 오류',
          details: 'API 키가 설정되지 않았습니다.'
        },
        { status: 500 }
      );
    }

    // 현재 시간 정보
    const now = new Date();
    const kstOffset = 9 * 60;
    const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);
    const currentDate = kstNow.toISOString().split('T')[0];
    const currentTime = kstNow.toTimeString().split(' ')[0].substring(0, 5);
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][kstNow.getDay()];

    // ========================================
    // 📊 정교한 통계 계산
    // ========================================

    const totalCount = todos.length;
    const completedCount = todos.filter((t: any) => t.completed).length;
    const incompleteCount = totalCount - completedCount;
    const completionRate = totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(1) : '0';

    // 1. 완료율 분석 (우선순위별)
    const priorityAnalysis = {
      high: {
        total: todos.filter((t: any) => t.priority === 'high').length,
        completed: todos.filter((t: any) => t.priority === 'high' && t.completed).length,
        rate: 0,
      },
      medium: {
        total: todos.filter((t: any) => t.priority === 'medium').length,
        completed: todos.filter((t: any) => t.priority === 'medium' && t.completed).length,
        rate: 0,
      },
      low: {
        total: todos.filter((t: any) => t.priority === 'low').length,
        completed: todos.filter((t: any) => t.priority === 'low' && t.completed).length,
        rate: 0,
      },
    };

    // 우선순위별 완료율 계산
    priorityAnalysis.high.rate = priorityAnalysis.high.total > 0 
      ? (priorityAnalysis.high.completed / priorityAnalysis.high.total * 100) 
      : 0;
    priorityAnalysis.medium.rate = priorityAnalysis.medium.total > 0 
      ? (priorityAnalysis.medium.completed / priorityAnalysis.medium.total * 100) 
      : 0;
    priorityAnalysis.low.rate = priorityAnalysis.low.total > 0 
      ? (priorityAnalysis.low.completed / priorityAnalysis.low.total * 100) 
      : 0;

    // 2. 시간 관리 분석
    // 마감일 지난 작업 (연체)
    const overdueTasks = todos.filter((t: any) => {
      if (!t.due_date || t.completed) return false;
      const dueDate = new Date(t.due_date);
      return dueDate < kstNow;
    }).length;

    // 마감 임박 작업 (오늘~3일)
    const upcomingTasks = todos.filter((t: any) => {
      if (!t.due_date || t.completed) return false;
      const dueDate = new Date(t.due_date);
      const diffDays = Math.ceil((dueDate.getTime() - kstNow.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    }).length;

    // 오늘 마감 작업
    const todayDeadlines = todos.filter((t: any) => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date).toISOString().split('T')[0];
      return dueDate === currentDate;
    }).length;

    // 마감일 준수율 (완료된 것 중 마감일 전에 완료한 비율)
    const completedWithDueDate = todos.filter((t: any) => t.completed && t.due_date && t.completed_at);
    const onTimeCompletions = completedWithDueDate.filter((t: any) => {
      const dueDate = new Date(t.due_date);
      const completedDate = new Date(t.completed_at);
      return completedDate <= dueDate;
    }).length;
    const onTimeRate = completedWithDueDate.length > 0 
      ? (onTimeCompletions / completedWithDueDate.length * 100).toFixed(1) 
      : '0';

    // 3. 시간대별 분석 (상세)
    const timeDistribution = {
      morning: { // 6-12시
        total: 0,
        completed: 0,
        incomplete: 0,
      },
      afternoon: { // 12-18시
        total: 0,
        completed: 0,
        incomplete: 0,
      },
      evening: { // 18-24시
        total: 0,
        completed: 0,
        incomplete: 0,
      },
      night: { // 0-6시
        total: 0,
        completed: 0,
        incomplete: 0,
      },
    };

    todos.forEach((t: any) => {
      if (!t.due_time) return;
      const hour = parseInt(t.due_time.split(':')[0]);
      
      let timeSlot: 'morning' | 'afternoon' | 'evening' | 'night';
      if (hour >= 6 && hour < 12) timeSlot = 'morning';
      else if (hour >= 12 && hour < 18) timeSlot = 'afternoon';
      else if (hour >= 18 && hour < 24) timeSlot = 'evening';
      else timeSlot = 'night';

      timeDistribution[timeSlot].total++;
      if (t.completed) {
        timeDistribution[timeSlot].completed++;
      } else {
        timeDistribution[timeSlot].incomplete++;
      }
    });

    // 가장 바쁜 시간대
    const busiestTimeSlot = Object.entries(timeDistribution)
      .sort(([, a], [, b]) => b.total - a.total)[0];

    // 4. 요일별 분석 (주간 분석용)
    const dayDistribution: Record<string, { total: number; completed: number }> = {
      '일': { total: 0, completed: 0 },
      '월': { total: 0, completed: 0 },
      '화': { total: 0, completed: 0 },
      '수': { total: 0, completed: 0 },
      '목': { total: 0, completed: 0 },
      '금': { total: 0, completed: 0 },
      '토': { total: 0, completed: 0 },
    };

    todos.forEach((t: any) => {
      if (!t.due_date) return;
      const dueDate = new Date(t.due_date);
      const day = ['일', '월', '화', '수', '목', '금', '토'][dueDate.getDay()];
      dayDistribution[day].total++;
      if (t.completed) dayDistribution[day].completed++;
    });

    // 가장 바쁜 요일
    const busiestDay = Object.entries(dayDistribution)
      .sort(([, a], [, b]) => b.total - a.total)[0];

    // 5. 카테고리별 상세 분석
    const categoryAnalysis: Record<string, { total: number; completed: number; rate: number }> = {};
    todos.forEach((t: any) => {
      if (t.category && Array.isArray(t.category)) {
        t.category.forEach((cat: string) => {
          if (!categoryAnalysis[cat]) {
            categoryAnalysis[cat] = { total: 0, completed: 0, rate: 0 };
          }
          categoryAnalysis[cat].total++;
          if (t.completed) categoryAnalysis[cat].completed++;
        });
      }
    });

    // 카테고리별 완료율 계산
    Object.keys(categoryAnalysis).forEach((cat) => {
      const data = categoryAnalysis[cat];
      data.rate = data.total > 0 ? (data.completed / data.total * 100) : 0;
    });

    // 가장 많은 카테고리
    const topCategory = Object.entries(categoryAnalysis)
      .sort(([, a], [, b]) => b.total - a.total)[0];

    // 6. 생산성 패턴
    // 평균 완료 시간 (마감일과 생성일 차이)
    const tasksWithDates = todos.filter((t: any) => t.created_date && t.due_date);
    const avgDaysToComplete = tasksWithDates.length > 0
      ? tasksWithDates.reduce((sum: number, t: any) => {
          const created = new Date(t.created_date);
          const due = new Date(t.due_date);
          return sum + Math.ceil((due.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / tasksWithDates.length
      : 0;

    // 할 일 목록을 간결하게 변환 (토큰 절약)
    const simplifiedTodos = todos.map((t: any) => ({
      title: t.title,
      priority: t.priority,
      completed: t.completed,
      due_date: t.due_date || null,
      due_time: t.due_time || null,
      category: t.category || [],
    }));

    // OpenAI API 호출 (비용 최적화)
    const result = await generateObject({
      model: openai('gpt-4o-mini'), // 가장 저렴한 모델 ($0.00015/1K input tokens)
      schema: AnalysisSchema,
      temperature: 0.3, // 약간 창의적이되 비용 절약
      // 참고: schema 기반으로 응답 길이가 자동 제한됨 (배열은 3-5개로 제한)
      prompt: `당신은 경험 많은 생산성 코치입니다. 사용자의 할 일 목록을 깊이 있게 분석하여 실질적인 도움이 되는 인사이트와 격려를 제공하세요.

⚠️ 중요: 간결하고 핵심적인 내용만 포함하세요. 각 배열은 3-5개 항목으로 제한하세요.

## 📅 현재 시간 정보
- **날짜**: ${currentDate} (${dayOfWeek}요일)
- **시간**: ${currentTime}
- **분석 기간**: ${period === 'today' ? '오늘 (당일 집중 분석)' : '이번 주 (주간 패턴 분석)'}

## 📊 상세 통계 분석

### 📌 전체 현황
- 전체 할 일: **${totalCount}개**
- 완료: **${completedCount}개** (${completionRate}%)
- 미완료: **${incompleteCount}개**

### 🎯 우선순위별 완료 패턴
- **높음(긴급)**: ${priorityAnalysis.high.total}개 (완료: ${priorityAnalysis.high.completed}개, ${priorityAnalysis.high.rate.toFixed(1)}%)
- **보통**: ${priorityAnalysis.medium.total}개 (완료: ${priorityAnalysis.medium.completed}개, ${priorityAnalysis.medium.rate.toFixed(1)}%)
- **낮음**: ${priorityAnalysis.low.total}개 (완료: ${priorityAnalysis.low.completed}개, ${priorityAnalysis.low.rate.toFixed(1)}%)

### ⏰ 시간 관리 분석
- **마감일 지난 작업(연체)**: ${overdueTasks}개 ${overdueTasks > 0 ? '⚠️' : '✅'}
- **3일 이내 마감**: ${upcomingTasks}개
- **오늘 마감**: ${todayDeadlines}개
- **마감일 준수율**: ${onTimeRate}% ${parseFloat(onTimeRate) >= 80 ? '🌟' : ''}

### 🕐 시간대별 업무 분포 & 생산성
- **오전(06-12시)**: ${timeDistribution.morning.total}개 (완료: ${timeDistribution.morning.completed}개)
- **오후(12-18시)**: ${timeDistribution.afternoon.total}개 (완료: ${timeDistribution.afternoon.completed}개)
- **저녁(18-24시)**: ${timeDistribution.evening.total}개 (완료: ${timeDistribution.evening.completed}개)
- **심야(00-06시)**: ${timeDistribution.night.total}개 (완료: ${timeDistribution.night.completed}개)
- **가장 바쁜 시간대**: ${busiestTimeSlot ? `${busiestTimeSlot[0]} (${busiestTimeSlot[1].total}개)` : '없음'}

${period === 'week' ? `### 📅 요일별 분포 (이번 주)
${Object.entries(dayDistribution)
  .map(([day, data]) => `- **${day}요일**: ${data.total}개 (완료: ${data.completed}개)`)
  .join('\n')}
- **가장 바쁜 요일**: ${busiestDay ? `${busiestDay[0]}요일 (${busiestDay[1].total}개)` : '없음'}
` : ''}

### 📂 카테고리별 완료 패턴
${Object.entries(categoryAnalysis)
  .sort(([, a], [, b]) => b.total - a.total)
  .slice(0, 5)
  .map(([cat, data]) => `- **${cat}**: ${data.total}개 (완료: ${data.completed}개, ${data.rate.toFixed(1)}%)`)
  .join('\n')}
${topCategory ? `- **가장 많은 카테고리**: ${topCategory[0]} (${topCategory[1].total}개)` : ''}

### 📈 생산성 패턴
- **평균 할 일 처리 기간**: ${avgDaysToComplete > 0 ? `약 ${avgDaysToComplete.toFixed(1)}일` : '데이터 부족'}

## 📝 할 일 목록 (상세)
${JSON.stringify(simplifiedTodos, null, 2)}

## 🎯 ${period === 'today' ? '오늘의 분석' : '이번 주 분석'} 요구사항

${period === 'today' ? `
### 📌 오늘 집중 분석 포인트:
1. **당일 우선순위**: 남은 시간 동안 무엇을 먼저 해야 하는가?
2. **시간 관리**: 오늘 남은 할 일의 소요 시간과 가능성
3. **긴급도 평가**: 오늘 꼭 완료해야 할 작업 vs 내일로 미룰 수 있는 작업
4. **집중도 분석**: 현재 시간(${currentTime})을 고려한 최적의 작업 순서
5. **동기부여**: 오늘 이미 완료한 작업에 대한 긍정적 피드백
` : `
### 📊 이번 주 패턴 분석 포인트:
1. **주간 완료 패턴**: 어떤 요일에 가장 생산적인가?
2. **시간 활용**: 시간대별 생산성 패턴과 개선점
3. **우선순위 관리**: 긴급 작업 vs 일반 작업의 균형
4. **업무 분산**: 특정 날짜에 과부하가 있는가?
5. **다음 주 계획**: 이번 주 패턴을 바탕으로 한 다음 주 전략
`}

### 1️⃣ summary (한 줄 요약)
- **형식**: "총 X개의 할 일 중 Y개 완료 (Z%)"
- **추가 정보**: ${period === 'today' ? '오늘 남은 할 일 개수와 집중해야 할 포인트' : '이번 주 전반적인 진행 상황'}
- **긍정적 표현**: 잘하고 있는 부분을 먼저 언급

### 2️⃣ urgentTasks (긴급 작업 목록)
- **미완료** 작업 중 다음 기준으로 선정 (최대 5개):
  * 우선순위 '높음'
  * ${period === 'today' ? '오늘 마감' : '3일 이내 마감'}
  * 마감일 지난 작업(연체)
- **정렬**: 마감 임박순 → 우선순위순
- **없으면**: 빈 배열 [] (긍정적!)

### 3️⃣ insights (데이터 기반 인사이트) - 3~5개
다음 관점에서 **구체적인 숫자와 패턴**을 활용:

#### ✅ 완료율 분석
- 전체 완료율이 높으면 칭찬 (${completionRate}%)
- 우선순위별 완료 패턴 비교
- ${period === 'today' ? '오늘 진행률' : '주간 추세'}

#### ⏰ 시간 관리 분석
- 마감일 준수율 평가 (${onTimeRate}%)
- 연체된 작업이 있으면 구체적 언급
- 시간대별 업무 집중도 (가장 바쁜 시간: ${busiestTimeSlot ? busiestTimeSlot[0] : '없음'})

#### 📈 생산성 패턴
- ${period === 'week' ? `요일별 패턴 (가장 바쁜 요일: ${busiestDay ? busiestDay[0] + '요일' : '없음'})` : '하루 중 생산성 높은 시간대'}
- 특정 시간대나 요일에 작업이 몰려있으면 분산 필요성 언급
- 완료하기 쉬운 작업의 공통점 (우선순위, 카테고리 등)

#### 📊 업무 분포
- 카테고리별 비율 (가장 많은: ${topCategory ? topCategory[0] : '없음'})
- 특정 유형의 작업에 편중되어 있는지
- 균형 잡힌 업무 분배 여부

#### 💡 발견된 패턴
- 자주 미루는 작업 유형 (낮은 완료율의 우선순위나 카테고리)
- 잘 완료하는 작업의 특징
- 개선이 필요한 영역

**작성 스타일**:
- "~하고 있습니다" (현재 진행형)
- 구체적인 숫자 포함
- 긍정적 → 개선점 순서
- 예: "오후(12-18시)에 ${timeDistribution.afternoon.total}개의 할 일이 집중되어 있어, 시간 여유가 필요해 보입니다."

### 4️⃣ recommendations (실행 가능한 추천) - 3~5개
**SMART 원칙** (Specific, Measurable, Achievable, Relevant, Time-bound)을 따라 작성:

#### 🎯 우선순위 조정
- ${overdueTasks > 0 ? `연체된 ${overdueTasks}개 작업을 우선 처리하세요.` : ''}
- ${upcomingTasks > 0 ? `3일 이내 마감인 ${upcomingTasks}개 작업에 집중하세요.` : ''}
- 긴급/중요 매트릭스를 활용한 재배치

#### ⏰ 시간 관리 팁
- ${period === 'today' ? `오늘 남은 시간(${24 - parseInt(currentTime.split(':')[0])}시간)을 고려한 작업 순서` : '주간 일정 재조정'}
- 시간대별 최적 작업 배치 (예: "오전에는 중요한 업무를 먼저")
- ${timeDistribution.afternoon.incomplete > timeDistribution.morning.incomplete ? '오후에 작업이 몰려있으니 오전에 일부를 처리하세요.' : ''}

#### 📊 업무 분산 전략
- ${period === 'week' && busiestDay && busiestDay[1].total > 5 ? `${busiestDay[0]}요일 업무 과부하를 다른 날로 분산하세요.` : ''}
- 카테고리별로 그룹화하여 일괄 처리
- 작은 작업들은 한 번에 몰아서 처리

#### 💪 생산성 향상
- 완료율이 높은 ${priorityAnalysis.low.rate > priorityAnalysis.high.rate ? '우선순위 낮은 작업' : '긴급 작업'}의 패턴을 다른 작업에도 적용
- 가장 생산적인 시간대(${busiestTimeSlot ? busiestTimeSlot[0] : '오전'})에 중요한 업무 배치
- ${avgDaysToComplete > 5 ? '할 일을 더 작은 단위로 쪼개보세요.' : ''}

#### 🌟 긍정적 피드백 & 동기부여
- 이미 완료한 작업 칭찬 (구체적으로)
- 완료율이 높으면 "잘하고 계십니다!" 강조
- ${parseFloat(completionRate) >= 80 ? '완료율이 매우 높습니다! 계속 유지하세요! 🎉' : ''}
- ${period === 'week' ? '이번 주 목표 달성까지 조금만 더 힘내세요!' : '오늘 하루도 화이팅!'}

**작성 스타일**:
- "~하세요" (친근한 제안)
- "~하는 것을 추천합니다" (격식 있는 조언)
- "~하면 좋을 것 같아요" (부드러운 권유)
- 실제로 실천 가능한 구체적 행동
- 긍정적이고 격려하는 톤

## 🎨 전체 작성 가이드라인

### ✅ 해야 할 것:
1. **데이터 기반**: 제공된 통계를 최대한 활용
2. **구체적**: "많다"보다 "5개"처럼 숫자 사용
3. **긍정적**: 잘하는 부분을 먼저 언급
4. **실용적**: 바로 실천 가능한 조언
5. **격려**: 사용자에게 동기부여
6. **자연스러운 한국어**: 딱딱하지 않게
7. **이모지 활용**: 적절하게 (과하지 않게)

### ❌ 하지 말아야 할 것:
1. 비판적이거나 부정적인 표현
2. 막연하고 추상적인 조언
3. 실현 불가능한 제안
4. 과도한 이모지 사용
5. 공격적이거나 명령조 톤

## 🚀 최종 체크리스트
- [ ] 모든 통계 수치를 활용했는가?
- [ ] 긍정적인 피드백을 포함했는가?
- [ ] 실행 가능한 구체적 조언인가?
- [ ] ${period === 'today' ? '오늘 집중해야 할 작업을 명확히 했는가?' : '주간 패턴과 다음 주 계획을 제시했는가?'}
- [ ] 한국어가 자연스러운가?
- [ ] 사용자가 읽고 기분이 좋아지는가?

위 모든 정보를 바탕으로 사용자에게 **진짜 도움이 되는** 분석 결과를 제공하세요!`,
    });

    console.log('✅ AI 분석 완료:', result.object);
    
    // 💰 비용 모니터링 (토큰 사용량 로깅)
    if (result.usage) {
      const usage: any = result.usage; // AI SDK usage 타입이 모델마다 다를 수 있음
      const inputTokens = usage.promptTokens || usage.prompt || 0;
      const outputTokens = usage.completionTokens || usage.completion || 0;
      const totalTokens = usage.totalTokens || usage.total || inputTokens + outputTokens;
      const estimatedCost = (inputTokens * 0.00015 + outputTokens * 0.0006) / 1000;
      
      console.log('💰 토큰 사용량:', {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
        estimated_cost_usd: `$${estimatedCost.toFixed(6)}`,
        estimated_cost_krw: `${(estimatedCost * 1500).toFixed(2)}원`
      });
    }

    return NextResponse.json({
      success: true,
      data: result.object,
      meta: {
        analyzed_at: new Date().toISOString(),
        period,
        total_todos: totalCount,
        completion_rate: parseFloat(completionRate),
      }
    });

  } catch (error: any) {
    console.error('❌ AI 분석 오류:', error);

    // 에러 타입별 처리
    if (error?.message?.includes('API key') || error?.message?.includes('authentication')) {
      return NextResponse.json(
        { 
          error: 'AI 서비스 인증 실패',
          details: 'API 키를 확인해주세요.'
        },
        { status: 401 }
      );
    }

    if (error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
      return NextResponse.json(
        { 
          error: 'AI 서비스 사용량 초과',
          details: '잠시 후 다시 시도해주세요.',
          retry_after: '1분'
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'AI 분석 실패',
        details: error?.message || '알 수 없는 오류가 발생했습니다.',
        retry: '잠시 후 다시 시도해주세요.'
      },
      { status: 500 }
    );
  }
}
