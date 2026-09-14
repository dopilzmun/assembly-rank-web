import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

interface MemberStatsRow extends RowDataPacket {
  assemb_id: string;
  age: number;
  assemb_nm: string;
  pltprt_nm: string;
  ctgr_se: string;
  aprv_cnt: number;
  symp_cnt: number;
  rnkg: number;
}

interface BillChangeRow extends RowDataPacket {
  chng_seq: number;
  bill_id: string;
  repve_assemb_id: string;
  chng_nm: string;
  tgt_cnts: string;
  bfor_cnts: string;
  aftr_cnts: string;
  opertn_dd: string | null;
  opertn_se: string;
  symp_cnt: number;
  bill_nm: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ctgrSe = searchParams.get("ctgr_se") || "WORK";

    // 1. 해당 페르소나의 상위 국회의원 통계 조회
    const [memberRows] = await pool.query<MemberStatsRow[]>(
      `SELECT 
        assemb_id,
        age,
        assemb_nm,
        pltprt_nm,
        ctgr_se,
        aprv_cnt,
        symp_cnt,
        rnkg
       FROM vw_assemb_lvlhd_ctgr_stts_01
       WHERE ctgr_se = ?
       ORDER BY rnkg ASC, aprv_cnt DESC, symp_cnt DESC
       LIMIT 6;`,
      [ctgrSe]
    );

    if (memberRows.length === 0) {
      return NextResponse.json({ members: [] });
    }

    const assembIds = memberRows.map((m) => m.assemb_id);

    // 2. 상위 의원들이 해당 분야에서 통과시킨 대표 생활 입법 상세 내역 조회
    const [billRows] = await pool.query<BillChangeRow[]>(
      `SELECT 
        l.chng_seq,
        l.bill_id,
        b.repve_assemb_id,
        l.chng_nm,
        l.tgt_cnts,
        l.bfor_cnts,
        l.aftr_cnts,
        DATE_FORMAT(l.opertn_dd, '%Y-%m-%d') as opertn_dd,
        l.opertn_se,
        l.symp_cnt,
        b.bill_nm
       FROM bill_lvlhd_chng_mastr l
       JOIN bill_tr b ON l.bill_id = b.bill_id AND l.age = b.age
       WHERE l.expyn = 1 
         AND l.ctgr_se = ?
         AND b.repve_assemb_id IN (?)
       ORDER BY l.symp_cnt DESC, l.opertn_dd DESC;`,
      [ctgrSe, assembIds]
    );

    const membersWithBills = memberRows.map((m) => {
      const bills = billRows.filter((b) => b.repve_assemb_id === m.assemb_id);
      return {
        assemb_id: m.assemb_id,
        assemb_nm: m.assemb_nm,
        pltprt_nm: m.pltprt_nm,
        ctgr_se: m.ctgr_se,
        aprv_cnt: Number(m.aprv_cnt),
        symp_cnt: Number(m.symp_cnt),
        rnkg: Number(m.rnkg),
        bills: bills.map((b) => ({
          chng_seq: b.chng_seq,
          bill_id: b.bill_id,
          chng_nm: b.chng_nm,
          tgt_cnts: b.tgt_cnts,
          bfor_cnts: b.bfor_cnts,
          aftr_cnts: b.aftr_cnts,
          opertn_dd: b.opertn_dd,
          opertn_se: b.opertn_se,
          symp_cnt: Number(b.symp_cnt),
          bill_nm: b.bill_nm,
        })),
      };
    });

    return NextResponse.json({ members: membersWithBills });
  } catch (error) {
    console.error("Failed to fetch persona lawmakers:", error);
    return NextResponse.json({ members: [] }, { status: 500 });
  }
}