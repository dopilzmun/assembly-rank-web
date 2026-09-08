export interface BillRankingRow {
  assemb_id: string;
  age: number;
  assemb_nm: string;
  pltprt_nm: string;
  rgn_nm: string | null;
  cmit_nm: string | null;
  term_start_dd: string;
  is_deferred: number;       // 1: 등원 100일 미만 유예 대상, 0: 정상 평가 대상
  monthly_pace: number;      // 월평균 발의 페이스 (건/월)
  ttl_motn_cnt: number;
  aprv_cnt: number;
  dss_cnt: number;
  aprv_rate: number;
  cmt_present_cnt: number;
  cmt_present_rate: number;
  avg_cmt_days: number;
  own_cmit_motn_cnt: number;
  own_cmit_motn_rate: number;
  score: number | null;      // 유예 대상인 경우 null
  rnkg: number | null;       // 유예 대상인 경우 null
}