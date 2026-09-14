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

interface BillRow extends RowDataPacket {
  bill_id: string;
  repve_assemb_id: string;
  bill_nm: string;
  process_stat: string;
  process_dd: string | null;
  chng_seq: number | null;
  chng_nm: string | null;
  tgt_cnts: string | null;
  bfor_cnts: string | null;
  aftr_cnts: string | null;
  opertn_dd: string | null;
  opertn_se: string | null;
  symp_cnt: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ctgrSe = searchParams.get("ctgr_se") || "WORK";

    // 1. 전체 가결 법안 모수 기반 상위 국회의원 6명 조회
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

    // 2. 상위 의원들의 해당 분야 가결 법안 목록 (큐레이션 데이터 우선 정렬)
    const [billRows] = await pool.query<BillRow[]>(
      `SELECT 
        b.bill_id,
        b.repve_assemb_id,
        b.bill_nm,
        b.process_stat,
        DATE_FORMAT(b.process_dd, '%Y-%m-%d') as process_dd,
        l.chng_seq,
        l.chng_nm,
        l.tgt_cnts,
        l.bfor_cnts,
        l.aftr_cnts,
        DATE_FORMAT(l.opertn_dd, '%Y-%m-%d') as opertn_dd,
        l.opertn_se,
        COALESCE(l.symp_cnt, 0) as symp_cnt
       FROM bill_tr b
       LEFT JOIN bill_lvlhd_chng_mastr l ON b.bill_id = l.bill_id AND b.age = l.age AND l.expyn = 1
       WHERE b.age = 22
         AND (b.process_stat LIKE '%가결%' OR b.process_stat LIKE '%반영폐기%')
         AND b.repve_assemb_id IN (?)
         AND (
            CASE 
                WHEN b.curr_cmit_nm LIKE '%환경노동%' OR b.bill_nm REGEXP '근로|노동|임금|퇴직|고용|청년|휴가' THEN 'WORK'
                WHEN b.curr_cmit_nm REGEXP '교육|보건복지|여성가족' OR b.bill_nm REGEXP '육아|보육|아동|어린이|학교|돌봄|출산' THEN 'CARE'
                WHEN b.bill_nm REGEXP '주택|전세|임대|아파트|분양|부동산|주거|건축|전월세' THEN 'HOUSE'
                WHEN b.bill_nm REGEXP '도로|교통|자동차|철도|보행|운전|음주운전' THEN 'TRAF'
                WHEN (b.curr_cmit_nm REGEXP '정무|기획재정' AND b.bill_nm REGEXP '금융|금리|대출|채권|공정거래|소비자|가계부채|신용|쿠폰')
                     OR b.bill_nm REGEXP '금융|금리|대출|이자|소비자보호' THEN 'FIN'
                ELSE 'LIFE'
            END
         ) = ?
       ORDER BY (l.chng_seq IS NOT NULL) DESC, l.symp_cnt DESC, b.process_dd DESC;`,
      [assembIds, ctgrSe]
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
        bills: bills.slice(0, 3).map((b) => ({
          bill_id: b.bill_id,
          bill_nm: b.bill_nm,
          process_stat: b.process_stat,
          process_dd: b.process_dd,
          chng_seq: b.chng_seq,
          chng_nm: b.chng_nm,
          tgt_cnts: b.tgt_cnts,
          bfor_cnts: b.bfor_cnts,
          aftr_cnts: b.aftr_cnts,
          opertn_dd: b.opertn_dd,
          opertn_se: b.opertn_se,
          symp_cnt: Number(b.symp_cnt),
        })),
      };
    });

    return NextResponse.json({ members: membersWithBills });
  } catch (error) {
    console.error("Failed to fetch persona lawmakers:", error);
    return NextResponse.json({ members: [] }, { status: 500 });
  }
}