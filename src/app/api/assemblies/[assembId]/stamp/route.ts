import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assembId: string }> }
) {
  try {
    const { assembId } = await params;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT stamp_type, stamp_cnt FROM assemb_emotion_stamp WHERE assemb_id = ?;`,
      [assembId]
    );

    const stamps: Record<string, number> = {
      praise: 0,
      cheer: 0,
      watch: 0,
      encourage: 0,
    };

    rows.forEach((r) => {
      stamps[r.stamp_type] = Number(r.stamp_cnt) || 0;
    });

    return NextResponse.json({ stamps });
  } catch (error) {
    console.error("Failed to fetch stamps:", error);
    return NextResponse.json({ stamps: {} }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assembId: string }> }
) {
  try {
    const { assembId } = await params;
    const body = await request.json();
    const stamp_type = body.stamp_type;

    const allowed = ["praise", "cheer", "watch", "encourage"];
    if (!allowed.includes(stamp_type)) {
      return NextResponse.json({ message: "유효하지 않은 스탬프입니다." }, { status: 400 });
    }

    await pool.query<ResultSetHeader>(
      `INSERT INTO assemb_emotion_stamp (assemb_id, stamp_type, stamp_cnt)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE stamp_cnt = stamp_cnt + 1;`,
      [assembId, stamp_type]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to add stamp:", error);
    return NextResponse.json({ message: "스탬프 저장 실패" }, { status: 500 });
  }
}