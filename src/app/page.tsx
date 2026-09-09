import { Metadata } from "next";
import Link from "next/link";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { MacroOverviewStats, PartyOverviewStats } from "@/types/stats";
import { WeeklyRadarStats, PipelineEvent, WeeklyActiveMover } from "@/types/activity";
import { BillRankingRow } from "@/types/ranking";
import MacroStatsCards from "@/components/MacroStatsCards";
import LiveRadarView from "@/components/LiveRadarView";
import HomeHeroSearch from "@/components/HomeHeroSearch";
import { Trophy, ArrowRight, Award, ShieldAlert, Layers } from "lucide-react";

export const revalidate = 86400;
const CURRENT_AGE = 22;

export const metadata: Metadata = {
  title: `종합 입법 대시보드 | 국회의원 입법활동 모니터`,
  description: `제${CURRENT_AGE}대 국회 법안 발의·상정·실질가결 총괄 거시 지표, 정당별 파이프라인 및 종합 랭킹 TOP 5`,
};

const PARTY_COLORS: Record<string, string> = {
  더불어민주당: "bg-blue-50 text-blue-700 border-blue-200",
  국민의힘: "bg-red-50 text-red-700 border-red-200",
  조국혁신당: "bg-sky-50 text-sky-700 border-sky-200",
  개혁신당: "bg-orange-50 text-orange-700 border-orange-200",
  진보당: "bg-purple-50 text-purple-700 border-purple-200",
  기본소득당: "bg-teal-50 text-teal-700 border-teal-200",
  사회민주당: "bg-yellow-50 text-yellow-800 border-yellow-200",
  무소속: "bg-gray-50 text-gray-700 border-gray-200",
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
      LIMIT 10;`,
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

// 종합 순위 TOP 5 의원 조회
async function getTop5Rankings(): Promise<BillRankingRow[]> {
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
      WHERE age = ? AND is_deferred = 0
      ORDER BY rnkg ASC
      LIMIT 5;`,
      [CURRENT_AGE]
    );
    return rows as BillRankingRow[];
  } catch (error) {
    console.error("Failed to fetch top 5 rankings:", error);
    return [];
  }
}

export default async function HomePage() {
  const [macroOverview, partyStats, weeklyRadar, top5] = await Promise.all([
    getMacroOverview(),
    getPartyStats(),
    getWeeklyRadarData(),
    getTop5Rankings(),
  ]);

  return (
    <main className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-7">
        
        {/* 1. Hero 섹션 & 빠른 의원 검색 */}
        <div className="text-center space-y-3 py-2 sm:py-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            <Layers className="w-3.5 h-3.5" />
            <span>제22대 국회 입법활동 종합 모니터링 플랫폼</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            숫자와 팩트로 확인하는 국회 의정 성적표
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto break-keep">
            법안 발의부터 상임위 상정, 본회의 실질가결(대안반영)까지 6대 핵심 역량 지표를 객관적으로 분석합니다.
          </p>

          <div className="pt-2">
            <HomeHeroSearch />
          </div>
        </div>

        {/* 2. 국회 총괄 4대 거시 지표 & 정당별 파이프라인 누적 비교 */}
        <MacroStatsCards overview={macroOverview} parties={partyStats} />

        {/* 3. 최근 입법 레이더 & 라이브 피드 프리뷰 */}
        <LiveRadarView data={weeklyRadar} />

        {/* 4. 종합 랭킹 TOP 5 프리뷰 카드 & 300인 전체 보기 CTA */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-600 border border-amber-500/20">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  입법활동 종합 랭킹 TOP 5
                </h3>
                <span className="text-[11px] text-slate-400">
                  실질가결(45점) + 심사추진력(35점) + 발의규모(20점) 100점 만점 기준
                </span>
              </div>
            </div>

            <Link
              href="/rankings"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <span>전체 300인 랭킹</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* TOP 5 그리드 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {top5.map((row) => (
              <Link
                key={row.assemb_id}
                href={`/rankings?member=${row.assemb_id}`}
                className="bg-slate-50/70 hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-xl p-3.5 transition-all space-y-2 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center font-mono">
                    {row.rnkg}
                  </span>
                  <span className="text-xs font-black text-indigo-700 font-mono">
                    {Number(row.score).toFixed(1)}점
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                      {row.assemb_nm}
                    </strong>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                        PARTY_COLORS[row.pltprt_nm] || "bg-gray-50 text-gray-700 border-gray-200"
                      }`}
                    >
                      {row.pltprt_nm}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                    {row.cmit_nm || "상임위 미배정"}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] font-mono text-slate-500">
                  <span>발의 {row.ttl_motn_cnt}건</span>
                  <strong className="text-emerald-700">실질가결 {row.aprv_cnt}건</strong>
                </div>
              </Link>
            ))}
          </div>

          {/* 전체 랭킹 보러가기 풀와이드 버튼 */}
          <div className="pt-2 text-center">
            <Link
              href="/rankings"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              <span>제22대 국회의원 300인 전수 랭킹 & 1:1 맞비교 분석 보러가기</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}