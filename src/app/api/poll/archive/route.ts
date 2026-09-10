import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    let sql = `
      SELECT 
        poll_id,
        bill_id,
        title,
        summary,
        pro_cnt,
        con_cnt,
        DATE_FORMAT(poll_date, '%Y-%m-%d') as poll_date
      FROM daily_bill_poll
      WHERE poll_date < CURRENT_DATE()
    `;
    const params: any[] = [];

    if (query.trim()) {
      sql += ` AND (title LIKE ? OR summary LIKE ?)`;
      params.push(`%${query.trim()}%`, `%${query.trim()}%`);
    }

    sql += ` ORDER BY poll_date DESC, poll_id DESC LIMIT 50;`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);

    const archives = rows.map((r) => {
      const total = Number(r.pro_cnt) + Number(r.con_cnt);
      const proRate = total > 0 ? Math.round((Number(r.pro_cnt) / total) * 100) : 50;
      return {
        poll_id: r.poll_id,
        bill_id: r.bill_id,
        title: r.title,
        summary: r.summary,
        pro_cnt: Number(r.pro_cnt),
        con_cnt: Number(r.con_cnt),
        total_cnt: total,
        pro_rate: proRate,
        con_rate: 100 - proRate,
        poll_date: r.poll_date,
      };
    });

    return NextResponse.json({ archives });
  } catch (error) {
    console.error("Failed to fetch poll archives:", error);
    return NextResponse.json({ archives: [] }, { status: 500 });
  }
}