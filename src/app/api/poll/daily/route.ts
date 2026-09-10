import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT poll_id, title, summary, pro_cnt, con_cnt, poll_date
       FROM daily_bill_poll
       WHERE is_active = 1
       ORDER BY poll_date DESC, poll_id DESC
       LIMIT 1;`
    );

    if (rows.length === 0) {
      return NextResponse.json({ poll: null });
    }

    const p = rows[0];
    const total = p.pro_cnt + p.con_cnt;
    const proRate = total > 0 ? Math.round((p.pro_cnt / total) * 100) : 50;

    return NextResponse.json({
      poll: {
        poll_id: p.poll_id,
        title: p.title,
        summary: p.summary,
        pro_cnt: p.pro_cnt,
        con_cnt: p.con_cnt,
        total_cnt: total,
        pro_rate: proRate,
        con_rate: 100 - proRate,
      },
    });
  } catch (error) {
    console.error("Failed to fetch daily poll:", error);
    return NextResponse.json({ poll: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { poll_id, choice } = await req.json();

    if (!poll_id || (choice !== "pro" && choice !== "con")) {
      return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
    }

    const column = choice === "pro" ? "pro_cnt" : "con_cnt";
    await pool.query<ResultSetHeader>(
      `UPDATE daily_bill_poll SET ${column} = ${column} + 1 WHERE poll_id = ?;`,
      [poll_id]
    );

    // 갱신된 수치 반환
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT pro_cnt, con_cnt FROM daily_bill_poll WHERE poll_id = ?;`,
      [poll_id]
    );

    const p = rows[0];
    const total = p.pro_cnt + p.con_cnt;
    const proRate = total > 0 ? Math.round((p.pro_cnt / total) * 100) : 50;

    return NextResponse.json({
      success: true,
      pro_cnt: p.pro_cnt,
      con_cnt: p.con_cnt,
      total_cnt: total,
      pro_rate: proRate,
      con_rate: 100 - proRate,
    });
  } catch (error) {
    console.error("Failed to submit poll vote:", error);
    return NextResponse.json({ message: "투표 반영 실패" }, { status: 500 });
  }
}