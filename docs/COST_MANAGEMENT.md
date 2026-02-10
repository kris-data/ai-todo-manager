# 💰 OpenAI API 비용 관리 가이드

## 📊 현재 비용 구조 (2026년 기준)

### 사용 중인 모델: `gpt-4o-mini`
- **입력 (Input)**: $0.00015 / 1K tokens
- **출력 (Output)**: $0.0006 / 1K tokens

## 🎯 프로젝트별 예상 비용

### 1. 할 일 자연어 파싱 (`/api/ai/parse-todo`)
```
평균 토큰 사용량:
- Input: ~500 tokens (프롬프트 + 사용자 입력)
- Output: ~200 tokens (JSON 응답)

1회 호출 비용:
- Input: 500 × $0.00015 / 1000 = $0.000075
- Output: 200 × $0.0006 / 1000 = $0.00012
- 총: $0.000195 (약 0.3원)

하루 100회 사용 시:
- $0.0195 (약 30원)
- 한 달 (30일): $0.585 (약 900원)
```

### 2. 할 일 분석 (`/api/ai/analyze-todos`)
```
평균 토큰 사용량:
- Input: ~1,500 tokens (상세 통계 + 프롬프트)
- Output: ~500 tokens (분석 결과)

1회 호출 비용:
- Input: 1,500 × $0.00015 / 1000 = $0.000225
- Output: 500 × $0.0006 / 1000 = $0.0003
- 총: $0.000525 (약 0.8원)

하루 20회 사용 시:
- $0.0105 (약 16원)
- 한 달 (30일): $0.315 (약 480원)
```

### 📈 월간 예상 총 비용
```
개인 사용자 (하루 파싱 100회, 분석 20회):
- 파싱: $0.585
- 분석: $0.315
- 총: $0.90 (약 1,350원/월)

소규모 팀 (10명, 하루 파싱 1,000회, 분석 200회):
- 파싱: $5.85
- 분석: $3.15
- 총: $9.00 (약 13,500원/월)
```

## 🛡️ 비용 폭주 방지 조치

### ✅ 이미 구현된 보호 장치

#### 1. 입력 길이 제한
```typescript
// app/api/ai/parse-todo/route.ts
if (preprocessedInput.length > 500) {
  return NextResponse.json(
    { error: '할 일은 최대 500자까지 입력 가능합니다.' },
    { status: 400 }
  );
}
```

#### 2. 응답 토큰 제한
```typescript
// Parse Todo API
maxTokens: 500  // 최대 500 토큰까지만 생성

// Analyze API
maxTokens: 1000 // 최대 1000 토큰까지만 생성
```

#### 3. Temperature 최적화
```typescript
temperature: 0.2-0.3 // 낮은 온도 = 일관된 응답, 토큰 절약
```

#### 4. 에러 처리
```typescript
// 429 Rate Limit 에러 자동 처리
if (error?.message?.includes('rate limit')) {
  return NextResponse.json(
    { 
      error: 'AI 서비스 사용량 초과',
      retry_after: '1분'
    },
    { status: 429 }
  );
}
```

## 🔧 추가 보호 조치 (선택적)

### 1. OpenAI 대시보드 설정

#### 사용 한도 설정
1. https://platform.openai.com/account/limits 접속
2. **"Set usage limits"** 클릭
3. **"Monthly budget"** 설정 (예: $10)
4. **"Email notifications"** 활성화:
   - 50% 도달 시 알림
   - 80% 도달 시 알림
   - 100% 도달 시 자동 중지

#### 사용량 모니터링
1. https://platform.openai.com/usage 접속
2. 일일/월간 사용량 확인
3. API별 비용 분석

### 2. 환경별 제한 (코드)

```typescript
// config/rate-limits.ts
export const RATE_LIMITS = {
  development: {
    parsePerHour: 100,
    analyzePerHour: 20,
  },
  production: {
    parsePerHour: 1000,
    analyzePerHour: 200,
  },
};
```

### 3. 사용자별 쿼터 (프로덕션)

