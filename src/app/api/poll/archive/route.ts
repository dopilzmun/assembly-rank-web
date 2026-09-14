import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    let query = `
      SELECT 
        poll_id, 
        poll_nm, 
        smry_cn, 
        pro_cnt, 
        con_cnt, 
        DATE_FORMAT(poll_dd, '%Y-%m-%d') as poll_dd
      FROM daily_bill_poll
      WHERE actv_yn = 1
    `;
    const params: string[] = [];

    if (search.trim()) {
      query += ` AND (poll_nm LIKE ? OR smry_cn LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ` ORDER BY poll_dd DESC, poll_id DESC LIMIT 100;`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    const polls = rows.map((p) => {
      const total = Number(p.pro_cnt) + Number(p.con_cnt);
      const proRate = total > 0 ? Math.round((Number(p.pro_cnt) / total) * 100) : 50;
      return {
        poll_id: p.poll_id,
        poll_nm: p.poll_nm,
        smry_cn: p.smry_cn,
        pro_cnt: Number(p.pro_cnt),
        con_cnt: Number(p.con_cnt),
        total_cnt: total,
        pro_rate: proRate,
        con_rate: 100 - proRate,
        poll_dd: p.poll_dd,
        // 레거시 호환
        title: p.poll_nm,
        summary: p.smry_cn,
        poll_date: p.poll_dd,
      };
    });

    return NextResponse.json({ polls });
  } catch (error) {
    console.error("Failed to fetch archive polls:", error);
    return NextResponse.json({ polls: [] }, { status: 500 });
  }
}