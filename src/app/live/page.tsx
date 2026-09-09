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
      LIMIT 25;`,
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

// 라이브 탭 전용으로 의원 기본 마스터 및 랭킹 스코어 데이터를 일괄 로드
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
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 페이지 슬림 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                실시간 입법 파이프라인 & 뉴스룸
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                최근 2주간 국회 법안 발의·상정·가결 트렌드 및 타임라인 실시간 모니터링
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            실시간 연동 중
          </span>
        </div>

        {/* 입법 파이프라인 효율 배너 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                최근 2주간 입법 파이프라인 처리 효율
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              기준: {weeklyRadar.period_label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">신규 접수 (발의)</span>
                <strong className="text-base font-black text-slate-900">{weeklyRadar.recent_motn_total}건</strong>
              </div>
              <FileText className="w-5 h-5 text-slate-400" />
            </div>

            <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-indigo-600 block font-sans">상임위 심사 착수 (상정)</span>
                <strong className="text-base font-black text-indigo-700">
                  {weeklyRadar.recent_present_total}건 <span className="text-xs font-normal">({presentRate}%)</span>
                </strong>
              </div>
              <Clock className="w-5 h-5 text-indigo-500" />
            </div>

            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-700 block font-sans">본회의 최종 통과 (가결)</span>
                <strong className="text-base font-black text-emerald-700">
                  {weeklyRadar.recent_aprv_total}건 <span className="text-xs font-normal">({aprvRate}%)</span>
                </strong>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* 라이브 상호작용 클라이언트 컴포넌트 (성적표 Drawer 내장) */}
        <LiveInteractiveSection data={weeklyRadar} allMembers={allMembers} />

      </div>
    </main>
  );
}