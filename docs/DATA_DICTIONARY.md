# 🏛️ assembly_rank 공식 데이터 표준 사전 및 명세서

## 1. 표준 접미사 규칙
| 접미사 | 의미 | 데이터 타입 권장 | 설명 |
| :---: | :--- | :--- | :--- |
| `_id` | 고유 식별 문자열 | VARCHAR | 시스템 및 비즈니스 식별자 (`assemb_id`, `bill_id`) |
| `_sn` | 일련번호 | INT AUTO_INCREMENT | 단조 증가 순번 PK (`poll_vote_sn`, `fdbk_sn`) |
| `_nm` | 명칭/이름 | VARCHAR | 고유 명칭 및 제목 (`poll_nm`, `assemb_nm`, `svc_nm`) |
| `_cn` | 내용/텍스트 | TEXT, VARCHAR | 본문, 요약문, 상세 설명 (`smry_cn`, `fdbk_cn`, `spch_cn`) |
| `_se` | 구분 코드 | VARCHAR | 유형 및 선택 분류 (`vote_se`, `fdbk_se`) |
| `_dd` | 일자 | DATE (YYYY-MM-DD) | 날짜 속성 (`poll_dd`, `spch_dd`, `motn_dd`) |
| `_dt` | 일시 | DATETIME | 타임스탬프 속성 (`reg_dt`, `mdf_dt`, `vote_dt`) |
| `_yn` | 여부 | TINYINT (1/0) | 참/거짓 플래그 (`actv_yn`, `vrfc_yn`, `use_yn`) |
| `_cnt`| 건수 | INT | 누적 카운트 (`pro_cnt`, `con_cnt`, `aprv_cnt`) |
| `_val`| 계산값 | VARCHAR, DECIMAL | 해시값, 연산값 (`ip_hash_val`) |

## 2. 테이블 표준 명칭
- `*_mastr` : 기준 정보 원장 (Master)
- `*_tr`    : 발생 활동 내역 (Transaction)
- `*_stat`  : 주기별 통계 (Statistics)
- `*_log`   : 감사/추적 로그 (Log)

## 3. 핵심 테이블 명세
1. `daily_bill_poll`: 일일 국회 쟁점 법안 시민 투표 원장
2. `daily_bill_poll_log`: 일일 쟁점 투표 참여 이력 로그
3. `district_feedback`: 지역구 국회의원실 주민 의견 피드백 내역
4. `assemb_spch_tr` (예정): 국회의원 회의록 발언 내역
5. `rgn_benf_mastr` (예정): 지역 주민 생활 혜택 원장