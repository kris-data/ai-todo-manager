# PRD – AI 기반 할 일 관리 서비스

## 1. 제품 개요

### 1.1 제품 목적

본 제품은 개인 및 소규모 팀 사용자를 대상으로 **할 일(To-do) 관리 + AI 자동화**를 결합한 생산성 서비스이다.

사용자는 단순한 CRUD 기반 할 일 관리뿐 아니라,

* 자연어로 할 일을 생성하고
* AI를 통해 하루·주 단위 업무 흐름을 요약·분석
  함으로써 **생각보다 실행에 집중할 수 있는 환경**을 제공받는다.

---

### 1.2 핵심 가치

* ✅ 입력은 최소화 (자연어)
* ✅ 관리는 구조화 (데이터)
* ✅ 통찰은 자동화 (AI 분석)

---

## 2. 타깃 사용자

* 개인 업무 관리자 (프리랜서, 직장인)
* 학습 계획 관리 사용자
* 일정·업무 정리가 어려운 사용자

---

## 3. 주요 기능 (Functional Requirements)

### 3.1 사용자 인증

**기능**

* 이메일 / 비밀번호 회원가입
* 로그인 / 로그아웃
* 인증 상태 유지

**기술**

* Supabase Auth

**정책**

* 사용자별 데이터 완전 분리 (Row Level Security)

---

### 3.2 할 일 관리 (CRUD)

#### 필드 구조

| 필드명          | 타입        | 설명                  |
| ------------ | --------- | ------------------- |
| id           | uuid      | Primary Key         |
| user_id      | uuid      | 사용자 ID (FK)         |
| title        | text      | 할 일 제목              |
| description  | text      | 상세 설명               |
| created_date | timestamp | 생성 시각               |
| due_date     | timestamp | 마감 기한               |
| priority     | enum      | high / medium / low |
| category     | text[]    | 업무 / 개인 / 학습 등      |
| completed    | boolean   | 완료 여부               |

#### 기능

* Create: 할 일 생성
* Read: 전체 / 개별 조회
* Update: 수정
* Delete: 삭제

---

### 3.3 검색 / 필터 / 정렬

#### 검색

* 대상: title, description
* 방식: 부분 문자열 검색 (ILIKE)

#### 필터

* 우선순위: high / medium / low
* 카테고리: 다중 선택
* 상태:

  * 진행 중 (completed = false && due_date >= now)
  * 완료
  * 지연 (completed = false && due_date < now)

#### 정렬

* 우선순위순
* 마감일순
* 생성일순

---

### 3.4 AI 할 일 생성 기능

#### 개요

사용자가 자연어 문장을 입력하면 AI가 이를 구조화된 할 일 데이터로 변환한다.

#### 입력 예

```
"내일 오전 10시에 팀 회의 준비"
```

#### 출력 예

```json
{
  "title": "팀 회의 준비",
  "description": "내일 오전 10시에 있을 팀 회의를 위해 자료를 준비합니다.",
  "created_date": "2026-01-23T09:00:00",
  "due_date": "2026-01-24T10:00:00",
  "priority": "high",
  "category": ["업무"],
  "completed": false
}
```

#### 처리 흐름

1. 사용자 자연어 입력
2. Next.js API Route 호출
3. Google Gemini API 호출
4. JSON Schema 기반 응답 파싱
5. Supabase DB 저장

---

### 3.5 AI 요약 및 분석 기능

#### 일일 요약

* 오늘 완료한 할 일 목록
* 남은 할 일 개수
* 우선 처리 추천 항목

#### 주간 요약

* 전체 할 일 수
* 완료율 (%)
* 지연 작업 수
* 카테고리별 분포 요약

#### 출력 형태

* 텍스트 요약
* 이후 확장 시 차트 연동

---

## 4. 화면 구성 (UI/UX)

### 4.1 로그인 / 회원가입

* 이메일 입력
* 비밀번호 입력
* 로그인 / 회원가입 토글

---

### 4.2 메인 할 일 관리 화면

#### 주요 구성

* 상단

  * 날짜
  * AI 요약 버튼

* 할 일 입력

  * 일반 입력
  * AI 자연어 입력

* 할 일 리스트

  * 체크박스
  * 우선순위 뱃지
  * 마감일 표시

* 검색 / 필터 / 정렬 영역

---

### 4.3 통계 및 분석 화면 (확장)

* 주간 완료율 그래프
* 카테고리별 분포
* 지연 작업 추이

---

## 5. 기술 스택

### 프론트엔드

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* Shadcn/ui

### 백엔드

* Supabase

  * Auth
  * Postgres
  * Row Level Security

### AI

* Google Gemini API
* JSON Schema Prompting

---

## 6. 데이터베이스 설계 (Supabase)

### users

* Supabase Auth 기본 테이블 사용

---

### todos

```sql
create table todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  created_date timestamp default now(),
  due_date timestamp,
  priority text check (priority in ('high','medium','low')),
  category text[],
  completed boolean default false
);
```

### RLS 정책

```sql
-- 사용자 본인 데이터만 접근
create policy "User can access own todos"
on todos
for all
using (auth.uid() = user_id);
```

---

## 7. API 구조 (Next.js)

| Method | Endpoint        | 설명        |
| ------ | --------------- | --------- |
| POST   | /api/todos      | 할 일 생성    |
| GET    | /api/todos      | 목록 조회     |
| PUT    | /api/todos/:id  | 수정        |
| DELETE | /api/todos/:id  | 삭제        |
| POST   | /api/ai/todo    | AI 할 일 생성 |
| POST   | /api/ai/summary | AI 요약     |

---

## 8. 비기능 요구사항

* 반응형 UI (모바일 우선)
* 평균 API 응답 1초 이내
* AI 응답 실패 시 fallback UX 제공

---

## 9. 향후 확장 로드맵

* 캘린더 연동
* 알림 (이메일 / 푸시)
* 팀 공유 할 일
* AI 우선순위 자동 재정렬

---

## 10. MVP 정의

**필수 포함**

* 로그인
* CRUD
* 검색/필터/정렬
* AI 할 일 생성
* AI 일일 요약

**제외 (V2)**

* 팀 기능
* 캘린더
* 모바일 앱

---

> 이 PRD는 즉시 개발 착수가 가능한 수준의 문서로 설계되었으며,
> Next.js + Supabase + AI 기반 MVP 구축을 기준으로 한다.
