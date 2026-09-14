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
        fdbk_sn,
        assemb_id,
        nck_nm,
        fdbk_se,
        fdbk_cn,
        vrfc_yn,
        DATE_FORMAT(reg_dt, '%Y-%m-%d %H:%i') as reg_dt
      FROM district_feedback
      WHERE assemb_id = ?
    `;
    const params: (string | number)[] = [assembId];

    if (verifiedOnly) {
      sql += ` AND vrfc_yn = 1`;
    }

    sql += ` ORDER BY reg_dt DESC, fdbk_sn DESC LIMIT 50;`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);

    // 표준 규격 반환 (하위 호환 별칭 포함)
    const feedbacks = rows.map((r) => ({
      fdbk_sn: r.fdbk_sn,
      assemb_id: r.assemb_id,
      nck_nm: r.nck_nm,
      fdbk_se: r.fdbk_se,
      fdbk_cn: r.fdbk_cn,
      vrfc_yn: Number(r.vrfc_yn),
      reg_dt: r.reg_dt,
      // 레거시 UI 호환
      feedback_id: r.fdbk_sn,
      nickname: r.nck_nm,
      category: r.fdbk_se,
      content: r.fdbk_cn,
      is_verified: Number(r.vrfc_yn),
      created_at: r.reg_dt,
    }));

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error("Failed to fetch feedbacks:", error);
    return NextResponse.json({ feedbacks: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { assemb_id, nickname, category, content, is_verified, nck_nm, fdbk_se, fdbk_cn, vrfc_yn } = await req.json();

    const targetAssembId = assemb_id;
    const finalNickname = (nck_nm || nickname || "").trim();
    const finalCategory = fdbk_se || category;
    const finalContent = (fdbk_cn || content || "").trim();
    const finalVerified = (vrfc_yn !== undefined ? vrfc_yn : is_verified) ? 1 : 0;

    if (!targetAssembId || !finalNickname || !finalContent) {
      return NextResponse.json({ message: "필수 입력 항목이 누락되었습니다." }, { status: 400 });
    }

    if (finalContent.length > 150) {
      return NextResponse.json({ message: "의견은 최대 150자까지 작성할 수 있습니다." }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO district_feedback (assemb_id, nck_nm, fdbk_se, fdbk_cn, vrfc_yn)
       VALUES (?, ?, ?, ?, ?);`,
      [targetAssembId, finalNickname, finalCategory, finalContent, finalVerified]
    );

    return NextResponse.json({
      success: true,
      fdbk_sn: result.insertId,
      feedback_id: result.insertId,
    });
  } catch (error) {
    console.error("Failed to create feedback:", error);
    return NextResponse.json({ message: "의견 등록 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sn = searchParams.get("fdbk_sn") || searchParams.get("feedback_id");

    if (!sn) {
      return NextResponse.json({ message: "삭제할 식별자가 필요합니다." }, { status: 400 });
    }

    await pool.query(`DELETE FROM district_feedback WHERE fdbk_sn = ?;`, [sn]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete feedback:", error);
    return NextResponse.json({ message: "삭제 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}