import { Metadata } from "next";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { BillRankingRow } from "@/types/ranking";
import RankingDashboard from "@/components/RankingDashboard";
import { Trophy } from "lucide-react";

export const revalidate = 86400;
const CURRENT_AGE = 22;

export const metadata: Metadata = {
  title: `의원 랭킹 & 1:1 맞비교 | 국회의원 입법활동 모니터`,
  description: `제${CURRENT_AGE}대 국회의원 300인 대표발의·상임위상정·본회의실질가결 성적표 및 6대 역량 1:1 스탯 배틀`,
};

async function getBillRankings(): Promise<BillRankingRow[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        assemb_id,
        age,
        assemb_nm,
        pltprt_nm,
        rgn_nm,
        cmit_nm,
        DATE_FORMAT(term_start_dd, '%Y-%m-%d') AS term_start_dd,
        is_deferred,
        monthly_pace,
        ttl_motn_cnt,
        pure_aprv_cnt,
        alt_aprv_cnt,
        aprv_cnt,
        dss_cnt,
        aprv_rate,
        cmt_present_cnt,
        cmt_present_rate,
        avg_cmt_days,
        own_cmit_motn_cnt,
        own_cmit_motn_rate,
        score,
        rnkg
      FROM vw_bill_efct_rnkg_01
      WHERE age = ?
      ORDER BY 
        is_deferred ASC, 
        CASE WHEN rnkg IS NULL THEN 1 ELSE 0 END ASC, 
        rnkg ASC, 
        score DESC;`,
      [CURRENT_AGE]
    );
    return rows as BillRankingRow[];
  } catch (error) {
    console.error("Failed to fetch bill rankings:", error);
    return [];
  }
}

export default async function RankingsPage() {
  const rankings = await getBillRankings();

  return (
    <main className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* 페이지 슬림 헤더 */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              제{CURRENT_AGE}대 국회의원 입법활동 종합 랭킹
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              300인 전수 평가 성적표 · 1:1 스탯 배틀 · 실시간 상세 검색
            </p>
          </div>
        </div>

        {/* 랭킹 대시보드 (300인 카드 & 테이블 즉시 표출) */}
        <RankingDashboard initialData={rankings} />

      </div>
    </main>
  );
}