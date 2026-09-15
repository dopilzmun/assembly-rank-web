# 🏛️ 국회 입법활동 모니터 (assembly-rank-web) 시스템 아키텍처

> **최종 현행화 일자:** 2026-09-15  
> **기준 대상:** 대한민국 제22대 국회 (CURRENT_AGE = 22)  
> **원칙:** 단일 진실 공급원(Single Source of Truth), 모달 기반 일관된 UI/UX 유지, 데이터 표준 명명 규칙 준수(_DD02, _DD03)

---

## 1. 프론트엔드 라우트 및 컴포넌트 계층 트리 (Component Tree)

### [루트 공통]
- `src/app/layout.tsx` (글로벌 메타데이터, 폰트, 테마 프로바이더)
  └─ `Navigation.tsx` (글로벌 GNB 네비게이션 헤더)

---

### 🏠 1. 홈 화면 (`src/app/page.tsx` - Server Component)
- [Zone 1: 오늘의 참여 & 동네 의원] (배경: White)
  ├─ `HomeHeroSearch.tsx` (통합 검색 바)
  ├─ `DailyBillPollWidget.tsx` (오늘의 쟁점 법안 1초 투표)
  └─ `MyDistrictWidget.tsx` (우리 동네 의원, `allMembers` Props 수신)
       └─ `AssembDetailDrawer.tsx` (의원 상세 성적표 Drawer)
- [Zone 2: 화제의 의원 & 시민 여론 레이더] (배경: Slate-50)
  └─ `CitizenReactionWidget.tsx` (주간 시민 반응 레이더, `allMembers` Props 수신 - 전진 배치)
       └─ `AssembDetailDrawer.tsx`
- [Zone 3: 내 삶의 입법 체감 & 맞춤 의원] (배경: White)
  ├─ `LifeChangesWidget.tsx` (생활 입법 Before & After)
  └─ `PersonaLawmakerWidget.tsx` (페르소나별 입법 성적표)
       └─ `AssembDetailDrawer.tsx`
- [Zone 4: 제22대 팩트체크 & 입법 데이터 랩] (배경: Slate-50)
  ├─ [KPI Bar] 재적의원, 대표발의, 상정률, 가결률 거시 요약
  ├─ [3대 하이라이트] 종합 1위 의원, 가결 속보, 상임위 심사 속도 병목 진단
  └─ [평가 산식 배너] 실질가결 45점 + 상임위 상정 35점 + 발의 규모 20점 안내

---

### 🗂️ [핵심 공통 모달] 의정활동 상세 성적표 드로어 (`src/components/AssembDetailDrawer.tsx` - Client Component)
- **헤더:** 제22대 국회 라벨, 닫기(X) 버튼 (ESC 키 및 배경 딤 클릭 닫기 지원)
- **프로필 카드:** 의원명, 소속 정당 뱃지, 지역구/상임위, 종합 평가 점수 및 전체 순위
- **1:1 맞비교 대결 진입 버튼:** `onOpenCompareWith` 트리거
- **6대 입법 역량 육각 상태도:** `HexagonRadarChart.tsx` (최상단 배치, 순수 SVG 기반 정규화 차트 - 신규)
- **핵심 입법 성과 지표 6대 그리드:**
  1. 대표발의 건수 (월평균 페이스)
  2. 상임위 심사착수율 (상정 건수)
  3. 본회의 실질가결 건수 (원안 vs 대안 건수)
  4. 실질가결률 (가결/발의)
  5. 소속위 집중도 (소관위 발의 비율)
  6. 상정 소요일 (발의 후 상임위 상정까지의 평균 일수)
- **최근 대표발의 법안 피드:** 최근 5건 목록 (상임위 뱃지, 처리 상태, 의안정보시스템 원문 링크)
- **시민 감정 스탬프 바:** 1인 1회 (칭찬해요, 응원해요, 지켜봐요, 분발해요)
- `DistrictFeedbackSection.tsx` (동네 주민 한마디 보드: GPS 인증 주민 필터)

