import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

interface LawmakerViewRow extends RowDataPacket {
  assemb_id: string;
  age: number;
  assemb_nm: string;
  pltprt_nm: string;
  rgn_nm: string | null;
  ctgr_se: string;
  aprv_cnt: number;
  pure_aprv_cnt: number;
  alt_aprv_cnt: number;
  aprv_scor: number;
  rnkg: number;
  repr_bill_nm: string | null;
}

// 한글 파라미터가 유입될 경우를 대비한 6대 표준 코드 변환 맵
const KOREAN_TO_CODE: Record<string, string> = {
  직장인: "WORK",
  노동: "WORK",
  주거: "HOUSE",
  부동산: "HOUSE",
  육아: "CARE",
  돌봄: "CARE",
  금융: "FIN",
  경제: "FIN",
  소상공인: "FIN",
  교통: "TRAF",
  생활: "LIFE",
  환경: "LIFE",
  시니어: "LIFE",
};

const VALID_CODES = new Set(["CARE", "FIN", "HOUSE", "LIFE", "TRAF", "WORK"]);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawParam = (searchParams.get("ctgr_se") || "WORK").trim();
    
    // 표준 코드로 정규화
    const ctgrCode = KOREAN_TO_CODE[rawParam] || (VALID_CODES.has(rawParam.toUpperCase()) ? rawParam.toUpperCase() : "WORK");

    // vw_assemb_lvlhd_ctgr_stts_01 뷰 직접 조회 (rnkg 순 TOP 6)
    const [rows] = await pool.query<LawmakerViewRow[]>(
      `SELECT 
        v.assemb_id,
        v.age,
        v.assemb_nm,
        v.pltprt_nm,
        m.rgn_nm,
        v.ctgr_se,
        v.aprv_cnt,
        v.pure_aprv_cnt,
        v.alt_aprv_cnt,
        v.aprv_scor,
        v.rnkg,
        (
          SELECT b.bill_nm 
          FROM bill_tr b 
          WHERE b.repve_assemb_id = v.assemb_id 
            AND b.age = 22 
            AND (b.process_stat LIKE '%가결%' OR b.process_stat LIKE '%반영폐기%')
          ORDER BY b.process_dd DESC 
          LIMIT 1
        ) AS repr_bill_nm
       FROM vw_assemb_lvlhd_ctgr_stts_01 v
       LEFT JOIN assemb_mastr m ON v.assemb_id = m.assemb_id AND m.age = 22
       WHERE v.age = 22 AND v.ctgr_se = ?
       ORDER BY v.rnkg ASC
       LIMIT 6;`,
      [ctgrCode]
    );

    const lawmakers = rows.map((r) => ({
      assemb_id: r.assemb_id,
      assemb_nm: r.assemb_nm,
      pltprt_nm: r.pltprt_nm,
      rgn_nm: r.rgn_nm,
      ctgr_se: r.ctgr_se,
      aprv_cnt: Number(r.aprv_cnt) || 0,
      pure_aprv_cnt: Number(r.pure_aprv_cnt) || 0,
      alt_aprv_cnt: Number(r.alt_aprv_cnt) || 0,
      aprv_scor: Number(r.aprv_scor) || 0,
      rnkg: Number(r.rnkg),
      repr_bill_nm: r.repr_bill_nm || `${r.assemb_nm} 의원 대표 가결 법안`,
    }));

    return NextResponse.json({
      success: true,
      category: ctgrCode,
      lawmakers,
    });
  } catch (error) {
    console.error("Failed to fetch persona lawmakers from view:", error);
    return NextResponse.json({ success: false, lawmakers: [] }, { status: 500 });
  }
}