import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

interface PollRow extends RowDataPacket {
  poll_id: number;
  bill_id: string;
  poll_titl: string;
  smry_cnts: string;
  pro_cnt: number;
  con_cnt: number;
  poll_dd: string;
  expyn: number;
}

interface VoteLogRow extends RowDataPacket {
  vote_se: string;
}

export async function GET(req: NextRequest) {
  try {
    // 1. 테이블 보장
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_bill_poll (
        poll_id INT AUTO_INCREMENT PRIMARY KEY,
        bill_id VARCHAR(50) NOT NULL,
        poll_titl VARCHAR(255) NOT NULL,
        smry_cnts TEXT NOT NULL,
        pro_cnt INT DEFAULT 0,
        con_cnt INT DEFAULT 0,
        poll_dd DATE NOT NULL,
        expyn TINYINT(1) DEFAULT 1,
        rgstdt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_poll_dd (poll_dd, expyn)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_bill_poll_log (
        vote_seq INT AUTO_INCREMENT PRIMARY KEY,
        poll_id INT NOT NULL,
        ip_hsh_val VARCHAR(64) NOT NULL,
        vote_se VARCHAR(10) NOT NULL,
        rgstdt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_poll_ip (poll_id, ip_hsh_val)
      );
    `);

    // 2. 가장 최근 활성화된 쟁점 투표 조회
    const [polls] = await pool.query<PollRow[]>(
      `SELECT poll_id, bill_id, poll_titl, smry_cnts, pro_cnt, con_cnt, 
              DATE_FORMAT(poll_dd, '%Y-%m-%d') AS poll_dd, expyn
       FROM daily_bill_poll
       WHERE expyn = 1
       ORDER BY poll_dd DESC, poll_id DESC
       LIMIT 1;`
    );

    if (!polls || polls.length === 0) {
      return NextResponse.json({ poll: null, has_voted: false });
    }

    const currentPoll = polls[0];

    // 3. IP 기반 투표 참여 여부 확인
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    const [logs] = await pool.query<VoteLogRow[]>(
      `SELECT vote_se FROM daily_bill_poll_log WHERE poll_id = ? AND ip_hsh_val = ? LIMIT 1;`,
      [currentPoll.poll_id, ipHash]
    );

    const hasVoted = logs.length > 0;
    const userChoice = hasVoted ? (logs[0].vote_se.toLowerCase() as "pro" | "con") : null;

    return NextResponse.json({
      poll: currentPoll,
      has_voted: hasVoted,
      user_choice: userChoice,
    });
  } catch (error) {
    console.error("Failed to fetch daily poll:", error);
    return NextResponse.json({ poll: null, has_voted: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pollId = body.poll_id;
    // 프론트엔드의 다양한 파라미터 규격(vote_choice, vote_se, choice) 모두 수용
    const rawChoice = body.vote_choice || body.vote_se || body.choice || body.vote_type;

    if (!pollId || !rawChoice) {
      return NextResponse.json(
        { error: "poll_id and vote_choice are required" },
        { status: 400 }
      );
    }

    const choice = String(rawChoice).toLowerCase();
    if (choice !== "pro" && choice !== "con") {
      return NextResponse.json({ error: "Choice must be 'pro' or 'con'" }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    // 중복 투표 검사
    const [existing] = await pool.query<VoteLogRow[]>(
      `SELECT vote_se FROM daily_bill_poll_log WHERE poll_id = ? AND ip_hsh_val = ? LIMIT 1;`,
      [pollId, ipHash]
    );

    if (existing.length > 0) {
      return NextResponse.json({
        success: false,
        already_voted: true,
        user_choice: existing[0].vote_se.toLowerCase(),
        message: "이미 오늘 투표에 참여하셨습니다.",
      });
    }

    // 투표 이력 기록
    await pool.query(
      `INSERT INTO daily_bill_poll_log (poll_id, ip_hsh_val, vote_se, rgstdt)
       VALUES (?, ?, ?, NOW())`,
      [pollId, ipHash, choice.toUpperCase()]
    );

    // 집계 카운트 증가
    if (choice === "pro") {
      await pool.query<ResultSetHeader>(
        `UPDATE daily_bill_poll SET pro_cnt = pro_cnt + 1 WHERE poll_id = ?`,
        [pollId]
      );
    } else {
      await pool.query<ResultSetHeader>(
        `UPDATE daily_bill_poll SET con_cnt = con_cnt + 1 WHERE poll_id = ?`,
        [pollId]
      );
    }

    return NextResponse.json({
      success: true,
      user_choice: choice,
      message: "투표가 성공적으로 반영되었습니다.",
    });
  } catch (error) {
    console.error("Failed to register vote:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}