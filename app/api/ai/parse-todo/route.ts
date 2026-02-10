/**
 * AI 할 일 파싱 API Route
 * 자연어 입력을 구조화된 할 일 데이터로 변환
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Runtime 설정 (Node.js 환경)
export const runtime = 'nodejs';

/**
 * 할 일 파싱 결과 스키마
 * OpenAI는 모든 필드를 required로 해야 함 (optional 불가)
 */
const TodoSchema = z.object({
  title: z.string().describe('할 일의 제목 (간결하고 명확하게)'),
  description: z.string().describe('할 일의 상세 설명 (없으면 빈 문자열 "")'),
  due_date: z.string().describe('마감일 (YYYY-MM-DD 형식, 없으면 빈 문자열 "")'),
  due_time: z.string().describe('마감 시간 (HH:MM 형식, 24시간제, 없으면 빈 문자열 "")'),
  priority: z.enum(['high', 'medium', 'low']).describe(
    '우선순위: high(긴급/중요), medium(보통), low(낮음)'
  ),
  category: z.array(z.string()).describe(
    '카테고리 배열 (예: ["업무", "개인", "학습", "운동", "취미"], 없으면 빈 배열 [])'
  ),
});

/**
 * 입력 텍스트 전처리 함수
 */
const preprocessInput = (input: string): string => {
  // 1. 앞뒤 공백 제거
  let processed = input.trim();
  
  // 2. 연속된 공백을 하나로 통합
  processed = processed.replace(/\s+/g, ' ');
  
  // 3. 연속된 줄바꿈 제거 (최대 2개까지만 허용)
  processed = processed.replace(/\n{3,}/g, '\n\n');
  
  return processed;
};

/**
 * 입력 검증 함수
 */
const validateInput = (input: string): { valid: boolean; error?: string } => {
  // 1. 빈 문자열 체크
  if (!input || input.trim().length === 0) {
    return { 
      valid: false, 
      error: '할 일 내용을 입력해주세요.' 
    };
  }

  // 2. 최소 길이 체크 (2자)
  if (input.trim().length < 2) {
    return { 
      valid: false, 
      error: '할 일은 최소 2자 이상 입력해주세요.' 
    };
  }

  // 3. 최대 길이 체크 (500자)
  if (input.length > 500) {
    return { 
      valid: false, 
      error: '할 일은 최대 500자까지 입력 가능합니다.' 
    };
  }

  // 4. 의미 있는 문자 포함 여부 체크 (이모지만 있거나 특수문자만 있는 경우)
  const meaningfulChars = input.replace(/[\s\p{Emoji}\p{P}]/gu, '');
  if (meaningfulChars.length === 0) {
    return { 
      valid: false, 
      error: '의미 있는 내용을 입력해주세요.' 
    };
  }

  return { valid: true };
};

/**
 * 생성된 할 일 데이터 후처리 함수
 */
const postprocessTodoData = (data: any, currentDate: string): any => {
  const processed = { ...data };

  // 1. 제목 길이 조정 (1-50자)
  if (processed.title) {
    processed.title = processed.title.trim();
    
    // 너무 짧은 경우 (1자 미만)
    if (processed.title.length === 0) {
      processed.title = '새 할 일';
    }
    
    // 너무 긴 경우 (50자 초과)
    if (processed.title.length > 50) {
      processed.title = processed.title.substring(0, 47) + '...';
    }
  }

  // 2. 설명 길이 제한 (최대 500자)
  if (processed.description && processed.description.length > 500) {
    processed.description = processed.description.substring(0, 497) + '...';
  }

  // 3. 과거 날짜 체크 및 수정
  if (processed.due_date && processed.due_date !== '') {
    const dueDate = new Date(processed.due_date);
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    
    if (dueDate < today) {
      console.warn('⚠️ 과거 날짜 감지:', processed.due_date, '→ 오늘로 변경');
      processed.due_date = currentDate;
    }
  }

  // 4. 시간 형식 검증 (HH:MM)
  if (processed.due_time && processed.due_time !== '') {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(processed.due_time)) {
      console.warn('⚠️ 잘못된 시간 형식:', processed.due_time, '→ 빈 문자열로 변경');
      processed.due_time = '';
    }
  }

  // 5. 우선순위 기본값 (누락 시 medium)
  if (!processed.priority || !['high', 'medium', 'low'].includes(processed.priority)) {
    processed.priority = 'medium';
  }

  // 6. 카테고리 배열 검증
  if (!Array.isArray(processed.category)) {
    processed.category = [];
  }

  // 7. 카테고리 중복 제거 및 최대 3개로 제한
  processed.category = [...new Set(processed.category)].slice(0, 3);

  return processed;
};

