import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ctgr = searchParams.get("ctgr_se");

    let sql = `
      SELECT 
        m.chng_seq,
        m.bill_id,
        m.age,
        m.chng_nm,
        m.ctgr_se,
        m.tgt_cnts,
        m.bfor_cnts,
        m.aftr_cnts,
        DATE_FORMAT(m.opertn_dd, '%Y-%m-%d') as opertn_dd,
        m.opertn_se,
        m.symp_cnt,
        b.bill_nm,
        b.process_stat,
        mem.assemb_nm,
        mem.pltprt_nm
      FROM bill_lvlhd_chng_mastr m
      JOIN bill_tr b ON m.bill_id = b.bill_id AND m.age = b.age
      LEFT JOIN assemb_mastr mem ON b.repve_assemb_id = mem.assemb_id AND b.age = mem.age
      WHERE m.expyn = 1
    `;
    const params: string[] = [];

    if (ctgr && ctgr !== "ALL") {
      sql += ` AND m.ctgr_se = ?`;
      params.push(ctgr);
    }

    sql += ` ORDER BY m.opertn_dd DESC, m.chng_seq DESC LIMIT 20;`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return NextResponse.json({ changes: rows });
  } catch (error) {
    console.error("Failed to fetch life changes:", error);
    return NextResponse.json({ changes: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { chng_seq } = await req.json();
    if (!chng_seq) {
      return NextResponse.json({ message: "변경 순번이 필요합니다." }, { status: 400 });
    }

    await pool.query<ResultSetHeader>(
      `UPDATE bill_lvlhd_chng_mastr SET symp_cnt = symp_cnt + 1 WHERE chng_seq = ?;`,
      [chng_seq]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to increase sympathy count:", error);
    return NextResponse.json({ message: "공감 처리 실패" }, { status: 500 });
  }
}