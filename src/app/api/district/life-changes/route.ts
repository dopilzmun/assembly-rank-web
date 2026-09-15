import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

interface LifeChangeRow extends RowDataPacket {
  chng_seq: number;
  bill_id: string;
  age: number;
  chng_nm: string;
  ctgr_se: string;
  tgt_cnts: string;
  bfor_cnts: string;
  aftr_cnts: string;
  opertn_dd: string | null;
  opertn_se: string | null;
  symp_cnt: number;
}

// GET: 순수 조회 전용 (어떠한 INSERT도 수행하지 않음)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ctgrParam = searchParams.get("ctgr_se");

    let sql = `
      SELECT 
        chng_seq, bill_id, age, chng_nm, ctgr_se, tgt_cnts, bfor_cnts, aftr_cnts,
        DATE_FORMAT(opertn_dd, '%Y-%m-%d') AS opertn_dd,
        opertn_se, symp_cnt
      FROM bill_lvlhd_chng_mastr
      WHERE (expyn = 1 OR expyn IS NULL)
    `;
    const params: string[] = [];

    if (ctgrParam && ctgrParam !== "ALL") {
      sql += ` AND ctgr_se = ?`;
      params.push(ctgrParam.toUpperCase());
    }

    sql += ` ORDER BY symp_cnt DESC, chng_seq DESC LIMIT 30;`;

    const [rows] = await pool.query<LifeChangeRow[]>(sql, params);
    return NextResponse.json({ changes: rows || [] });
  } catch (error) {
    console.error("Failed to fetch life changes:", error);
    return NextResponse.json({ changes: [] }, { status: 500 });
  }
}

// POST: 시민 공감수 증가 전용
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chngSeq = body.chng_seq;
    if (!chngSeq) {
      return NextResponse.json({ error: "chng_seq is required" }, { status: 400 });
    }

    await pool.query<ResultSetHeader>(
      `UPDATE bill_lvlhd_chng_mastr SET symp_cnt = symp_cnt + 1 WHERE chng_seq = ?`,
      [chngSeq]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to like life change:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}