import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function getClientIpHash(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const rawIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";
  const salt = process.env.POLL_SALT || "assembly_feedback_salt_2024";
  return crypto.createHash("sha256").update(`${rawIp}_${salt}`).digest("hex");
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// 1. 피드백 목록 조회 (인증 주민 전용 토글 지원)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assembId = searchParams.get("assemb_id");
    const verifiedOnly = searchParams.get("verified_only") === "true";

    if (!assembId) {
      return NextResponse.json({ feedbacks: [] }, { status: 400 });
    }

    let sql = `
      SELECT 
        feedback_id,
        assemb_id,
        district_nm,
        nickname,
        category,
        content,
        is_verified,
        like_cnt,
        DATE_FORMAT(created_at, '%m-%d %H:%i') as created_at
      FROM district_feedback
      WHERE assemb_id = ? AND is_blind = 0
    `;
    const params: any[] = [assembId];

    if (verifiedOnly) {
      sql += ` AND is_verified = 1`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 50;`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return NextResponse.json({ feedbacks: rows });
  } catch (error) {
    console.error("Failed to fetch feedbacks:", error);
    return NextResponse.json({ feedbacks: [] }, { status: 500 });
  }
}

// 2. 피드백 작성 (1일 1회 IP 방어 + 4자리 비밀번호)
export async function POST(req: NextRequest) {
  try {
    const { assemb_id, district_nm, nickname, category, content, password, is_verified } = await req.json();

    if (!assemb_id || !nickname || !category || !content || !password) {
      return NextResponse.json({ message: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    if (content.length > 150) {
      return NextResponse.json({ message: "의견은 150자 이내로 작성해 주세요." }, { status: 400 });
    }

    const ipHash = getClientIpHash(req);

    // 1일 1회 동일 의원 피드백 작성 제한 검증
    const [recent] = await pool.query<RowDataPacket[]>(
      `SELECT feedback_id FROM district_feedback 
       WHERE assemb_id = ? AND ip_hash = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
       LIMIT 1;`,
      [assemb_id, ipHash]
    );

    if (recent.length > 0) {
      return NextResponse.json(
        { message: "과도한 도배 방지를 위해 1개 의원실당 하루에 1건만 작성하실 수 있습니다." },
        { status: 429 }
      );
    }

    const pwdHash = hashPassword(password);

    await pool.query<ResultSetHeader>(
      `INSERT INTO district_feedback 
       (assemb_id, district_nm, nickname, category, content, pwd_hash, ip_hash, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        assemb_id,
        district_nm || "미지정",
        nickname.slice(0, 15),
        category,
        content.trim(),
        pwdHash,
        ipHash,
        is_verified ? 1 : 0,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to insert feedback:", error);
    return NextResponse.json({ message: "피드백 등록 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 3. 본인 비밀번호 확인 후 피드백 삭제
export async function DELETE(req: NextRequest) {
  try {
    const { feedback_id, password } = await req.json();

    if (!feedback_id || !password) {
      return NextResponse.json({ message: "비밀번호를 입력해 주세요." }, { status: 400 });
    }

    const pwdHash = hashPassword(password);

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM district_feedback WHERE feedback_id = ? AND pwd_hash = ?;`,
      [feedback_id, pwdHash]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: "비밀번호가 일치하지 않습니다." }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete feedback:", error);
    return NextResponse.json({ message: "삭제 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}