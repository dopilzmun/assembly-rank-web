export interface MacroOverviewStats {
  total_assemb_cnt: number;
  total_motn_cnt: number;
  total_aprv_cnt: number;
  total_cmt_present_cnt: number;
  overall_aprv_rate: number;
  overall_cmt_present_rate: number;
}

export interface PartyOverviewStats {
  pltprt_nm: string;
  assemb_cnt: number;
  total_motn_cnt: number;
  aprv_cnt: number;
  aprv_rate: number;
  cmt_present_cnt: number;
  cmt_present_rate: number;
}