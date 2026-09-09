export interface BillRankingRow {
  assemb_id: string;
  age: number;
  assemb_nm: string;
  pltprt_nm: string;
  rgn_nm: string | null;
  cmit_nm: string | null;
  term_start_dd: string | null;
  is_deferred: number;
  monthly_pace: number | string;
  ttl_motn_cnt: number;
  pure_aprv_cnt: number;      // 순수 원안/수정가결
  alt_aprv_cnt: number;       // 위원회 대안/수정반영폐기
  aprv_cnt: number;           // 실질가결 총합
  dss_cnt: number;
  aprv_rate: number | string | null;
  cmt_present_cnt: number;
  cmt_present_rate: number | string;
  avg_cmt_days: number | string | null;
  own_cmit_motn_cnt: number;
  own_cmit_motn_rate: number | string;
  score: number | string | null;
  rnkg: number | null;
}