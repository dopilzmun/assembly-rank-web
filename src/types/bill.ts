export interface BillDetailRow {
  bill_id: string;
  bill_nm: string;
  repve_assemb_id?: string;
  ttswhn_pltprt_nm?: string | null;
  curr_cmit_nm?: string | null;
  motn_dd: string;
  cmt_present_dd?: string | null;
  cmt_proc_dd?: string | null;
  cmt_proc_stat?: string | null;
  process_stat?: string | null;
  process_dd?: string | null;
  is_own_cmit?: boolean;
}

export interface AssembBillListResponse {
  assemb_id: string;
  aprv_bills: BillDetailRow[];
  pending_bills: BillDetailRow[];
}