import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { BillDetailRow } from "@/types/bill";

const CURRENT_AGE = 22;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assembId: string }> }
) {
  try {
    const { assembId } = await params;

    // 1. 해당 의원의 소속 상임위 확인
    const [assembRows] = await pool.query<RowDataPacket[]>(
      `SELECT cmit_nm FROM assemb_mastr WHERE assemb_id = ? AND age = ? LIMIT 1;`,
      [assembId, CURRENT_AGE]
    );
    const memberCmit = assembRows[0]?.cmit_nm || "";

    // 2. 대표발의 법안 목록 조회
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        bill_id,
        bill_nm,
        curr_cmit_nm,
        DATE_FORMAT(motn_dd, '%Y-%m-%d') AS motn_dd,
        DATE_FORMAT(cmt_present_dd, '%Y-%m-%d') AS cmt_present_dd,
        process_stat,
        DATE_FORMAT(process_dd, '%Y-%m-%d') AS process_dd
      FROM bill_tr
      WHERE repve_assemb_id = ? AND age = ?
      ORDER BY motn_dd DESC, bill_id DESC;`,
      [assembId, CURRENT_AGE]
    );

    const aprv_bills: BillDetailRow[] = [];
    const pending_bills: BillDetailRow[] = [];

    for (const r of rows) {
      const isOwnCmit =
        memberCmit && r.curr_cmit_nm ? memberCmit.includes(r.curr_cmit_nm) : false;

      const billItem: BillDetailRow = {
        bill_id: r.bill_id,
        bill_nm: r.bill_nm,
        repve_assemb_id: assembId,
        ttswhn_pltprt_nm: null,
        curr_cmit_nm: r.curr_cmit_nm || "",
        motn_dd: r.motn_dd || "",
        cmt_present_dd: r.cmt_present_dd || null,
        cmt_proc_dd: null,
        cmt_proc_stat: null,
        process_stat: r.process_stat || null,
        process_dd: r.process_dd || null,
        is_own_cmit: isOwnCmit,
      };

      const isAprv =
        r.process_stat &&
        (r.process_stat.includes("가결") || r.process_stat.includes("반영폐기"));

      if (isAprv) {
        aprv_bills.push(billItem);
      } else {
        pending_bills.push(billItem);
      }
    }

    return NextResponse.json({
      assemb_id: assembId,
      aprv_bills,
      pending_bills,
    });
  } catch (error) {
    console.error("Failed to fetch member bills:", error);
    return NextResponse.json(
      { message: "법안 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}