import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { BillDetailRow } from "@/types/bill";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const assembId = params.id;
  const currentAge = 22;

  try {
    // 1. 해당 의원의 소속 상임위 목록 확인
    const [memberRows] = await pool.query<RowDataPacket[]>(
      `SELECT cmit_nm FROM assemb_mastr WHERE assemb_id = ? AND age = ?`,
      [assembId, currentAge]
    );

    const memberCmit = memberRows[0]?.cmit_nm || "";
    const memberCmitList = memberCmit
      .split(",")
      .map((c: string) => c.trim())
      .filter(Boolean);

    // 2. 대표발의 법안 전체 조회
    const [billRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        bill_id,
        age,
        bill_nm,
        DATE_FORMAT(motn_dd, '%Y-%m-%d') AS motn_dd,
        curr_cmit_nm,
        DATE_FORMAT(cmt_present_dd, '%Y-%m-%d') AS cmt_present_dd,
        process_stat,
        DATE_FORMAT(process_dd, '%Y-%m-%d') AS process_dd
      FROM bill_tr
      WHERE repve_assemb_id = ? AND age = ?
      ORDER BY motn_dd DESC`,
      [assembId, currentAge]
    );

    const aprv_bills: BillDetailRow[] = [];
    const pending_bills: BillDetailRow[] = [];

    (billRows as BillDetailRow[]).forEach((bill) => {
      const isOwnCmit = bill.curr_cmit_nm
        ? memberCmitList.some((c: string) => bill.curr_cmit_nm?.includes(c))
        : false;

      const processedBill: BillDetailRow = {
        ...bill,
        is_own_cmit: isOwnCmit,
      };

      // 순수 가결 및 대안/수정반영폐기 모두 '성과 법안'으로 분류
      const isSubstApproved =
        bill.process_stat &&
        (bill.process_stat.includes("가결") || bill.process_stat.includes("반영폐기"));

      if (isSubstApproved) {
        aprv_bills.push(processedBill);
      } else {
        pending_bills.push(processedBill);
      }
    });

    return NextResponse.json({
      assemb_id: assembId,
      aprv_bills,
      pending_bills,
    });
  } catch (error) {
    console.error("법안 상세 API 로드 실패:", error);
    return NextResponse.json(
      { error: "법안 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}