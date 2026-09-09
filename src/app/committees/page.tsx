import { Metadata } from "next";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { MacroOverviewStats, PartyOverviewStats } from "@/types/stats";
import { CommitteeBottleneckStats } from "@/types/committee";
import MacroStatsCards from "@/components/MacroStatsCards";
import CommitteeBottleneckSection from "@/components/CommitteeBottleneckSection";
import { Layers } from "lucide-react";

export const revalidate = 86400;
const CURRENT_AGE = 22;

export const metadata: Metadata = {
  title: `상임위 병목 분석 & 정당 파이프라인 | 국회의원 입법활동 모니터`,
  description: `국회 17개 상임위원회별 심사 착수 속도·정체 현황 진단 및 주요 정당별 법안 처리 단계 분석`,
};

async function getMacroOverview(): Promise<MacroOverviewStats> {
  try {
    const query = `
      SELECT 
        COUNT(DISTINCT repve_assemb_id) AS total_assemb_cnt,
        COUNT(*) AS total_motn_cnt,
        COUNT(CASE WHEN process_stat LIKE '%가결%' OR process_stat LIKE '%반영폐기%' THEN 1 END) AS total_aprv_cnt,
        COUNT(CASE WHEN cmt_present_dd IS NOT NULL THEN 1 END) AS total_cmt_present_cnt
      FROM bill_tr
      WHERE age = ?;
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [CURRENT_AGE]);
    const r = rows[0] || {};

    const total_motn_cnt = Number(r.total_motn_cnt) || 0;
    const total_aprv_cnt = Number(r.total_aprv_cnt) || 0;
    const total_cmt_present_cnt = Number(r.total_cmt_present_cnt) || 0;

    return {
      total_assemb_cnt: Number(r.total_assemb_cnt) || 0,
      total_motn_cnt,
      total_aprv_cnt,
      total_cmt_present_cnt,
      overall_aprv_rate:
        total_motn_cnt > 0
          ? Math.round((total_aprv_cnt / total_motn_cnt) * 1000) / 10
          : 0.0,
      overall_cmt_present_rate:
        total_motn_cnt > 0
          ? Math.round((total_cmt_present_cnt / total_motn_cnt) * 1000) / 10
          : 0.0,
    };
  } catch (error) {
    console.error("Failed to fetch macro overview:", error);
    return {
      total_assemb_cnt: 0,
      total_motn_cnt: 0,
      total_aprv_cnt: 0,
      total_cmt_present_cnt: 0,
      overall_aprv_rate: 0.0,
      overall_cmt_present_rate: 0.0,
    };
  }
}

async function getPartyStats(): Promise<PartyOverviewStats[]> {
  try {
    const query = `
      SELECT 
        m.pltprt_nm,
        COUNT(DISTINCT m.assemb_id) AS assemb_cnt,
        COUNT(b.bill_id) AS total_motn_cnt,
        COUNT(CASE WHEN b.process_stat LIKE '%가결%' OR b.process_stat LIKE '%반영폐기%' THEN 1 END) AS aprv_cnt,
        COUNT(CASE WHEN b.cmt_present_dd IS NOT NULL THEN 1 END) AS cmt_present_cnt,
        CASE 
          WHEN COUNT(b.bill_id) > 0 
          THEN ROUND((COUNT(CASE WHEN b.process_stat LIKE '%가결%' OR b.process_stat LIKE '%반영폐기%' THEN 1 END) / COUNT(b.bill_id)) * 100, 1)
          ELSE 0.0 
        END AS aprv_rate,
        CASE 
          WHEN COUNT(b.bill_id) > 0 
          THEN ROUND((COUNT(CASE WHEN b.cmt_present_dd IS NOT NULL THEN 1 END) / COUNT(b.bill_id)) * 100, 1)
          ELSE 0.0 
        END AS cmt_present_rate
      FROM assemb_mastr m
      LEFT JOIN bill_tr b ON m.assemb_id = b.repve_assemb_id AND m.age = b.age
      WHERE m.age = ?
      GROUP BY m.pltprt_nm
      HAVING COUNT(DISTINCT m.assemb_id) > 0
      ORDER BY total_motn_cnt DESC;
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [CURRENT_AGE]);
    return rows as PartyOverviewStats[];
  } catch (error) {
    console.error("Failed to fetch party stats:", error);
    return [];
  }
}

async function getCommitteeBottleneckData(): Promise<CommitteeBottleneckStats[]> {
  try {
    const query = `
      SELECT 
        curr_cmit_nm,
        COUNT(*) AS total_bills,
        COUNT(CASE WHEN cmt_present_dd IS NOT NULL THEN 1 END) AS present_cnt,
        ROUND((COUNT(CASE WHEN cmt_present_dd IS NOT NULL THEN 1 END) / COUNT(*)) * 100, 1) AS present_rate,
        ROUND(AVG(CASE WHEN cmt_present_dd IS NOT NULL THEN DATEDIFF(cmt_present_dd, motn_dd) END), 1) AS avg_days,
        COUNT(CASE WHEN process_stat LIKE '%가결%' OR process_stat LIKE '%반영폐기%' THEN 1 END) AS aprv_cnt,
        ROUND((COUNT(CASE WHEN process_stat LIKE '%가결%' OR process_stat LIKE '%반영폐기%' THEN 1 END) / COUNT(*)) * 100, 1) AS aprv_rate
      FROM bill_tr
      WHERE age = ? AND curr_cmit_nm IS NOT NULL AND curr_cmit_nm != ''
      GROUP BY curr_cmit_nm
      ORDER BY total_bills DESC;
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [CURRENT_AGE]);
    return (rows as RowDataPacket[]).map((r) => ({
      curr_cmit_nm: r.curr_cmit_nm,
      total_bills: Number(r.total_bills) || 0,
      present_cnt: Number(r.present_cnt) || 0,
      present_rate: Number(r.present_rate) || 0,
      avg_days: r.avg_days !== null && r.avg_days !== undefined ? Number(r.avg_days) : null,
      aprv_cnt: Number(r.aprv_cnt) || 0,
      aprv_rate: Number(r.aprv_rate) || 0,
    }));
  } catch (error) {
    console.error("Failed to fetch committee bottleneck data:", error);
    return [];
  }
}

export default async function CommitteesPage() {
  const [macroOverview, partyStats, committeeStats] = await Promise.all([
    getMacroOverview(),
    getPartyStats(),
    getCommitteeBottleneckData(),
  ]);

  return (
    <main className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 페이지 슬림 헤더 */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              소관 상임위원회 병목 & 정당 파이프라인 분석
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              17개 상임위 심사 착수 속도 진단 및 주요 정당별 법안 처리 단계 비교
            </p>
          </div>
        </div>

        {/* 1. 정당별 입법 파이프라인 누적 비교 카드 */}
        <MacroStatsCards overview={macroOverview} parties={partyStats} />

        {/* 2. 상임위원회별 입법 병목 분석 섹션 */}
        <CommitteeBottleneckSection data={committeeStats} />

      </div>
    </main>
  );
}