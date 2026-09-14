import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function getClientIpHsh(req: NextRequest, pollId: number): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const rawIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";
  const salt = process.env.POLL_SALT || "assembly_poll_salt_2024";
  return crypto.createHash("sha256").update(`${rawIp}_${salt}_${pollId}`).digest("hex");
}

function getTodayKst(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET(req: NextRequest) {
  try {
    const todayKst = getTodayKst();

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT poll_id, poll_titl, smry_cnts, pro_cnt, con_cnt, DATE_FORMAT(poll_dd, '%Y-%m-%d') as poll_dd
       FROM daily_bill_poll
       WHERE expyn = 1 
         AND poll_dd <= ?
       ORDER BY poll_dd DESC, poll_id DESC
       LIMIT 1;`,
      [todayKst]
    );

    if (rows.length === 0) {
      const [fallbackRows] = await pool.query<RowDataPacket[]>(
        `SELECT poll_id, poll_titl, smry_cnts, pro_cnt, con_cnt, DATE_FORMAT(poll_dd, '%Y-%m-%d') as poll_dd
         FROM daily_bill_poll
         WHERE expyn = 1
         ORDER BY poll_dd DESC, poll_id DESC
         LIMIT 1;`
      );
      if (fallbackRows.length === 0) {
        return NextResponse.json({ poll: null });
      }
      rows.push(fallbackRows[0]);
    }

    const p = rows[0];
    const total = Number(p.pro_cnt) + Number(p.con_cnt);
    const proRate = total > 0 ? Math.round((Number(p.pro_cnt) / total) * 100) : 50;

    const ipHshVal = getClientIpHsh(req, p.poll_id);
    const [logRows] = await pool.query<RowDataPacket[]>(
      `SELECT vote_se FROM daily_bill_poll_log WHERE poll_id = ? AND ip_hsh_val = ? LIMIT 1;`,
      [p.poll_id, ipHshVal]
    );

    const voteSe = logRows.length > 0 ? logRows[0].vote_se : null;

    return NextResponse.json(
      {
        poll: {
          poll_id: p.poll_id,
          poll_titl: p.poll_titl,
          smry_cnts: p.smry_cnts,
          pro_cnt: Number(p.pro_cnt),
          con_cnt: Number(p.con_cnt),
          total_cnt: total,
          pro_rate: proRate,
          con_rate: 100 - proRate,
          poll_dd: p.poll_dd,
          has_voted: Boolean(voteSe),
          vote_se: voteSe,
          // 프론트엔드 하위 호환 별칭
          title: p.poll_titl,
          summary: p.smry_cnts,
          poll_date: p.poll_dd,
          user_choice: voteSe,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    );
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

    const ipHshVal = getClientIpHsh(req, poll_id);

    await connection.beginTransaction();

    const [existing] = await connection.query<RowDataPacket[]>(
      `SELECT vote_seq FROM daily_bill_poll_log WHERE poll_id = ? AND ip_hsh_val = ? FOR UPDATE;`,
      [poll_id, ipHshVal]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return NextResponse.json({ message: "이미 본 투표에 참여하셨습니다." }, { status: 409 });
    }

    await connection.query<ResultSetHeader>(
      `INSERT INTO daily_bill_poll_log (poll_id, ip_hsh_val, vote_se) VALUES (?, ?, ?);`,
      [poll_id, ipHshVal, choice]
    );

    const column = choice === "pro" ? "pro_cnt" : "con_cnt";
    await connection.query<ResultSetHeader>(
      `UPDATE daily_bill_poll SET ${column} = ${column} + 1 WHERE poll_id = ?;`,
      [poll_id]
    );

    await connection.commit();

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
    return NextResponse.json({ message: "투표 처리 오류" }, { status: 500 });
  } finally {
    connection.release();
  }
}