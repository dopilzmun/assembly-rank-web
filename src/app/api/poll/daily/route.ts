import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";

// 클라이언트 IP 추출 및 단방향 SHA-256 해시 생성 (개인정보 보호 & 중복 방지)
function getClientIpHash(req: NextRequest, pollId: number): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const rawIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";
  
  const salt = process.env.POLL_SALT || "assembly_poll_salt_2024";
  return crypto.createHash("sha256").update(`${rawIp}_${salt}_${pollId}`).digest("hex");
}

export async function GET(req: NextRequest) {
  try {
    // 1. 오늘 날짜 기준 최신 활성 쟁점 법안 1건 조회
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT poll_id, title, summary, pro_cnt, con_cnt, DATE_FORMAT(poll_date, '%Y-%m-%d') as poll_date
       FROM daily_bill_poll
       WHERE is_active = 1 AND poll_date <= CURRENT_DATE()
       ORDER BY poll_date DESC, poll_id DESC
       LIMIT 1;`
    );

    if (rows.length === 0) {
      return NextResponse.json({ poll: null });
    }

    const p = rows[0];
    const total = Number(p.pro_cnt) + Number(p.con_cnt);
    const proRate = total > 0 ? Math.round((Number(p.pro_cnt) / total) * 100) : 50;

    // 2. 현재 접속한 사용자가 이미 투표했는지 IP 해시 대조
    const ipHash = getClientIpHash(req, p.poll_id);
    const [logRows] = await pool.query<RowDataPacket[]>(
      `SELECT user_choice FROM daily_bill_poll_log WHERE poll_id = ? AND ip_hash = ? LIMIT 1;`,
      [p.poll_id, ipHash]
    );

    const userChoice = logRows.length > 0 ? logRows[0].user_choice : null;

    return NextResponse.json({
      poll: {
        poll_id: p.poll_id,
        title: p.title,
        summary: p.summary,
        pro_cnt: Number(p.pro_cnt),
        con_cnt: Number(p.con_cnt),
        total_cnt: total,
        pro_rate: proRate,
        con_rate: 100 - proRate,
        poll_date: p.poll_date,
        has_voted: Boolean(userChoice),
        user_choice: userChoice,
      },
    });
  } catch (error) {
    console.error("Failed to fetch daily poll:", error);
    return NextResponse.json({ poll: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const { poll_id, choice } = await req.json();

    if (!poll_id || (choice !== "pro" && choice !== "con")) {
      return NextResponse.json({ message: "잘못된 투표 요청입니다." }, { status: 400 });
    }

    const ipHash = getClientIpHash(req, poll_id);

    await connection.beginTransaction();

    // 1. 서버 사이드 중복 투표 검증
    const [existing] = await connection.query<RowDataPacket[]>(
      `SELECT log_id FROM daily_bill_poll_log WHERE poll_id = ? AND ip_hash = ? FOR UPDATE;`,
      [poll_id, ipHash]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return NextResponse.json(
        { message: "이미 본 투표에 참여하셨습니다." },
        { status: 409 }
      );
    }

    // 2. 투표 로그 기록
    await connection.query<ResultSetHeader>(
      `INSERT INTO daily_bill_poll_log (poll_id, ip_hash, user_choice) VALUES (?, ?, ?);`,
      [poll_id, ipHash, choice]
    );

    // 3. 메인 카운트 원자적 증가
    const column = choice === "pro" ? "pro_cnt" : "con_cnt";
    await connection.query<ResultSetHeader>(
      `UPDATE daily_bill_poll SET ${column} = ${column} + 1 WHERE poll_id = ?;`,
      [poll_id]
    );

    await connection.commit();

    // 4. 갱신된 집계 결과 반환
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT pro_cnt, con_cnt FROM daily_bill_poll WHERE poll_id = ?;`,
      [poll_id]
    );

    const p = rows[0];
    const total = Number(p.pro_cnt) + Number(p.con_cnt);
    const proRate = total > 0 ? Math.round((Number(p.pro_cnt) / total) * 100) : 50;

    return NextResponse.json({
      success: true,
      pro_cnt: Number(p.pro_cnt),
      con_cnt: Number(p.con_cnt),
      total_cnt: total,
      pro_rate: proRate,
      con_rate: 100 - proRate,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Failed to submit poll vote:", error);
    return NextResponse.json({ message: "투표 처리 중 오류가 발생했습니다." }, { status: 500 });
  } finally {
    connection.release();
  }
}