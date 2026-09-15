import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ assembId: string }> | { assembId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(props.params);
    const assembId = resolvedParams?.assembId;
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    
    // LIMIT 값은 1~20 범위의 안전한 정수로 고정
    const safeLimit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 20) : 5;

    if (!assembId) {
      return NextResponse.json({ bills: [] }, { status: 400 });
    }

    const cleanId = String(assembId).trim();

    // MySQL2의 LIMIT ? 파라미터 따옴표 바인딩 에러를 방지하기 위해 정수 검증값(safeLimit)을 쿼리에 직접 주입
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        bill_id,
        bill_nm,
        curr_cmit_nm,
        DATE_FORMAT(motn_dd, '%Y-%m-%d') AS motn_dd,
        process_stat,
        DATE_FORMAT(process_dd, '%Y-%m-%d') AS process_dd
       FROM bill_tr
       WHERE (repve_assemb_id = ? OR repve_assemb_id = ?) AND age = 22
       ORDER BY motn_dd DESC, bill_id DESC
       LIMIT ${safeLimit};`,
      [cleanId, cleanId]
    );

    return NextResponse.json({ bills: rows || [] });
  } catch (error) {
    console.error("Failed to fetch bills in /api/assemblies/[assembId]/bills:", error);
    return NextResponse.json({ bills: [] }, { status: 500 });
  }
}