```typescript
// lib/rate-limiter.ts
import { Redis } from '@upstash/redis';

export async function checkUserQuota(userId: string, action: 'parse' | 'analyze') {
  const redis = new Redis({ /* ... */ });
  const key = `quota:${userId}:${action}:${Date.now()}`;
  const count = await redis.incr(key);
  await redis.expire(key, 3600); // 1시간

  const limit = action === 'parse' ? 100 : 20;
  if (count > limit) {
    throw new Error('시간당 사용량을 초과했습니다.');
  }
}
```

### 4. 캐싱 (동일 요청 방지)

```typescript
// lib/cache.ts
const cache = new Map<string, { result: any; timestamp: number }>();

export function getCachedResult(input: string) {
  const key = hashInput(input);
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < 3600000) { // 1시간
    return cached.result;
  }
  
  return null;
}
```

## 📊 비용 모니터링 팁

### 1. 로그 분석
```bash
# 터미널에서 확인
grep "AI 파싱 결과" logs/*.log | wc -l  # 파싱 호출 수
grep "AI 분석 완료" logs/*.log | wc -l  # 분석 호출 수
```

### 2. 주간 리포트 설정
```typescript
// scripts/cost-report.ts
// 매주 월요일 오전 9시에 이메일로 비용 리포트 발송
```

### 3. Vercel Analytics (선택)
- Vercel 대시보드에서 API 호출 수 확인
- 함수 실행 시간 모니터링

## 🚨 비상 상황 대응

### 비용 급증 시 조치

#### 1. 즉시 조치
```bash
# .env.local 파일 수정
# OPENAI_API_KEY=sk-... 주석 처리
OPENAI_API_KEY=""  # 빈 문자열로 변경
```

#### 2. OpenAI 대시보드
- API 키 삭제 또는 비활성화
- 사용 한도 $0로 설정

#### 3. 코드 수정
```typescript
// 긴급 비활성화 플래그
const AI_FEATURES_ENABLED = false;

if (!AI_FEATURES_ENABLED) {
  return NextResponse.json(
    { error: 'AI 기능이 일시적으로 비활성화되었습니다.' },
    { status: 503 }
  );
}
```

## 💡 비용 절감 팁

### 1. 프롬프트 최적화
```typescript
// ❌ 나쁜 예: 불필요하게 긴 프롬프트
prompt: `당신은 세계 최고의 AI 전문가입니다. 
수많은 경험과 지식을 바탕으로... (500자 이상)`

// ✅ 좋은 예: 간결하고 명확한 프롬프트
prompt: `할 일을 JSON으로 변환하세요. 
제목, 날짜, 우선순위, 카테고리 추출.`
```

### 2. 응답 최소화
```typescript
// JSON 스키마를 최소화
const TodoSchema = z.object({
  title: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  // 불필요한 필드 제거
});
```

### 3. 조건부 호출
```typescript
// 동일 입력 중복 방지
const hash = hashInput(input);
if (recentlyProcessed.has(hash)) {
  return cachedResult;
}
```

## 🎯 목표 비용

### 개인 프로젝트 (MVP)
- **목표**: $5/월 이하
- **현재 설정**: 충분히 달성 가능 ✅

### 소규모 서비스 (100명)
- **목표**: $50/월 이하
- **예상**: $90/월
- **개선 필요**: 캐싱 도입 권장

### 상용 서비스 (1000명+)
- **목표**: $500/월 이하
- **필수**: 
  - Redis 캐싱
  - Rate Limiting
  - 사용자별 쿼터
  - Webhook 모니터링

## 📚 참고 자료

- [OpenAI Pricing](https://openai.com/api/pricing/)
- [OpenAI Usage Limits](https://platform.openai.com/account/limits)
- [Token Counting](https://platform.openai.com/tokenizer)
- [Best Practices](https://platform.openai.com/docs/guides/production-best-practices)

## 🆘 문제 발생 시

1. **비용 폭주**: 즉시 API 키 비활성화
2. **Rate Limit**: 1분 대기 후 재시도
3. **에러 반복**: OpenAI Status 페이지 확인
4. **예상 초과**: 사용 한도 재설정

---

**마지막 업데이트**: 2026-02-09  
**작성자**: AI Todo Manager Team
