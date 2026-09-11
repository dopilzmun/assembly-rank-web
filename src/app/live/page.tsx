import { Metadata } from "next";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { WeeklyRadarStats, PipelineEvent, WeeklyActiveMover } from "@/types/activity";
import { BillRankingRow } from "@/types/ranking";
import LiveInteractiveSection from "@/components/LiveInteractiveSection";
import { Zap, Activity, FileText, Clock, CheckCircle2 } from "lucide-react";

export const revalidate = 86400;
const CURRENT_AGE = 22;

export const metadata: Metadata = {
  title: `입법 라이브 피드 & 주간 레이더 | 국회의원 입법활동 모니터`,
  description: `최근 14일 국회 법안 발의·상정·가결 실시간 타임라인 피드 및 다발의 의원 동향 모니터링`,
};

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

    // [보정] 단일 LIMIT 25로 인해 가결 안건이 발의 폭증에 밀려 탈락하는 문제 해결:
    // 가결(최신 10건), 상정(최신 15건), 발의(최신 25건)를 각각 확보하여 병합 전달
    
    // 1. 최근 본회의 가결 법안
    const [passedRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        b.bill_id, b.bill_nm, m.assemb_id, m.assemb_nm, m.pltprt_nm, b.curr_cmit_nm,
        DATE_FORMAT(b.process_dd, '%Y-%m-%d') AS event_date,
        b.process_stat
      FROM bill_tr b
      JOIN assemb_mastr m ON b.repve_assemb_id = m.assemb_id AND b.age = m.age
      WHERE b.age = ? 
        AND (b.process_stat LIKE '%가결%' OR b.process_stat LIKE '%반영폐기%')
        AND b.process_dd IS NOT NULL
      ORDER BY b.process_dd DESC, b.bill_id DESC
      LIMIT 10;`,
      [CURRENT_AGE]
    );

    // 2. 최근 상임위 상정 법안
    const [presentRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        b.bill_id, b.bill_nm, m.assemb_id, m.assemb_nm, m.pltprt_nm, b.curr_cmit_nm,
        DATE_FORMAT(b.cmt_present_dd, '%Y-%m-%d') AS event_date
      FROM bill_tr b
      JOIN assemb_mastr m ON b.repve_assemb_id = m.assemb_id AND b.age = m.age
      WHERE b.age = ? AND b.cmt_present_dd IS NOT NULL
      ORDER BY b.cmt_present_dd DESC, b.bill_id DESC
      LIMIT 15;`,
      [CURRENT_AGE]
    );

    // 3. 최근 발의 법안
    const [motnRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        b.bill_id, b.bill_nm, m.assemb_id, m.assemb_nm, m.pltprt_nm, b.curr_cmit_nm,
        DATE_FORMAT(b.motn_dd, '%Y-%m-%d') AS event_date
      FROM bill_tr b
      JOIN assemb_mastr m ON b.repve_assemb_id = m.assemb_id AND b.age = m.age
      WHERE b.age = ?
      ORDER BY b.motn_dd DESC, b.bill_id DESC
      LIMIT 25;`,
      [CURRENT_AGE]
    );

    const passed_events: PipelineEvent[] = passedRows.map((r) => ({
      bill_id: r.bill_id,
      bill_nm: r.bill_nm,
      assemb_id: r.assemb_id,
      assemb_nm: r.assemb_nm,
      pltprt_nm: r.pltprt_nm,
      action_type: "가결",
      event_date: r.event_date,
      detail_text: r.process_stat?.includes("반영폐기") ? "본회의 대안반영" : (r.process_stat || "본회의 가결"),
    }));

    const present_events: PipelineEvent[] = presentRows.map((r) => ({
      bill_id: r.bill_id,
      bill_nm: r.bill_nm,
      assemb_id: r.assemb_id,
      assemb_nm: r.assemb_nm,
      pltprt_nm: r.pltprt_nm,
      action_type: "상정",
      event_date: r.event_date,
      detail_text: `${r.curr_cmit_nm || "소관위"} 심사 상정`,
    }));

    const motn_events: PipelineEvent[] = motnRows.map((r) => ({
      bill_id: r.bill_id,
      bill_nm: r.bill_nm,
      assemb_id: r.assemb_id,
      assemb_nm: r.assemb_nm,
      pltprt_nm: r.pltprt_nm,
      action_type: "발의",
      event_date: r.event_date || "최근",
      detail_text: `${r.curr_cmit_nm || "상임위"} 회부`,
    }));

    // 전체 탭용 최신순 통합 리스트
    const recent_events: PipelineEvent[] = [
      ...passed_events,
      ...present_events,
      ...motn_events,
    ].sort((a, b) => (b.event_date || "").localeCompare(a.event_date || ""));

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

async function getAllMembersForLive(): Promise<BillRankingRow[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        assemb_id, age, assemb_nm, pltprt_nm, rgn_nm, cmit_nm,
        DATE_FORMAT(term_start_dd, '%Y-%m-%d') AS term_start_dd,
        is_deferred, monthly_pace, ttl_motn_cnt, pure_aprv_cnt, alt_aprv_cnt,
        aprv_cnt, dss_cnt, aprv_rate, cmt_present_cnt, cmt_present_rate,
        avg_cmt_days, own_cmit_motn_cnt, own_cmit_motn_rate, score, rnkg
      FROM vw_bill_efct_rnkg_01
      WHERE age = ?;`,
      [CURRENT_AGE]
    );
    return rows as BillRankingRow[];
  } catch (error) {
    console.error("Failed to fetch members for live page:", error);
    return [];
  }
}

