# AI 할 일 생성 빠른 시작 가이드

## 🚀 5분 안에 시작하기

### 1단계: API 키 발급 (2분)

1. https://makersuite.google.com/app/apikey 접속
2. "Create API Key" 클릭
3. API 키 복사

### 2단계: 환경 변수 설정 (1분)

`.env.local` 파일 열기 (없으면 생성):

```env
# 기존 Supabase 설정 (이미 있음)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key

# 새로 추가: Google Gemini API 키
GOOGLE_GENERATIVE_AI_API_KEY=여기에_복사한_API_키_붙여넣기
```

### 3단계: 서버 재시작 (1분)

```bash
# 개발 서버 중지 (Ctrl+C)
# 다시 시작
npm run dev
```

### 4단계: 사용해보기 (1분)

1. 브라우저에서 http://localhost:3000 접속
2. 좌측 "할 일 추가" 카드 확인
3. "AI로 할 일 생성" → "시작하기" 클릭
4. 입력창에 다음 입력:
   ```
   내일 오후 3시까지 중요한 팀 회의 준비하기
   ```
5. "AI 변환" 버튼 클릭 (또는 Ctrl+Enter)
6. 🎉 자동으로 입력된 내용 확인!

## ✅ 제대로 작동하는지 확인

변환 후 다음 내용이 자동으로 입력되어야 합니다:
- ✅ 제목: "팀 회의 준비"
- ✅ 마감일: 내일 날짜
- ✅ 마감시간: 15:00
- ✅ 우선순위: 높음
- ✅ 카테고리: 업무

## 💡 더 많은 예시

```
이번주 토요일 오전에 마트 장보기
→ 제목: "마트 장보기", 토요일, 10:00, 보통, 개인

다음주까지 Next.js 공부 마무리
→ 제목: "Next.js 공부 마무리", 다음주, 보통, 학습

오늘 저녁 7시 헬스장
→ 제목: "헬스장", 오늘, 19:00, 보통, 운동
```

## 🆘 문제 해결

### "AI 서비스 설정이 올바르지 않습니다"
→ `.env.local`에 `GOOGLE_GENERATIVE_AI_API_KEY` 추가했는지 확인
→ 서버 재시작했는지 확인

### "AI 서비스 인증에 실패했습니다"
→ API 키가 올바른지 확인
→ https://makersuite.google.com/app/apikey 에서 키 상태 확인

### 변환이 느림
→ 정상입니다! 첫 번째 요청은 2-5초 소요
→ Gemini API가 분석하는 시간

## 📚 자세한 문서

전체 기능과 고급 사용법은 `AI_TODO_GENERATOR.md` 참고

## 🎉 완료!

이제 자연어로 편리하게 할 일을 추가할 수 있습니다!
