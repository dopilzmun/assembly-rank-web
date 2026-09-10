import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

const CURRENT_AGE = 22;

export async function GET() {
  try {
    // 1. 최근 7일간 가장 많은 칭찬·응원을 받은 의원 TOP 3
    const [praiseRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        s.assemb_id,
        m.assemb_nm,
        m.pltprt_nm,
        COUNT(*) AS stamp_cnt
      FROM member_emotion_stamp s
      JOIN assemb_mastr m ON s.assemb_id = m.assemb_id AND m.age = ?
      WHERE s.stamp_type IN ('praise', 'cheer')
        AND s.created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY)
      GROUP BY s.assemb_id, m.assemb_nm, m.pltprt_nm
      ORDER BY stamp_cnt DESC
      LIMIT 3;`,
      [CURRENT_AGE]
    );

    // 2. 최근 7일간 가장 많은 감시·분발(경고)을 받은 의원 TOP 3
    const [watchRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        s.assemb_id,
        m.assemb_nm,
        m.pltprt_nm,
        COUNT(*) AS stamp_cnt
      FROM member_emotion_stamp s
      JOIN assemb_mastr m ON s.assemb_id = m.assemb_id AND m.age = ?
      WHERE s.stamp_type IN ('watch', 'critic')
        AND s.created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY)
      GROUP BY s.assemb_id, m.assemb_nm, m.pltprt_nm
      ORDER BY stamp_cnt DESC
      LIMIT 3;`,
      [CURRENT_AGE]
    );

    return NextResponse.json({
      topPraised: praiseRows,
      topWatched: watchRows,
    });
  } catch (error) {
    console.error("Failed to fetch weekly stamp summary:", error);
    return NextResponse.json({ topPraised: [], topWatched: [] }, { status: 500 });
  }
}