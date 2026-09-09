import { Metadata } from "next";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { BillRankingRow } from "@/types/ranking";
import { MacroOverviewStats, PartyOverviewStats } from "@/types/stats";
import { WeeklyRadarStats, PipelineEvent, WeeklyActiveMover } from "@/types/activity";
import RankingDashboard from "@/components/RankingDashboard";
import MacroStatsCards from "@/components/MacroStatsCards";
import LegislativeLiveRadar from "@/components/LegislativeLiveRadar";
import { Layers } from "lucide-react";

export const revalidate = 3600;

const CURRENT_AGE = 22;

export const metadata: Metadata = {
  title: `국회의원 입법활동 지표 모니터 | 제${CURRENT_AGE}대 국회`,
  description: `열린국회정보 Open API 기반 제${CURRENT_AGE}대 국회의원 법안 발의·상정·가결 지표 분석 모니터`,
};

// 1. 의원별 지표 뷰 조회
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

// 2. 국회 총괄 거시 지표 집계
async function getMacroOverview(): Promise<MacroOverviewStats> {
  try {
    const query = `
      SELECT 
        COUNT(DISTINCT repve_assemb_id) AS total_assemb_cnt,
        COUNT(*) AS total_motn_cnt,
        COUNT(CASE WHEN process_stat LIKE '%가결%' THEN 1 END) AS total_aprv_cnt,
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

// 3. 정당별 지표 집계
async function getPartyStats(): Promise<PartyOverviewStats[]> {
  try {
    const query = `
      SELECT 
        m.pltprt_nm,
        COUNT(DISTINCT m.assemb_id) AS assemb_cnt,
        COUNT(b.bill_id) AS total_motn_cnt,
        COUNT(CASE WHEN b.process_stat LIKE '%가결%' THEN 1 END) AS aprv_cnt,
        COUNT(CASE WHEN b.cmt_present_dd IS NOT NULL THEN 1 END) AS cmt_present_cnt,
        CASE 
          WHEN COUNT(b.bill_id) > 0 
          THEN ROUND((COUNT(CASE WHEN b.process_stat LIKE '%가결%' THEN 1 END) / COUNT(b.bill_id)) * 100, 1)
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

// 4. (신규) 금주의 입법 레이더 & 실시간 피드 집계
async function getWeeklyRadarData(): Promise<WeeklyRadarStats> {
  try {
    // A. 최신 법안 기준일자 파악 (휴회기/데이터 간극 방지 앵커)
    const [anchorRows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(COALESCE(MAX(motn_dd), CURRENT_DATE), '%Y-%m-%d') as anchor_date FROM bill_tr WHERE age = ?;`,
      [CURRENT_AGE]
    );
    const anchorDate = anchorRows[0]?.anchor_date || "2024-05-30";

    // B. 최근 14일 요약 수치
    const [summaryRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(CASE WHEN motn_dd >= DATE_SUB(?, INTERVAL 14 DAY) THEN 1 END) AS recent_motn_total,
        COUNT(CASE WHEN cmt_present_dd >= DATE_SUB(?, INTERVAL 14 DAY) THEN 1 END) AS recent_present_total,
        COUNT(CASE WHEN process_dd >= DATE_SUB(?, INTERVAL 14 DAY) AND process_stat LIKE '%가결%' THEN 1 END) AS recent_aprv_total
      FROM bill_tr
      WHERE age = ?;`,
      [anchorDate, anchorDate, anchorDate, CURRENT_AGE]
    );
    const s = summaryRows[0] || {};

    // C. 최근 14일 최다 발의 의원 TOP 3 (Movers)
    const [moverRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        m.assemb_id,
        m.assemb_nm,
        m.pltprt_nm,
        COUNT(*) AS recent_cnt
      FROM bill_tr b
      JOIN assemb_mastr m ON b.repve_assemb_id = m.assemb_id AND b.age = m.age
      WHERE b.age = ? AND b.motn_dd >= DATE_SUB(?, INTERVAL 14 DAY)
      GROUP BY m.assemb_id, m.assemb_nm, m.pltprt_nm
      ORDER BY recent_cnt DESC
      LIMIT 3;`,
      [CURRENT_AGE, anchorDate]
    );

    // D. 실시간 파이프라인 이벤트 최신 15건 추출
    const [eventRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        b.bill_id,
        b.bill_nm,
        m.assemb_id,
        m.assemb_nm,
        m.pltprt_nm,
        b.curr_cmit_nm,
        DATE_FORMAT(b.motn_dd, '%Y-%m-%d') AS motn_dd,
        DATE_FORMAT(b.cmt_present_dd, '%Y-%m-%d') AS cmt_present_dd,
        b.process_stat,
        DATE_FORMAT(b.process_dd, '%Y-%m-%d') AS process_dd
      FROM bill_tr b
      JOIN assemb_mastr m ON b.repve_assemb_id = m.assemb_id AND b.age = m.age
      WHERE b.age = ?
      ORDER BY GREATEST(
        COALESCE(b.process_dd, '1900-01-01'),
        COALESCE(b.cmt_present_dd, '1900-01-01'),
        COALESCE(b.motn_dd, '1900-01-01')
      ) DESC
      LIMIT 15;`,
      [CURRENT_AGE]
    );

    const recent_events: PipelineEvent[] = eventRows.map((r) => {
      if (r.process_dd && r.process_stat?.includes("가결")) {
        return {
          bill_id: r.bill_id,
          bill_nm: r.bill_nm,
          assemb_id: r.assemb_id,
          assemb_nm: r.assemb_nm,
          pltprt_nm: r.pltprt_nm,
          action_type: "가결",
          event_date: r.process_dd,
          detail_text: r.process_stat,
        };
      }
      if (r.cmt_present_dd) {
        return {
          bill_id: r.bill_id,
          bill_nm: r.bill_nm,
          assemb_id: r.assemb_id,
          assemb_nm: r.assemb_nm,
          pltprt_nm: r.pltprt_nm,
          action_type: "상정",
          event_date: r.cmt_present_dd,
          detail_text: `${r.curr_cmit_nm || "소관위"} 심사 상정`,
        };
      }
      return {
        bill_id: r.bill_id,
        bill_nm: r.bill_nm,
        assemb_id: r.assemb_id,
        assemb_nm: r.assemb_nm,
        pltprt_nm: r.pltprt_nm,
        action_type: "발의",
        event_date: r.motn_dd || "최근",
        detail_text: `${r.curr_cmit_nm || "상임위"} 회부`,
      };
    });

    return {
      period_label: "최근 14일 기준",
      recent_motn_total: Number(s.recent_motn_total) || 0,
      recent_present_total: Number(s.recent_present_total) || 0,
      recent_aprv_total: Number(s.recent_aprv_total) || 0,
      top_movers: moverRows as WeeklyActiveMover[],
      recent_events,
    };
  } catch (error) {
    console.error("Failed to fetch weekly radar data:", error);
    return {
      period_label: "최근 14일 기준",
      recent_motn_total: 0,
      recent_present_total: 0,
      recent_aprv_total: 0,
      top_movers: [],
      recent_events: [],
    };
  }
}

export default async function HomePage() {
  const [rankings, macroOverview, partyStats, weeklyRadar] = await Promise.all([
    getBillRankings(),
    getMacroOverview(),
    getPartyStats(),
    getWeeklyRadarData(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 서비스 타이틀 헤더 */}
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              국회의원 입법활동 지표 모니터
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
              제{CURRENT_AGE}대 국회
            </span>
          </div>
          <p className="text-slate-500 text-sm pl-0.5">
            열린국회정보 Open API 기반 대표발의 법안 심사 추진 및 본회의 처리 현황 분석
          </p>
        </div>

        {/* 1. 최상단 거시 요약 통계 카드 & 정당별 파이프라인 차트 */}
        <MacroStatsCards overview={macroOverview} parties={partyStats} />

        {/* 2. (신규) 금주의 입법 레이더 & 실시간 파이프라인 피드 */}
        <LegislativeLiveRadar data={weeklyRadar} />

        {/* 3. 필터 및 입법 지표 랭킹 테이블 */}
        <RankingDashboard initialData={rankings} />
      </div>
    </main>
  );
}