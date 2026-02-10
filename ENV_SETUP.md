# 환경 변수 설정 가이드

## 📋 `.env.local` 파일 생성

프로젝트 루트에 `.env.local` 파일을 만들고 아래 내용을 복사하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://fqmekuoqfrworcggbeky.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_o6bkdZop8ov0yqk2MSZ00Q_3VoYoBjW

# OpenAI API (AI 할 일 생성 기능)
# ⚠️ 비용 관리 필수:
# - gpt-4o-mini 모델 사용 (가장 저렴: $0.00015/1K tokens)
# - OpenAI 대시보드에서 월 사용 한도 $10 설정 권장
# - 예상 비용: 개인 사용 시 월 $1-5 수준
OPENAI_API_KEY=sk-proj-여기에_실제_키를_입력하세요
```

## 🔑 OpenAI API 키 발급 방법

1. https://platform.openai.com/api-keys 접속
2. 로그인 (없으면 회원가입)
3. **"Create new secret key"** 클릭
4. 이름 입력 (예: `ai-todo-manager`)
5. **복사** 버튼 클릭 (⚠️ 한 번만 표시됨!)
6. `.env.local` 파일의 `OPENAI_API_KEY=` 뒤에 붙여넣기

## ⚙️ 서버 재시작

환경 변수를 추가/수정한 후에는 **반드시 서버를 재시작**해야 합니다:

```bash
# 터미널에서 Ctrl+C로 서버 중지
# 그리고 다시 시작
npm run dev
```

## ✅ 확인 방법

1. 브라우저 새로고침 (`Ctrl + Shift + R`)
2. 개발자 도구 열기 (`F12`)
3. **Console** 탭 확인
4. "AI로 할 일 생성" 기능 테스트
5. 콘솔에 출력되는 로그 확인:
   - ✅ `🔍 AI API Response Status: 200` → 성공!
   - ❌ `🔍 AI API Response Status: 401` → API 키 오류
   - ❌ `🔍 AI API Response Status: 404` → 라우트 오류
   - ❌ `🔍 AI API Response Status: 500` → 서버 오류

## 🐛 문제 해결

### API 키 오류 (401)
```
❌ AI 서비스 인증에 실패했습니다. API 키를 확인해주세요.
```
→ `.env.local`에 `OPENAI_API_KEY`가 제대로 설정되었는지 확인
→ 서버 재시작 (`Ctrl+C` → `npm run dev`)

### 라우트 오류 (404)
```
❌ HTTP 404: ...
```
→ API 라우트 파일 확인: `app/api/ai/parse-todo/route.ts`

### 서버 오류 (500)
```
❌ AI 할 일 생성 중 오류가 발생했습니다.
```
→ 터미널에서 상세한 에러 로그 확인
→ 콘솔에 `debug` 정보 확인

## 💰 비용 안내

- **무료 크레딧**: 신규 가입 시 $5
- **gpt-4o-mini**: 매우 저렴
  - 입력 1M 토큰: $0.15
  - 출력 1M 토큰: $0.60
  - **실사용**: 1회 변환 ≈ $0.0003 (1000회 ≈ $0.30)