/**
 * POST /api/ai/parse-todo
 * 자연어 입력을 파싱하여 할 일 데이터로 변환
 */
export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();

    // 📝 1단계: 타입 검증
    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { 
          error: '잘못된 입력 형식입니다.',
          details: '문자열 형식의 할 일 내용을 입력해주세요.'
        },
        { status: 400 }
      );
    }

    // 🧹 2단계: 전처리
    const preprocessedInput = preprocessInput(input);
    console.log('📝 전처리된 입력:', preprocessedInput);

    // ✅ 3단계: 입력 검증
    const validation = validateInput(preprocessedInput);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: validation.error,
          details: '입력 내용을 확인하고 다시 시도해주세요.'
        },
        { status: 400 }
      );
    }

    // 🔑 4단계: API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY가 설정되지 않았습니다.');
      return NextResponse.json(
        { 
          error: 'AI 서비스 설정 오류',
          details: '서버 관리자에게 문의해주세요. (API 키 미설정)'
        },
        { status: 500 }
      );
    }

    // 📅 5단계: 현재 날짜/시간 정보 (한국 시간)
    const now = new Date();
    const kstOffset = 9 * 60; // UTC+9
    const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);
    const currentDate = kstNow.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = kstNow.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    const currentDateTime = `${currentDate} ${currentTime}`;
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][kstNow.getDay()];

    // OpenAI API로 할 일 파싱 (비용 최적화)
    const result = await generateObject({
      model: openai('gpt-4o-mini'), // 가장 저렴한 모델 ($0.00015/1K input tokens)
      schema: TodoSchema,
      temperature: 0.2, // 낮은 온도 = 일관된 응답, 토큰 절약
      // 참고: generateObject는 schema 기반으로 응답 길이가 자동 제한됨
      prompt: `당신은 할 일 관리 AI 전문가입니다. 사용자의 자연어 입력을 분석하여 구조화된 할 일 데이터로 변환하세요.

⚠️ 중요: 응답은 JSON 스키마에 맞춰 최소한의 정보만 포함하세요. 불필요한 설명이나 추가 텍스트는 생성하지 마세요.

## 📅 현재 시간 정보
- **현재 날짜/시간**: ${currentDateTime} (${dayOfWeek}요일)
- **연도**: ${kstNow.getFullYear()}년
- **월**: ${kstNow.getMonth() + 1}월
- **일**: ${kstNow.getDate()}일

## 🎯 변환 규칙

### 1. 제목 (title)
- 핵심 행동을 간결하게 표현 (20자 이내 권장)
- 불필요한 조사("을", "를", "에", "의") 제거
- 예: "보고서를 작성하기" → "보고서 작성"

### 2. 날짜 처리 (due_date)
**반드시 YYYY-MM-DD 형식으로 반환!**

상대적 날짜 표현 변환:
- "오늘" → ${currentDate}
- "내일" → ${new Date(kstNow.getTime() + 24*60*60*1000).toISOString().split('T')[0]}
- "모레" → ${new Date(kstNow.getTime() + 2*24*60*60*1000).toISOString().split('T')[0]}
- "이번 주 금요일" → 이번 주에서 가장 가까운 금요일 날짜 계산
- "다음 주 월요일" → 다음 주의 첫 월요일 날짜 계산
- "다음주", "다음 주" → 다음 주 월요일
- "이번주 끝", "주말" → 이번 주 토요일

날짜가 **전혀 언급되지 않으면** 빈 문자열 "" 반환

### 3. 시간 처리 (due_time)
**반드시 HH:MM 형식 (24시간제)으로 반환!**

시간대별 기본값:
- "아침", "오전" → 09:00
- "점심" → 12:00
- "오후" → 14:00
- "저녁" → 18:00
- "밤" → 21:00

명시된 시간:
- "3시", "오전 3시" → 03:00
- "오후 3시", "15시" → 15:00
- "자정" → 00:00
- "정오" → 12:00

시간이 **전혀 언급되지 않으면**:
- 업무 관련 → 09:00 (기본 업무 시작 시간)
- 개인 일정 → 18:00 (기본 저녁 시간)
- 날짜도 없으면 → 빈 문자열 ""

### 4. 우선순위 (priority)
**키워드 기반 자동 분류:**

- **high (높음)**:
  * 키워드: "급하게", "중요한", "빨리", "꼭", "반드시", "긴급", "ASAP"
  * 예: "급하게 보고서 작성", "꼭 회의 참석"

- **medium (보통)**:
  * 키워드 없음 또는 "보통", "적당히"
  * 대부분의 일반적인 할 일
  * 예: "이메일 확인", "자료 정리"

- **low (낮음)**:
  * 키워드: "여유롭게", "천천히", "언젠가", "시간 날 때"
  * 예: "언젠가 책 읽기", "천천히 정리"

### 5. 카테고리 (category)
**키워드 기반 자동 분류 (최대 2개):**

- **"업무"**: 
  * 키워드: "회의", "보고서", "프로젝트", "업무", "미팅", "PT", "발표", "제안서", "계약"
  
- **"개인"**: 
  * 키워드: "쇼핑", "친구", "가족", "개인", "약속", "집안일", "청소", "빨래"
  
- **"건강"**: 
  * 키워드: "운동", "병원", "건강", "요가", "헬스", "러닝", "조깅", "산책", "검진"
  
- **"학습"**: 
  * 키워드: "공부", "책", "강의", "학습", "수업", "스터디", "자격증", "시험", "독서"

카테고리 판단 불가 시 빈 배열 [] 반환

### 6. 설명 (description)
- 입력에 **구체적인 추가 정보**가 있으면 포함
- 단순 반복이 아닌 **유용한 세부사항**만 추출
- 없으면 빈 문자열 "" 반환

## 📝 변환 예시

**입력**: "내일 오후 3시까지 중요한 프로젝트 보고서 작성"
**출력**:
\`\`\`json
{
  "title": "프로젝트 보고서 작성",
  "description": "",
  "due_date": "${new Date(kstNow.getTime() + 24*60*60*1000).toISOString().split('T')[0]}",
  "due_time": "15:00",
  "priority": "high",
  "category": ["업무"]
}
\`\`\`

**입력**: "다음주 월요일 아침 팀 미팅"
**출력**:
\`\`\`json
{
  "title": "팀 미팅",
  "description": "",
  "due_date": "다음 주 월요일 날짜 계산",
  "due_time": "09:00",
  "priority": "medium",
  "category": ["업무"]
}
\`\`\`

**입력**: "언젠가 책 읽기"
**출력**:
\`\`\`json
{
  "title": "책 읽기",
  "description": "",
  "due_date": "",
  "due_time": "",
  "priority": "low",
  "category": ["학습"]
}
\`\`\`

## 🎯 사용자 입력 분석

**입력**: "${preprocessedInput}"

위 입력을 위의 규칙에 따라 정확히 분석하여 JSON 형식으로 변환하세요.
모든 필드는 **반드시 포함**되어야 하며, 값이 없으면 빈 문자열 "" 또는 빈 배열 []을 사용하세요.`,
    });

    console.log('🤖 AI 원본 파싱 결과:', result.object);
    
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

    // 🔧 6단계: 후처리
    const processedData = postprocessTodoData(result.object, currentDate);
    console.log('✅ 후처리 완료 결과:', processedData);

    // 📤 7단계: 성공 응답 반환
    return NextResponse.json({
      success: true,
      data: processedData,
      meta: {
        processed_at: new Date().toISOString(),
        original_input: input,
        preprocessed_input: preprocessedInput,
      }
    });
  } catch (error: any) {
    // 🔍 상세한 에러 로깅
    console.error('❌ AI 할 일 파싱 오류 상세:');
    console.error('- Error name:', error?.name);
    console.error('- Error message:', error?.message);
    console.error('- Error cause:', error?.cause);
    console.error('- Full error:', JSON.stringify(error, null, 2));

    // 🔑 인증 오류 (401)
    if (error?.message?.includes('API key') || 
        error?.message?.includes('Incorrect API key') ||
        error?.message?.includes('authentication')) {
      console.error('🔑 API 키 오류 감지');
      return NextResponse.json(
        { 
          error: 'AI 서비스 인증 실패',
          details: 'API 키가 유효하지 않습니다. 관리자에게 문의해주세요.',
          support: '이 문제가 계속되면 서비스 관리자에게 문의하세요.'
        },
        { status: 401 }
      );
    }

    // ⏱️ 사용량 초과 오류 (429)
    if (error?.message?.includes('quota') || 
        error?.message?.includes('rate limit') ||
        error?.message?.includes('Too Many Requests')) {
      console.error('⏱️ Rate limit 오류 감지');
      return NextResponse.json(
        { 
          error: 'AI 서비스 사용량 초과',
          details: '현재 요청이 많아 일시적으로 서비스를 이용할 수 없습니다.',
          retry_after: '1분 후에 다시 시도해주세요.',
          support: '문제가 계속되면 관리자에게 문의하세요.'
        },
        { status: 429 }
      );
    }

    // 🌐 네트워크 오류
    if (error?.message?.includes('fetch') || 
        error?.message?.includes('network') ||
        error?.message?.includes('timeout')) {
      console.error('🌐 네트워크 오류 감지');
      return NextResponse.json(
        { 
          error: '네트워크 연결 오류',
          details: 'AI 서비스에 연결할 수 없습니다.',
          retry: '잠시 후 다시 시도해주세요.',
          support: '인터넷 연결을 확인하거나 관리자에게 문의하세요.'
        },
        { status: 503 }
      );
    }

    // 📋 JSON 파싱 오류
    if (error?.message?.includes('JSON') || 
        error?.message?.includes('parse')) {
      console.error('📋 JSON 파싱 오류 감지');
      return NextResponse.json(
        { 
          error: 'AI 응답 처리 실패',
          details: 'AI가 생성한 데이터를 읽을 수 없습니다.',
          retry: '다시 시도해주세요.',
          support: '문제가 반복되면 입력 내용을 수정해보세요.'
        },
        { status: 500 }
      );
    }

    // ❓ 기타 서버 오류 (500)
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    console.error('🔑 OPENAI_API_KEY 존재 여부:', hasApiKey);
    
    return NextResponse.json(
      {
        error: 'AI 할 일 생성 실패',
        details: '예상치 못한 오류가 발생했습니다.',
        message: error?.message || '알 수 없는 오류',
        retry: '잠시 후 다시 시도해주세요.',
        support: '문제가 계속되면 다음 정보와 함께 관리자에게 문의하세요.',
        debug: {
          error_type: error?.name,
          has_api_key: hasApiKey,
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET 요청 방지
 */
export async function GET() {
  return NextResponse.json(
    { error: 'POST 요청만 지원합니다.' },
    { status: 405 }
  );
}