export default async function LivePage() {
  const [weeklyRadar, allMembers] = await Promise.all([
    getWeeklyRadarData(),
    getAllMembersForLive(),
  ]);

  const motn = weeklyRadar.recent_motn_total || 1;
  const presentRate = Math.min(100, Math.round((weeklyRadar.recent_present_total / motn) * 100));
  const aprvRate = Math.min(100, Math.round((weeklyRadar.recent_aprv_total / motn) * 100));

  return (
    <main className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* 페이지 슬림 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-sm shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                실시간 입법 파이프라인 & 뉴스룸
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                최근 2주간 국회 법안 발의·상정·가결 트렌드 및 타임라인 실시간 모니터링
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            실시간 연동 중
          </span>
        </div>

        {/* 입법 파이프라인 효율 배너 (폰트 18~20px 확대) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                최근 2주간 입법 파이프라인 처리 효율
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              기준: {weeklyRadar.period_label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 font-mono">
            <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm text-slate-500 block font-sans font-medium mb-0.5">신규 접수 (발의)</span>
                <strong className="text-lg sm:text-2xl font-black text-slate-900">{weeklyRadar.recent_motn_total}건</strong>
              </div>
              <FileText className="w-6 h-6 text-slate-400" />
            </div>

            <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm text-indigo-600 block font-sans font-medium mb-0.5">상임위 심사 착수 (상정)</span>
                <strong className="text-lg sm:text-2xl font-black text-indigo-700">
                  {weeklyRadar.recent_present_total}건 <span className="text-sm font-normal">({presentRate}%)</span>
                </strong>
              </div>
              <Clock className="w-6 h-6 text-indigo-500" />
            </div>

            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm text-emerald-700 block font-sans font-medium mb-0.5">본회의 최종 통과 (가결)</span>
                <strong className="text-lg sm:text-2xl font-black text-emerald-700">
                  {weeklyRadar.recent_aprv_total}건 <span className="text-sm font-normal">({aprvRate}%)</span>
                </strong>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* 레이더 & 실시간 타임라인 피드 (기존 컴포넌트 그대로 유지) */}
        <LiveInteractiveSection data={weeklyRadar} allMembers={allMembers} />

      </div>
    </main>
  );
}