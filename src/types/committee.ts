export interface CommitteeBottleneckStats {
  curr_cmit_nm: string;
  total_bills: number;
  present_cnt: number;
  present_rate: number;
  avg_days: number | null;
  aprv_cnt: number;
  aprv_rate: number;
}