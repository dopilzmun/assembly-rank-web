import { Metadata } from "next";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { MacroOverviewStats } from "@/types/stats";
import { WeeklyRadarStats, PipelineEvent, WeeklyActiveMover } from "@/types/activity";
import LiveRadarView from "@/components/LiveRadarView";
import { Zap, Award, FileText, Clock, CheckCircle2 } from "lucide-react";

export const revalidate = 86400;
const CURRENT_AGE = 22;

export const metadata: Metadata = {
  title: `입법 라이브 피드 & 주간 레이더 | 국회의원 입법활동 모니터`,
  description: `최근 14일 국회 법안 발의·상정·가결 실시간 타임라인 피드 및 다발의 의원 동향 모니터링`,
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

async function getWeeklyRadarData(): Promise<WeeklyRadarStats> {
  try {
    const [anchorRows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(COALESCE(MAX(motn_dd), CURRENT_DATE), '%Y-%m-%d') as anchor_date FROM bill_tr WHERE age = ?;`,
      [CURRENT_AGE]
    );
    const anchorDate = anchorRows[0]?.anchor_date || "2024-05-30";

    const [summaryRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(CASE WHEN motn_dd >= DATE_SUB(?, INTERVAL 14 DAY) THEN 1 END) AS recent_motn_total,
        COUNT(CASE WHEN cmt_present_dd >= DATE_SUB(?, INTERVAL 14 DAY) THEN 1 END) AS recent_present_total,
        COUNT(CASE WHEN process_dd >= DATE_SUB(?, INTERVAL 14 DAY) AND (process_stat LIKE '%가결%' OR process_stat LIKE '%반영폐기%') THEN 1 END) AS recent_aprv_total
      FROM bill_tr
      WHERE age = ?;`,
      [anchorDate, anchorDate, anchorDate, CURRENT_AGE]
    );
    const s = summaryRows[0] || {};

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
      const isSubstAprv =
        r.process_dd &&
        (r.process_stat?.includes("가결") || r.process_stat?.includes("반영폐기"));

      if (isSubstAprv) {
        return {
          bill_id: r.bill_id,
          bill_nm: r.bill_nm,
          assemb_id: r.assemb_id,
          assemb_nm: r.assemb_nm,
          pltprt_nm: r.pltprt_nm,
          action_type: "가결",
          event_date: r.process_dd,
          detail_text: r.process_stat?.includes("반영폐기") ? "대안반영" : r.process_stat,
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

export default async function LivePage() {
  const [macroOverview, weeklyRadar] = await Promise.all([
    getMacroOverview(),
    getWeeklyRadarData(),
  ]);

  return (
    <main className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 페이지 타이틀 */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              실시간 입법 파이프라인 & 레이더
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              국회 본회의 및 상임위원회 법안 처리 현황 실시간 동기화
            </p>
          </div>
        </div>

        {/* 국회 총괄 4대 거시 지표 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5 whitespace-nowrap">
                등록 국회의원
              </span>
              <strong className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {macroOverview.total_assemb_cnt}
              </strong>
              <span className="text-xs text-slate-500 ml-1">인 전수</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600 shrink-0">
              <Award className="w-5 h-5 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5 whitespace-nowrap">
                총 대표발의 법안
              </span>
              <strong className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {macroOverview.total_motn_cnt.toLocaleString()}
              </strong>
              <span className="text-xs text-slate-500 ml-1">건</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600 shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5 whitespace-nowrap">
                상임위 심사 착수율
              </span>
              <strong className="text-xl sm:text-2xl font-black text-indigo-700 font-mono">
                {macroOverview.overall_cmt_present_rate}%
              </strong>
              <span className="text-[10px] text-slate-400 block font-mono">
                {macroOverview.total_cmt_present_cnt.toLocaleString()}건 상정
              </span>
            </div>
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5 whitespace-nowrap">
                본회의 실질 가결률
              </span>
              <strong className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
                {macroOverview.overall_aprv_rate}%
              </strong>
              <span className="text-[10px] text-slate-400 block font-mono">
                {macroOverview.total_aprv_cnt.toLocaleString()}건 처리
              </span>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 입법 레이더 & 실시간 라이브 피드 타임라인 */}
        <LiveRadarView data={weeklyRadar} />

      </div>
    </main>
  );
}