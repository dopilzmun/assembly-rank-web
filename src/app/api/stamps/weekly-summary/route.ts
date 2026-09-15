import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

interface StampRankRow extends RowDataPacket {
  assemb_id: string;
  cnt: number;
}

export async function GET() {
  try {
    // 1. 테이블 존재 보장 (Auto DDL)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assemb_stamp_log (
        stamp_seq INT AUTO_INCREMENT PRIMARY KEY,
        assemb_id VARCHAR(50) NOT NULL,
        stamp_type VARCHAR(20) NOT NULL,
        ip_hsh_val VARCHAR(64) DEFAULT NULL,
        rgstdt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_assemb_stamp_lookup (assemb_id, stamp_type, rgstdt)
      );
    `);

    // 2. 최근 7일간 긍정 스탬프(칭찬해요, 응원해요) TOP 3
    const [positiveRows] = await pool.query<StampRankRow[]>(
      `SELECT assemb_id, COUNT(*) as cnt
       FROM assemb_stamp_log
       WHERE stamp_type IN ('praise', 'cheer')
         AND rgstdt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY assemb_id
       ORDER BY cnt DESC
       LIMIT 3;`
    );

    // 3. 최근 7일간 비판/주목 스탬프(지켜봐요, 분발해요) TOP 3
    const [criticalRows] = await pool.query<StampRankRow[]>(
      `SELECT assemb_id, COUNT(*) as cnt
       FROM assemb_stamp_log
       WHERE stamp_type IN ('watch', 'critic')
         AND rgstdt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY assemb_id
       ORDER BY cnt DESC
       LIMIT 3;`
    );

    return NextResponse.json({
      success: true,
      positive: positiveRows.map((r) => ({ assemb_id: r.assemb_id, count: Number(r.cnt) })),
      critical: criticalRows.map((r) => ({ assemb_id: r.assemb_id, count: Number(r.cnt) })),
    });
  } catch (error) {
    console.error("Failed to fetch weekly stamp summary:", error);
    return NextResponse.json(
      { success: false, positive: [], critical: [] },
      { status: 500 }
    );
  }
}