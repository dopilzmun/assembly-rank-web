import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assembId = searchParams.get("assemb_id");
    const verifiedOnly = searchParams.get("verified_only") === "true";

    if (!assembId) {
      return NextResponse.json({ message: "의원 ID가 필요합니다." }, { status: 400 });
    }

    let sql = `
      SELECT 
        fdbc_seq,
        assemb_id,
        ncknm,
        fdbc_se,
        fdbc_cnts,
        atyn,
        DATE_FORMAT(rgstdt, '%Y-%m-%d %H:%i') as rgstdt
      FROM district_feedback
      WHERE assemb_id = ?
    `;
    const params: (string | number)[] = [assembId];

    if (verifiedOnly) {
      sql += ` AND atyn = 1`;
    }

    sql += ` ORDER BY rgstdt DESC, fdbc_seq DESC LIMIT 50;`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);

    const feedbacks = rows.map((r) => ({
      fdbc_seq: r.fdbc_seq,
      assemb_id: r.assemb_id,
      ncknm: r.ncknm,
      fdbc_se: r.fdbc_se,
      fdbc_cnts: r.fdbc_cnts,
      atyn: Number(r.atyn),
      rgstdt: r.rgstdt,
      // 프론트엔드 호환 별칭
      feedback_id: r.fdbc_seq,
      nickname: r.ncknm,
      category: r.fdbc_se,
      content: r.fdbc_cnts,
      is_verified: Number(r.atyn),
      created_at: r.rgstdt,
    }));

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error("Failed to fetch feedbacks:", error);
    return NextResponse.json({ feedbacks: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const assembId = body.assemb_id;
    const finalNcknm = (body.ncknm || body.nickname || "").trim();
    const finalSe = body.fdbc_se || body.category;
    const finalCnts = (body.fdbc_cnts || body.content || "").trim();
    const finalAtyn = (body.atyn !== undefined ? body.atyn : body.is_verified) ? 1 : 0;

    if (!assembId || !finalNcknm || !finalCnts) {
      return NextResponse.json({ message: "필수 입력 항목이 누락되었습니다." }, { status: 400 });
    }

    if (finalCnts.length > 150) {
      return NextResponse.json({ message: "의견은 최대 150자까지 작성할 수 있습니다." }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO district_feedback (assemb_id, ncknm, fdbc_se, fdbc_cnts, atyn)
       VALUES (?, ?, ?, ?, ?);`,
      [assembId, finalNcknm, finalSe, finalCnts, finalAtyn]
    );

    return NextResponse.json({
      success: true,
      fdbc_seq: result.insertId,
      feedback_id: result.insertId,
    });
  } catch (error) {
    console.error("Failed to create feedback:", error);
    return NextResponse.json({ message: "등록 중 오류 발생" }, { status: 500 });
  }
}