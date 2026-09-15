import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ assembId: string }> | { assembId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(props.params);
    const assembId = resolvedParams.assembId;
    const body = await req.json();
    const { stamp_type } = body;

    if (!assembId || !stamp_type) {
      return NextResponse.json(
        { error: "assembId and stamp_type are required" },
        { status: 400 }
      );
    }

    const validTypes = ["praise", "cheer", "watch", "critic"];
    if (!validTypes.includes(stamp_type)) {
      return NextResponse.json({ error: "Invalid stamp_type" }, { status: 400 });
    }

    // IP 해시 생성 (익명성 및 중복 로깅 관리)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

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

    // 2. 스탬프 기록 등록
    await pool.query(
      `INSERT INTO assemb_stamp_log (assemb_id, stamp_type, ip_hsh_val, rgstdt)
       VALUES (?, ?, ?, NOW())`,
      [assembId, stamp_type, ipHash]
    );

    return NextResponse.json({ success: true, message: "Stamp registered successfully" });
  } catch (error) {
    console.error("Failed to register stamp:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}