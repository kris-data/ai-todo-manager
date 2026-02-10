/**
 * AI 할 일 분석 컴포넌트 (개선된 UI)
 * 사용자의 할 일 목록을 분석하고 요약, 인사이트, 추천 사항 제공
 */

'use client';

import { useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  Lightbulb, 
  Loader2, 
  Calendar, 
  CheckCircle2,
  Target,
  Clock,
  BarChart3,
  Flame,
  Brain,
  Zap,
  Heart,
  Trophy,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import type { Todo } from '@/types/todo';

interface AnalysisResult {
  summary: string;
  urgentTasks: string[];
  insights: string[];
  recommendations: string[];
}

interface TodoAnalysisProps {
  todos: Todo[];
}

export const TodoAnalysis = ({ todos }: TodoAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [todayAnalysis, setTodayAnalysis] = useState<AnalysisResult | null>(null);
  const [weekAnalysis, setWeekAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * 오늘 할 일 필터링
   */
  const getTodayTodos = (): Todo[] => {
    const today = new Date().toISOString().split('T')[0];
    return todos.filter((todo) => {
      if (!todo.due_date) return false;
      const dueDate = new Date(todo.due_date).toISOString().split('T')[0];
      return dueDate === today;
    });
  };

  /**
   * 이번 주 할 일 필터링
   */
  const getWeekTodos = (): Todo[] => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // 이번 주 일요일
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // 이번 주 토요일
    endOfWeek.setHours(23, 59, 59, 999);

    return todos.filter((todo) => {
      if (!todo.due_date) return false;
      const dueDate = new Date(todo.due_date);
      return dueDate >= startOfWeek && dueDate <= endOfWeek;
    });
  };

  /**
   * AI 분석 요청
   */
  const handleAnalyze = async (period: 'today' | 'week') => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const targetTodos = period === 'today' ? getTodayTodos() : getWeekTodos();

      console.log(`📊 ${period} 분석 시작:`, targetTodos.length, '개 할 일');

      const response = await fetch('/api/ai/analyze-todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          todos: targetTodos,
          period,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'AI 분석에 실패했습니다.');
      }

      if (period === 'today') {
        setTodayAnalysis(result.data);
      } else {
        setWeekAnalysis(result.data);
      }

      toast.success('AI 분석 완료!', {
        description: period === 'today' ? '오늘의 할 일을 분석했습니다.' : '이번 주 할 일을 분석했습니다.',
      });
    } catch (err: any) {
      console.error('❌ AI 분석 오류:', err);
      setError(err.message || 'AI 분석 중 오류가 발생했습니다.');
      toast.error('AI 분석 실패', {
        description: err.message || '다시 시도해주세요.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * 완료율 계산
   */
  const getCompletionStats = (targetTodos: Todo[]) => {
    const total = targetTodos.length;
    const completed = targetTodos.filter((t) => t.completed).length;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, incomplete: total - completed, rate };
  };

  /**
   * 오늘의 요약 렌더링
   */
  const renderTodayAnalysis = (analysis: AnalysisResult | null) => {
    const targetTodos = getTodayTodos();
    const stats = getCompletionStats(targetTodos);

    if (!analysis) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <Calendar className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">
              오늘의 할 일을 AI로 분석해보세요
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {stats.total > 0
                ? `오늘 ${stats.total}개의 할 일을 분석하여 집중해야 할 작업과 시간 관리 팁을 제공합니다.`
                : '오늘 등록된 할 일이 없습니다. 먼저 할 일을 추가해주세요.'}
            </p>
          </div>
          <Button
            onClick={() => handleAnalyze('today')}
            disabled={isAnalyzing || stats.total === 0}
            size="lg"
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                AI 요약 보기
              </>
            )}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 완료율 시각화 */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">오늘의 완료율</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">
                    {stats.rate.toFixed(0)}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({stats.completed}/{stats.total})
                  </span>
                </div>
              </div>
              <div className="p-3 bg-primary/20 rounded-full">
                <Target className="h-8 w-8 text-primary" />
              </div>
            </div>
            <Progress value={stats.rate} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.incomplete > 0 
                ? `${stats.incomplete}개의 할 일이 남았습니다.`
                : '모든 할 일을 완료했습니다! 🎉'}
            </p>
          </CardContent>
        </Card>

        {/* 요약 메시지 */}
        <Alert className="border-l-4 border-l-primary">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="text-sm font-medium">
            {analysis.summary}
          </AlertDescription>
        </Alert>

        {/* 긴급 작업 하이라이트 */}
        {analysis.urgentTasks && analysis.urgentTasks.length > 0 && (
          <Card className="border-2 border-destructive/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <Flame className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-base">지금 집중하세요!</CardTitle>
                  <CardDescription>
                    {analysis.urgentTasks.length}개의 긴급 작업
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.urgentTasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-destructive to-destructive/70 text-white text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium flex-1">{task}</span>
                  <Clock className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 인사이트 카드 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-accent" />
            <h4 className="font-semibold">AI 인사이트</h4>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {analysis.insights.map((insight, index) => (
              <Card key={index} className="border-l-4 border-l-accent hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-accent" />
                  </div>
                  <p className="text-sm flex-1">{insight}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 추천 사항 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <h4 className="font-semibold">실행 가능한 추천</h4>
          </div>
          <div className="space-y-2">
            {analysis.recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg"
              >
                <span className="text-xl flex-shrink-0">💡</span>
                <span className="text-sm flex-1">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 재분석 버튼 */}
        <Button
          variant="outline"
          onClick={() => handleAnalyze('today')}
          disabled={isAnalyzing}
          className="w-full gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              다시 분석하기
            </>
          )}
        </Button>
      </div>
    );
  };

  /**
   * 이번 주 요약 렌더링
   */
  const renderWeekAnalysis = (analysis: AnalysisResult | null) => {
    const targetTodos = getWeekTodos();
    const stats = getCompletionStats(targetTodos);

    // 요일별 통계
    const dayStats: Record<string, { total: number; completed: number }> = {
      '일': { total: 0, completed: 0 },
      '월': { total: 0, completed: 0 },
      '화': { total: 0, completed: 0 },
      '수': { total: 0, completed: 0 },
      '목': { total: 0, completed: 0 },
      '금': { total: 0, completed: 0 },
      '토': { total: 0, completed: 0 },
    };

    targetTodos.forEach((todo) => {
      if (!todo.due_date) return;
      const day = ['일', '월', '화', '수', '목', '금', '토'][new Date(todo.due_date).getDay()];
      dayStats[day].total++;
      if (todo.completed) dayStats[day].completed++;
    });

    if (!analysis) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="p-4 bg-secondary/10 rounded-full">
            <BarChart3 className="h-12 w-12 text-secondary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">
              이번 주 패턴을 AI로 분석해보세요
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {stats.total > 0
                ? `이번 주 ${stats.total}개의 할 일을 분석하여 생산성 패턴과 다음 주 계획을 제안합니다.`
                : '이번 주 등록된 할 일이 없습니다. 먼저 할 일을 추가해주세요.'}
            </p>
          </div>
          <Button
            onClick={() => handleAnalyze('week')}
            disabled={isAnalyzing || stats.total === 0}
            size="lg"
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                AI 요약 보기
              </>
            )}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 주간 완료율 */}
        <Card className="border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">이번 주 완료율</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-secondary">
                    {stats.rate.toFixed(0)}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({stats.completed}/{stats.total})
                  </span>
                </div>
              </div>
              <div className="p-3 bg-secondary/20 rounded-full">
                <Trophy className="h-8 w-8 text-secondary" />
              </div>
            </div>
            <Progress value={stats.rate} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.rate >= 70 
                ? '훌륭한 주간 생산성입니다! 🌟'
                : stats.rate >= 50
                ? '절반 이상 완료했습니다! 조금만 더! 💪'
                : '다음 주는 더 나아질 거예요! 화이팅! 🚀'}
            </p>
          </CardContent>
        </Card>

        {/* 요일별 생산성 패턴 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">요일별 생산성 패턴</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(dayStats).map(([day, data]) => {
              const dayRate = data.total > 0 ? (data.completed / data.total) * 100 : 0;
              const maxTotal = Math.max(...Object.values(dayStats).map(d => d.total));
              const barWidth = maxTotal > 0 ? (data.total / maxTotal) * 100 : 0;
              
              return (
                <div key={day} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium w-8">{day}</span>
                    <span className="text-muted-foreground text-xs">
                      {data.completed}/{data.total}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-6 bg-secondary/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-secondary to-secondary/70 transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {dayRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 요약 메시지 */}
        <Alert className="border-l-4 border-l-secondary">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="text-sm font-medium">
            {analysis.summary}
          </AlertDescription>
        </Alert>

        {/* 긴급 작업 */}
        {analysis.urgentTasks && analysis.urgentTasks.length > 0 && (
          <Card className="border-2 border-amber-300/50 dark:border-amber-900/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <CardTitle className="text-base">이번 주 중요 작업</CardTitle>
                  <CardDescription>
                    {analysis.urgentTasks.length}개 작업 집중 필요
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.urgentTasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm flex-1">{task}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 인사이트 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-accent" />
            <h4 className="font-semibold">주간 인사이트</h4>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {analysis.insights.map((insight, index) => (
              <Card key={index} className="border-l-4 border-l-accent hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">📊</span>
                  <p className="text-sm flex-1">{insight}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 다음 주 계획 (추천 사항) */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-dashed border-primary/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">다음 주 계획 제안</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-white dark:bg-slate-950 border border-primary/20 rounded-lg"
              >
                <span className="text-xl flex-shrink-0">🎯</span>
                <span className="text-sm flex-1">{recommendation}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 재분석 버튼 */}
        <Button
          variant="outline"
          onClick={() => handleAnalyze('week')}
          disabled={isAnalyzing}
          className="w-full gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              다시 분석하기
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-slate-950 rounded-lg shadow-sm">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              AI 요약 및 분석
              <Badge variant="secondary" className="text-xs">Beta</Badge>
            </CardTitle>
            <CardDescription>
              할 일 패턴을 분석하여 맞춤형 인사이트 제공
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* 에러 상태 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  // 마지막 분석을 재시도
                }}
                className="gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                재시도
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-11">
            <TabsTrigger value="today" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">오늘의 요약</span>
              <span className="sm:hidden">오늘</span>
            </TabsTrigger>
            <TabsTrigger value="week" className="gap-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">이번 주 요약</span>
              <span className="sm:hidden">주간</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-6">
            {renderTodayAnalysis(todayAnalysis)}
          </TabsContent>

          <TabsContent value="week" className="mt-6">
            {renderWeekAnalysis(weekAnalysis)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
