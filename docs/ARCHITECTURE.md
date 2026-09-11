# 🏛️ 국회 입법활동 모니터 (assembly-rank-web) 시스템 아키텍처

## 1. 프론트엔드 라우트 및 컴포넌트 계층 트리 (Component Tree)

### [루트 공통]
- `src/app/layout.tsx`
  └─ `Navigation.tsx` (글로벌 GNB 네비게이션)

### 🏠 1. 홈 화면 (`src/app/page.tsx` - Server Component)
- `HomeHeroSearch.tsx` (통합 검색 바)
- `DailyBillPollWidget.tsx` (오늘의 쟁점 법안 1초 투표)
- `MyDistrictWidget.tsx` (우리 동네 의원 + GPS 1초 인증 + 최신 한마디 말풍선)
  └─ `AssembDetailDrawer.tsx` (의원 상세 성적표 Drawer)
       └─ `DistrictFeedbackSection.tsx` (동네 주민 한마디 보드)
- `CitizenReactionWidget.tsx` (주간 시민 반응 레이더: 응원/감시 TOP 3)
  └─ `AssembDetailDrawer.tsx`
       └─ `DistrictFeedbackSection.tsx`

### ⚡ 2. 실시간 입법 피드 (`src/app/live/page.tsx` - Server Component)
- [배너] 최근 2주간 입법 파이프라인 처리 효율 (발의·상정·가결 지표 카드)
- `LiveInteractiveSection.tsx` (Client Coordinator)
  ├─ `LegislativeLiveRadar.tsx` (Presenter: 좌측 3대 지표 버튼 + 우측 4대 탭 피드)
  └─ `AssembDetailDrawer.tsx` (Drawer)
       └─ `DistrictFeedbackSection.tsx`

### 📊 3. 300인 순위 및 비교 (`src/app/rankings/page.tsx` - Server Component)
- `RankingDashboard.tsx` (Client Coordinator & Presenter)
  ├─ `LegislativeLiveRadar.tsx` (랭킹 상단 레이더 뷰)
  ├─ `CompareModal.tsx` (1:1 의원 맞비교 대결 모달)
  │    ├─ `RadarChart.tsx` (6대 역량 방사형 차트)
  │    └─ `MemberSearchModal.tsx` (비교 대상 의원 검색 모달)
  ├─ `MemberSearchModal.tsx` (단독 의원 검색)
  └─ `AssembDetailDrawer.tsx` (Drawer)
       └─ `DistrictFeedbackSection.tsx`

### 🏛️ 4. 17개 상임위 병목 분석 (`src/app/committees/page.tsx` - Server Component)
- `MacroStatsCards.tsx` (상임위 거시 통계 요약 카드)
- `CommitteeBottleneckSection.tsx` (상임위별 평균 심사 소요일 및 계류 분석)

### 🗳️ 5. 투표 아카이브 (`src/app/poll/archive/page.tsx` - Client Component)
- 마감된 과거 쟁점 법안 검색 및 최종 찬반 여론 데이터베이스 뷰

---

## 2. 백엔드 API 엔드포인트 목록 (`src/app/api/`)

| 엔드포인트 | Method | 역할 및 특징 |
| :--- | :---: | :--- |
| `/api/poll/daily` | GET, POST | 당일 쟁점 투표 조회(KST 기준, 캐시 방지) 및 1인 1표 처리 |
| `/api/poll/archive` | GET | 마감된 이전 투표 목록 검색 및 찬반 집계 조회 |
| `/api/stamps/weekly-summary` | GET | 최근 7일간 시민 감정 스탬프(응원/감시 TOP 3) 집계 |
| `/api/assemblies/[assembId]/bills` | GET | 특정 의원의 최근 대표발의 법안 목록 조회 |
| `/api/assemblies/[assembId]/stamp` | POST | 특정 의원에 대한 시민 감정 스탬프 등록 |
| `/api/district/verify-location` | POST | OSM 무료 역지오코딩 기반 GPS 동네 인증 (30일 유효) |
| `/api/feedback` | GET, POST, DELETE | 지역구 의원실 한마디 CRUD (인증주민 필터, 150자 제한) |
| `/api/revalidate` | POST | 데이터 갱신 시 On-demand ISR 캐시 무효화 |

---

## 3. 잔여(미사용) 파일 정리 대상
- `src/components/LiveRadarView.tsx` (미호출 컴포넌트)
- `src/components/MemberEmotionStamps.tsx` (미호출 컴포넌트)