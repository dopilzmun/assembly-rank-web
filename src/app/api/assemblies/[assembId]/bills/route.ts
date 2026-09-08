import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { BillDetailRow, AssembBillListResponse } from "@/types/bill";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assembId: string }> }
) {
  try {
    const { assembId } = await params;

    if (!assembId) {
      return NextResponse.json(
        { error: "assemb_id parameter is required" },
        { status: 400 }
      );
    }

    // 1. 의원 마스터 정보(소속 상임위) 조회
    const [memberRows] = await pool.query<RowDataPacket[]>(
      `SELECT assemb_id, assemb_nm, cmit_nm FROM assemb_mastr WHERE assemb_id = ?`,
      [assembId]
    );

    if (memberRows.length === 0) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    const member = memberRows[0];
    const memberCmit = member.cmit_nm || "";

    // 2. 해당 의원의 대표발의 법안 목록 조회
    const query = `
      SELECT 
        bill_id,
        repve_assemb_id,
        bill_nm,
        ttswhn_pltprt_nm,
        curr_cmit_nm,
        DATE_FORMAT(motn_dd, '%Y-%m-%d') AS motn_dd,
        process_stat,
        DATE_FORMAT(process_dd, '%Y-%m-%d') AS process_dd,
        DATE_FORMAT(cmt_present_dd, '%Y-%m-%d') AS cmt_present_dd,
        DATE_FORMAT(cmt_proc_dd, '%Y-%m-%d') AS cmt_proc_dd,
        cmt_proc_stat
      FROM bill_tr
      WHERE repve_assemb_id = ?
      ORDER BY motn_dd DESC;
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [assembId]);

    const bills: BillDetailRow[] = rows.map((r) => {
      const currCmit = r.curr_cmit_nm as string | null;
      // 의원의 소속 상임위 문자열에 법안 소관 상임위명이 포함되어 있는지 판별
      const is_own_cmit = Boolean(
        currCmit && memberCmit && memberCmit.includes(currCmit)
      );

      return {
        bill_id: r.bill_id,
        repve_assemb_id: r.repve_assemb_id,
        bill_nm: r.bill_nm,
        ttswhn_pltprt_nm: r.ttswhn_pltprt_nm,
        curr_cmit_nm: currCmit,
        is_own_cmit,
        motn_dd: r.motn_dd,
        process_stat: r.process_stat,
        process_dd: r.process_dd,
        cmt_present_dd: r.cmt_present_dd,
        cmt_proc_dd: r.cmt_proc_dd,
        cmt_proc_stat: r.cmt_proc_stat,
      };
    });

    const aprv_bills = bills.filter(
      (b) => b.process_stat && b.process_stat.includes("가결")
    );

    const pending_bills = bills.filter(
      (b) => !b.process_stat || b.process_stat.trim() === ""
    );

    const own_cmit_count = bills.filter((b) => b.is_own_cmit).length;

    const responseData: AssembBillListResponse = {
      assemb_id: assembId,
      assemb_nm: member.assemb_nm,
      cmit_nm: member.cmit_nm,
      aprv_bills,
      pending_bills,
      total_count: bills.length,
      own_cmit_count,
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch assembly bills:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}