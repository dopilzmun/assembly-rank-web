// 1. 실시간 파이프라인 피드 항목
export interface PipelineEvent {
  bill_id: string;
  bill_nm: string;
  assemb_id: string;
  assemb_nm: string;
  pltprt_nm: string;
  action_type: "발의" | "상정" | "가결";
  event_date: string;
  detail_text: string;
}

// 2. 금주의 최다 발의 의원 (Weekly Mover)
export interface WeeklyActiveMover {
  assemb_id: string;
  assemb_nm: string;
  pltprt_nm: string;
  recent_cnt: number;
}

// 3. 레이더 요약 스탯
export interface WeeklyRadarStats {
  period_label: string;
  recent_motn_total: number;
  recent_present_total: number;
  recent_aprv_total: number;
  top_movers: WeeklyActiveMover[];
  recent_events: PipelineEvent[];
}