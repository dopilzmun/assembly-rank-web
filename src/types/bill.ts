export interface BillDetailRow {
  bill_id: string;
  repve_assemb_id: string;
  bill_nm: string;
  ttswhn_pltprt_nm: string;
  curr_cmit_nm: string | null;   // 소관 상임위 명칭 (예: 교육위원회)
  is_own_cmit: boolean;          // 의원의 소속 상임위와 일치 여부
  motn_dd: string;               // 발의일자 (YYYY-MM-DD)
  process_stat: string | null;   // 본회의 처리결과 (원안가결 등)
  process_dd: string | null;     // 본회의 처리일자
  cmt_present_dd: string | null; // 상임위 상정일자
  cmt_proc_dd: string | null;    // 상임위 처리일자
  cmt_proc_stat: string | null;  // 상임위 처리결과
}

export interface AssembBillListResponse {
  assemb_id: string;
  assemb_nm: string;
  cmit_nm: string | null;
  aprv_bills: BillDetailRow[];
  pending_bills: BillDetailRow[];
  total_count: number;
  own_cmit_count: number;
}