---

### ⚡ 2. 실시간 입법 피드 (`src/app/live/page.tsx` - Server Component)
- [배너] 최근 2주간 입법 파이프라인 처리 효율 (발의·상정·가결 지표 카드)
- `LiveInteractiveSection.tsx` (Client Coordinator)
  ├─ `LegislativeLiveRadar.tsx` (Presenter: 좌측 3대 지표 버튼 + 우측 4대 탭 피드)
  └─ `AssembDetailDrawer.tsx` (Drawer)
       └─ `DistrictFeedbackSection.tsx`

---

### 📊 3. 300인 순위 및 비교 (`src/app/rankings/page.tsx` - Server Component)
- `RankingDashboard.tsx` (Client Coordinator & Presenter)
  ├─ `LegislativeLiveRadar.tsx` (랭킹 상단 레이더 뷰)
  ├─ `CompareModal.tsx` (1:1 의원 맞비교 대결 모달)
  │    ├─ `RadarChart.tsx` (맞비교용 2인 겹침 방사형 차트)
  │    └─ `MemberSearchModal.tsx` (비교 대상 의원 검색 모달)
  ├─ `MemberSearchModal.tsx` (단독 의원 검색)
  └─ `AssembDetailDrawer.tsx` (Drawer)
       └─ `DistrictFeedbackSection.tsx`

---

### 🏛️ 4. 17개 상임위 병목 분석 (`src/app/committees/page.tsx` - Server Component)
- `MacroStatsCards.tsx` (상임위 거시 통계 요약 카드)
- `CommitteeBottleneckSection.tsx` (상임위별 평균 심사 소요일 및 계류 분석)

---

### 🗳️ 5. 투표 아카이브 (`src/app/poll/archive/page.tsx` - Client Component)
- 마감된 과거 쟁점 법안 검색 및 최종 찬반 여론 데이터베이스 뷰

---

## 2. 백엔드 API 엔드포인트 목록 (`src/app/api/`)

| 엔드포인트 | Method | 역할 및 특징 |
| :--- | :---: | :--- |
| `/api/poll/daily` | GET, POST | 당일 쟁점 투표 조회(KST 기준, 캐시 방지) 및 IP 해시 기반 1인 1표 처리 |
| `/api/poll/archive` | GET | 마감된 이전 투표 목록 검색 및 찬반 집계 조회 |
| `/api/stamps/weekly-summary` | GET | 최근 7일간 시민 감정 스탬프(응원/감시 TOP 3) 집계 |
| `/api/district/life-changes` | GET, POST | **[신규]** 생활 입법 Before & After 목록 조회(분야별 필터) 및 공감수(`symp_cnt`) 증가 |
| `/api/district/persona` | GET | **[신규]** 6대 페르소나별 가결 가중치 상위 의원 TOP 6 및 대표 입법 조회 (`vw_bill_efct_rnkg_01` 조인) |
| `/api/bills` | GET | **[신규/정규화]** `repve_assemb_id` 기준 특정 의원의 최근 대표발의 법안 목록 조회 (AssembDetailDrawer 전용) |
| `/api/stamps` | POST | 특정 의원에 대한 시민 감정 스탬프 등록 |
| `/api/district/verify-location` | POST | OSM 무료 역지오코딩 기반 GPS 동네 인증 (30일 유효 로컬스토리지 연계) |
| `/api/feedback` | GET, POST, DELETE | 지역구 의원실 한마디 CRUD (인증주민 필터, 150자 제한) |
| `/api/revalidate` | POST | 데이터 갱신 시 On-demand ISR 캐시 무효화 |

---

## 3. 데이터베이스 모델 및 통계 뷰 명세 (TiDB Database)

