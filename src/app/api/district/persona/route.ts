import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

interface PersonaMemberRow extends RowDataPacket {
  assemb_id: string;
  age: number;
  assemb_nm: string;
  pltprt_nm: string;
  rgn_nm: string | null;
  cmit_nm: string | null;
  term_start_dd: string | null;
  is_deferred: number;
  monthly_pace: number;
  ttl_motn_cnt: number;
  pure_aprv_cnt: number;
  alt_aprv_cnt: number;
  aprv_cnt: number;
  dss_cnt: number;
  aprv_rate: number;
  cmt_present_cnt: number;
  cmt_present_rate: number;
  avg_cmt_days: number | null;
  own_cmit_motn_cnt: number;
  own_cmit_motn_rate: number;
  score: number;
  rnkg: number;
  ctgr_se: string;
  symp_cnt: number;
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

    // 1. 페르소나 통계 뷰와 기존 랭킹 뷰를 조인하여 온전한 BillRankingRow 데이터셋 확보
    const [memberRows] = await pool.query<PersonaMemberRow[]>(
      `SELECT 
        v.assemb_id,
        v.age,
        v.assemb_nm,
        v.pltprt_nm,
        v.rgn_nm,
        v.cmit_nm,
        DATE_FORMAT(v.term_start_dd, '%Y-%m-%d') AS term_start_dd,
        v.is_deferred,
        v.monthly_pace,
        v.ttl_motn_cnt,
        v.pure_aprv_cnt,
        v.alt_aprv_cnt,
        v.aprv_cnt,
        v.dss_cnt,
        v.aprv_rate,
        v.cmt_present_cnt,
        v.cmt_present_rate,
        v.avg_cmt_days,
        v.own_cmit_motn_cnt,
        v.own_cmit_motn_rate,
        v.score,
        s.rnkg,
        s.ctgr_se,
        s.symp_cnt
       FROM vw_assemb_lvlhd_ctgr_stts_01 s
       JOIN vw_bill_efct_rnkg_01 v ON s.assemb_id = v.assemb_id AND s.age = v.age
       WHERE s.ctgr_se = ?
       ORDER BY s.rnkg ASC, s.aprv_scor DESC, s.symp_cnt DESC
       LIMIT 6;`,
      [ctgrSe]
    );

    if (memberRows.length === 0) {
      return NextResponse.json({ members: [] });
    }

    const assembIds = memberRows.map((m) => m.assemb_id);

    // 2. 해당 의원들의 페르소나별 대표 가결 입법 목록 조회
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
        // 기존 랭킹 규격(BillRankingRow) 전체 프로퍼티 포함
        assemb_id: m.assemb_id,
        age: m.age,
        assemb_nm: m.assemb_nm,
        pltprt_nm: m.pltprt_nm,
        rgn_nm: m.rgn_nm,
        cmit_nm: m.cmit_nm,
        term_start_dd: m.term_start_dd,
        is_deferred: Number(m.is_deferred),
        monthly_pace: Number(m.monthly_pace),
        ttl_motn_cnt: Number(m.ttl_motn_cnt),
        pure_aprv_cnt: Number(m.pure_aprv_cnt),
        alt_aprv_cnt: Number(m.alt_aprv_cnt),
        aprv_cnt: Number(m.aprv_cnt),
        dss_cnt: Number(m.dss_cnt),
        aprv_rate: Number(m.aprv_rate),
        cmt_present_cnt: Number(m.cmt_present_cnt),
        cmt_present_rate: Number(m.cmt_present_rate),
        avg_cmt_days: m.avg_cmt_days !== null ? Number(m.avg_cmt_days) : null,
        own_cmit_motn_cnt: Number(m.own_cmit_motn_cnt),
        own_cmit_motn_rate: Number(m.own_cmit_motn_rate),
        score: Number(m.score),
        rnkg: Number(m.rnkg),
        ctgr_se: m.ctgr_se,
        symp_cnt: Number(m.symp_cnt),
        // 페르소나 카드 내 표시용 대표 법안 배열
        bills: bills.slice(0, 3).map((b) => {
          const cleanStat = b.process_stat?.includes("반영폐기")
            ? "대안반영 (병합 가결)"
            : b.process_stat;

          return {
            bill_id: b.bill_id,
            bill_nm: b.bill_nm,
            process_stat: cleanStat,
            process_dd: b.process_dd,
            chng_seq: b.chng_seq,
            chng_nm: b.chng_nm,
            tgt_cnts: b.tgt_cnts,
            bfor_cnts: b.bfor_cnts,
            aftr_cnts: b.aftr_cnts,
            opertn_dd: b.opertn_dd,
            opertn_se: b.opertn_se,
            symp_cnt: Number(b.symp_cnt),
          };
        }),
      };
    });

    return NextResponse.json({ members: membersWithBills });
  } catch (error) {
    console.error("Failed to fetch persona lawmakers:", error);
    return NextResponse.json({ members: [] }, { status: 500 });
  }
}