### 3.1 물리 테이블 (Physical Tables)
* `assemb_mastr`: 대한민국 국회의원 기본 마스터 (의원ID, 성명, 정당, 지역구, 소관상임위 등)
* `bill_tr`: 의안 트랜잭션 원장 (의안ID, 의안명, 대표발의의원ID `repve_assemb_id`, 발의일, 상정일, 처리상태 `process_stat`, 처리일자)
* `bill_lvlhd_chng_mastr`: 생활 입법 Before & After 마스터 테이블
* `assemb_stamp_log` **[신규/정규화]**: 시민 감정 스탬프 원장 (`stamp_seq`, `assemb_id`, `stamp_type`, `ip_hsh_val`, `rgstdt`)
* `daily_bill_poll`: 일일 쟁점 법안 투표 마스터
* `daily_bill_poll_log`: 투표 참여 중복 방지 이력
* `district_feedback`: 지역구 의원실 한마디 보드

### 3.2 표준 통계 뷰 (Standardized Database Views)
* `vw_bill_efct_rnkg_01`: 국회의원 종합 입법 효율성 및 6대 역량 100점 만점 평가 랭킹 뷰
* `vw_assemb_lvlhd_ctgr_stts_01` **[신규]**: 의원별·페르소나별 가결 성과 통계 뷰
  * **산출 공식:** 순수 가결(원안/수정가결) $\times$ 1.0 + 대안반영(병합 가결) $\times$ 0.7 가중 점수(`aprv_scor`) 기준 페르소나별 순위 매김

---

## 4. 데이터 수집 및 AI 정제 파이프라인 (`assembly_rank_etl`)

* `generate_daily_poll.py`: 22대 국회 최근 발의 법안 중 국민 쟁점 법안 1건을 Gemini Flash 모델로 자동 선정하여 `daily_bill_poll`에 적재
* `generate_life_changes.py` **[신규]**: 본회의를 통과한 가결 법안 중 실생활 체감형 법안을 선별하고 Before vs After 요약문을 생성하여 `bill_lvlhd_chng_mastr`에 적재
* `.github/workflows/generate_life_changes.yml` **[신규]**: 매일 밤 평일 22:00 KST에 가결 법안 생활 변화 분석을 자동 수행하는 GitHub Actions 워크플로우

---

## 5. 파편화 방지 및 아키텍처 규칙 (Housekeeping Guidelines)

1. **상세 화면 단일화 원칙:** 의원 상세 정보는 절대 신규 독립 라우트(예: `/rankings/[id]` 등)로 파편화하지 않으며, 전역 모달 컴포넌트인 `AssembDetailDrawer.tsx`를 단일 채널로 재사용한다.
2. **법안 조회 쿼리 정합성:** 의안 원장(`bill_tr`) 조회 시 의원 식별자 컬럼은 반드시 `repve_assemb_id`를 사용하며, 처리 상태 컬럼은 `process_stat`을 사용한다.
3. **용어 순화 표준:** 일반 유저 대상 UI 표기 시 '대안반영폐기'는 '대안반영 (병합 가결)'으로 순화하여 표기한다.
4. **잔여 미사용 컴포넌트 정리 대상:**
   * `src/components/LiveRadarView.tsx` (미호출 컴포넌트)
   * `src/components/MemberEmotionStamps.tsx` (미호출 컴포넌트)
   
## 6. 변경 이력 (Changelog)
* **2026-09-14:** 생활 입법 Before & After(`LifeChangesWidget`) 및 DB 수집 파이프라인 추가.
* **2026-09-15 (Phase 1 UI/UX 개선):** 메인 홈 화면(`src/app/page.tsx`) 4대 테마 Zone 구획화(Zone 1: 참여/동네, Zone 2: 생활/페르소나, Zone 3: 데이터랩/랭킹, Zone 4: 시민광장) 및 제브라 섹셔닝(배경 톤 교차), 통합 섹션 헤더 디자인 적용 완료.
* **2026-09-15:** 페르소나 위젯(`PersonaLawmakerWidget`) 상세 보기를 `AssembDetailDrawer`로 통합, `/api/assemblies/[assembId]/bills` 엔드포인트 연동 정상화, `HexagonRadarChart` 최상단 배치.
* **2026-09-15 (TS Build Fix):** `page.tsx`에서 `vw_bill_efct_rnkg_01` 300인 전원 데이터(`allMembers`) 조회 로직 복원하여 `MyDistrictWidget` 및 `CitizenReactionWidget` 컴포넌트 TS2741 Props 누락 빌드 에러 해결.
* **2026-09-15 (Phase 1 UI/UX 개선):** 메인 홈 화면(`src/app/page.tsx`) 4대 테마 Zone 구획화(참여, 생활입법, 데이터랩, 시민광장) 및 제브라 섹셔닝 적용.
* **2026-09-15 (홈 UX 순서 재배치 - Option A 적용):** 사용자 몰입도 극대화를 위해 `CitizenReactionWidget`을 상단(Zone 2)으로 전진 배치. [참여/동네 → 시민여론/화제의 의원 → 생활입법/페르소나 → 데이터랩/팩트체크]의 4-Zone 스토리텔링 흐름 완성.
* **2026-09-15 (Phase 1 UI/UX 개선):** 메인 홈 화면 4대 테마 Zone 구획화 및 제브라 섹셔닝 적용.
* **2026-09-15 (시민 스탬프 데이터 파이프라인 정상화):** `assemb_stamp_log` 물리 테이블 DDL 보장, Next.js 16 비동기 `params` 처리(`/api/assemblies/[assembId]/stamp`), 주간 요약 API(`/api/stamps/weekly-summary`)와 위젯(`CitizenReactionWidget`) 간 응답 데이터 키 정합성 복구 완료.
* **2026-09-15 (홈 UX 순서 재배치 - Option A 적용):** `CitizenReactionWidget`을 Zone 2로 전진 배치.
* **2026-09-15 (Phase 2 UI/UX 카드 통일 & 폴리싱):** Zone 1의 `DailyBillPollWidget`과 `MyDistrictWidget`에 높이 균등(`h-full flex flex-col justify-between`) 구조, 캡슐형 헤더 뱃지, 2줄 말줄임(`line-clamp-2`)을 적용하여 텍스트 길이에 따른 레이아웃 불균형 해소.
* **2026-09-15 (시민 스탬프 데이터 파이프라인 정상화):** `assemb_stamp_log` 물리 테이블 DDL 보장 및 Next.js 16 비동기 파라미터 처리 완료.
* **2026-09-15 (홈 UX 순서 재배치 - Option A 적용):** `CitizenReactionWidget`을 Zone 2로 전진 배치.
* **2026-09-15 (투표 및 지역구 위젯 안정화):** 
  - `DailyBillPollWidget`: `/api/poll/daily`의 `vote_choice`/`vote_se` 파라미터 규격 통일, 중복 투표 알림 및 상태 연동 수정.
  - `MyDistrictWidget`: OpenStreetMap Nominatim 403 차단 방지를 위한 `User-Agent` 헤더 적용, 자치구 정밀 매칭 복구 및 GPS 실패 시에도 100% 선택 가능한 '지역구 직접 검색/선택 모달' 기능 신규 탑재.
* **2026-09-15 (Phase 2 UI/UX 카드 통일 & 폴리싱):** Zone 1의 `DailyBillPollWidget`과 `MyDistrictWidget`에 높이 균등(`h-full flex flex-col justify-between`) 구조 적용.
* **2026-09-15 (동네 의원 드로어 영구 오픈 버그 수정):** `MyDistrictWidget.tsx`에서 `AssembDetailDrawer` 호출 시 `assemb` prop에 항상 `member`를 넘겨 드로어가 닫히지 않고 새로고침 시에도 상시 노출되던 문제를 `assemb={isDrawerOpen ? member : null}` 조건부 바인딩으로 수정 완료.
* **2026-09-15 (투표 및 지역구 위젯 안정화):** `/api/poll/daily` 파라미터 정합성 확보, OSM 403 방지 헤더 및 지역구 직접 검색 모달 탑재.