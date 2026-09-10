import { Metadata } from "next";
import Link from "next/link";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import HomeHeroSearch from "@/components/HomeHeroSearch";
import DailyBillPollWidget from "@/components/DailyBillPollWidget";
import MyDistrictWidget from "@/components/MyDistrictWidget";
import { BillRankingRow } from "@/types/ranking";
import {
  Trophy,
  Layers,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Award,
} from "lucide-react";

export const revalidate = 86400;
const CURRENT_AGE = 22;

export const metadata: Metadata = {
  title: `국회 입법활동 모니터 | 제${CURRENT_AGE}대 국회 브리핑`,
  description: `열린국회정보 Open API 기반 제${CURRENT_AGE}대 국회의원 법안 발의·상정·실질가결 지표 및 6대 역량 분석 플랫폼`,
};

interface HomeBriefingData {
  macro: {
    total_assemb_cnt: number;
    total_motn_cnt: number;
    total_aprv_cnt: number;
    overall_aprv_rate: number;
    overall_cmt_present_rate: number;
  };
  topScorer: {
    assemb_id: string;
    assemb_nm: string;
    pltprt_nm: string;
    score: number;
    rnkg: number;
    aprv_cnt: number;
    ttl_motn_cnt: number;
  } | null;
  topAprvMember: {
    assemb_id: string;
    assemb_nm: string;
    pltprt_nm: string;
    aprv_cnt: number;
  } | null;
  recentPassedBills: {
    bill_id: string;
    bill_nm: string;
    assemb_nm: string;
    pltprt_nm: string;
    process_dd: string;
    process_stat: string;
  }[];
  bottleneckSummary: {
    fastest: { name: string; days: number } | null;
    slowest: { name: string; days: number } | null;
  };
  allMembers: BillRankingRow[];
}

async function getHomeBriefingData(): Promise<HomeBriefingData> {
  try {
    const [macroRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(DISTINCT repve_assemb_id) AS total_assemb_cnt,
        COUNT(*) AS total_motn_cnt,
        COUNT(CASE WHEN process_stat LIKE '%가결%' OR process_stat LIKE '%반영폐기%' THEN 1 END) AS total_aprv_cnt,
        COUNT(CASE WHEN cmt_present_dd IS NOT NULL THEN 1 END) AS total_cmt_present_cnt
      FROM bill_tr
      WHERE age = ?;`,
      [CURRENT_AGE]
    );
    const m = macroRows[0] || {};
    const total_motn = Number(m.total_motn_cnt) || 0;
    const total_aprv = Number(m.total_aprv_cnt) || 0;
    const total_cmt = Number(m.total_cmt_present_cnt) || 0;

    const [topScorerRows] = await pool.query<RowDataPacket[]>(
      `SELECT assemb_id, assemb_nm, pltprt_nm, score, rnkg, aprv_cnt, ttl_motn_cnt
       FROM vw_bill_efct_rnkg_01
       WHERE age = ? AND is_deferred = 0 AND rnkg = 1
       LIMIT 1;`,
      [CURRENT_AGE]
    );

    const [topAprvRows] = await pool.query<RowDataPacket[]>(
      `SELECT assemb_id, assemb_nm, pltprt_nm, aprv_cnt
       FROM vw_bill_efct_rnkg_01
       WHERE age = ?
       ORDER BY aprv_cnt DESC, ttl_motn_cnt ASC
       LIMIT 1;`,
      [CURRENT_AGE]
    );

    const [billRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        b.bill_id, b.bill_nm, m.assemb_nm, m.pltprt_nm,
        DATE_FORMAT(b.process_dd, '%m-%d') as process_dd,
        b.process_stat
       FROM bill_tr b
       JOIN assemb_mastr m ON b.repve_assemb_id = m.assemb_id AND b.age = m.age
       WHERE b.age = ? AND (b.process_stat LIKE '%가결%' OR b.process_stat LIKE '%반영폐기%')
       ORDER BY b.process_dd DESC
       LIMIT 3;`,
      [CURRENT_AGE]
    );

    const [cmitRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        curr_cmit_nm,
        ROUND(AVG(DATEDIFF(cmt_present_dd, motn_dd)), 1) AS avg_days
       FROM bill_tr
       WHERE age = ? AND curr_cmit_nm IS NOT NULL AND cmt_present_dd IS NOT NULL
       GROUP BY curr_cmit_nm
       HAVING COUNT(*) >= 15
       ORDER BY avg_days ASC;`,
      [CURRENT_AGE]
    );

    const fastest = cmitRows[0] ? { name: cmitRows[0].curr_cmit_nm, days: Number(cmitRows[0].avg_days) } : null;
    const slowest = cmitRows.length > 0 ? { name: cmitRows[cmitRows.length - 1].curr_cmit_nm, days: Number(cmitRows[cmitRows.length - 1].avg_days) } : null;

    const [memberRows] = await pool.query<RowDataPacket[]>(
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

    return {
      macro: {
        total_assemb_cnt: Number(m.total_assemb_cnt) || 0,
        total_motn_cnt: total_motn,
        total_aprv_cnt: total_aprv,
        overall_aprv_rate: total_motn > 0 ? Math.round((total_aprv / total_motn) * 1000) / 10 : 0,
        overall_cmt_present_rate: total_motn > 0 ? Math.round((total_cmt / total_motn) * 1000) / 10 : 0,
      },
      topScorer: (topScorerRows[0] as any) || null,
      topAprvMember: (topAprvRows[0] as any) || null,
      recentPassedBills: billRows.map((r) => ({
        bill_id: r.bill_id,
        bill_nm: r.bill_nm,
        assemb_nm: r.assemb_nm,
        pltprt_nm: r.pltprt_nm,
        process_dd: r.process_dd,
        process_stat: r.process_stat?.includes("반영폐기") ? "대안반영" : r.process_stat,
      })),
      bottleneckSummary: { fastest, slowest },
      allMembers: memberRows as BillRankingRow[],
    };
  } catch (error) {
    console.error("Failed to fetch home briefing data:", error);
    return {
      macro: { total_assemb_cnt: 0, total_motn_cnt: 0, total_aprv_cnt: 0, overall_aprv_rate: 0, overall_cmt_present_rate: 0 },
      topScorer: null,
      topAprvMember: null,
      recentPassedBills: [],
      bottleneckSummary: { fastest: null, slowest: null },
      allMembers: [],
    };
  }
}

export default async function HomePage() {
  const data = await getHomeBriefingData();

  return (
    <main className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* 1. Hero 섹션 */}
        <div className="text-center space-y-3 py-2 sm:py-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs sm:text-sm font-bold">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>제{CURRENT_AGE}대 국회 입법활동 팩트체크 브리핑</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            숫자와 데이터로 읽는 국회의원 성적표
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto break-keep">
            단순 법안 발의 건수를 넘어 상임위 상정 및 본회의 실질가결(대안반영)까지 6대 핵심 역량을 객관적으로 분석합니다.
          </p>

          <div className="pt-2">
            <HomeHeroSearch />
          </div>
        </div>

        {/* 2. 오늘의 투표 & 우리 동네 의원 위젯 (2열 그리드) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <DailyBillPollWidget />
          </div>
          <div className="lg:col-span-5">
            <MyDistrictWidget allMembers={data.allMembers} />
          </div>
        </div>

        {/* 3. 미니 거시 지표 요약 바 (폰트 18~20px 확대) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm font-mono text-center">
          <div className="p-3 bg-slate-50/80 rounded-xl">
            <span className="text-xs sm:text-sm text-slate-500 block font-sans font-medium mb-0.5">등록 의원</span>
            <strong className="text-lg sm:text-2xl font-black text-slate-900">
              {data.macro.total_assemb_cnt}명
            </strong>
          </div>
          <div className="p-3 bg-slate-50/80 rounded-xl">
            <span className="text-xs sm:text-sm text-slate-500 block font-sans font-medium mb-0.5">대표발의 법안</span>
            <strong className="text-lg sm:text-2xl font-black text-slate-900">
              {data.macro.total_motn_cnt.toLocaleString()}건
            </strong>
          </div>
          <div className="p-3 bg-slate-50/80 rounded-xl">
            <span className="text-xs sm:text-sm text-slate-500 block font-sans font-medium mb-0.5">상임위 심사착수율</span>
            <strong className="text-lg sm:text-2xl font-black text-indigo-600">
              {data.macro.overall_cmt_present_rate}%
            </strong>
          </div>
          <div className="p-3 bg-slate-50/80 rounded-xl">
            <span className="text-xs sm:text-sm text-slate-500 block font-sans font-medium mb-0.5">본회의 실질가결률</span>
            <strong className="text-lg sm:text-2xl font-black text-emerald-600">
              {data.macro.overall_aprv_rate}%
            </strong>
          </div>
        </div>

        {/* 4. 3대 큐레이션 하이라이트 (14~16px 폰트 표준화) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* 🏆 랭킹 픽 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">입법 랭킹 하이라이트</h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                  TOP 성과
                </span>
              </div>

              {data.topScorer && (
                <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100 space-y-1">
                  <span className="text-xs font-bold text-indigo-600 block">👑 제22대 국회 종합 1위</span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <strong className="text-base font-bold text-slate-900">{data.topScorer.assemb_nm}</strong>
                      <span className="text-xs text-slate-600 px-2 py-0.5 rounded bg-white border border-slate-200 font-medium">
                        {data.topScorer.pltprt_nm}
                      </span>
                    </div>
                    <span className="text-sm sm:text-base font-black font-mono text-indigo-700">
                      {Number(data.topScorer.score).toFixed(1)}점
                    </span>
                  </div>
                </div>
              )}

              {data.topAprvMember && (
                <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100 space-y-1">
                  <span className="text-xs font-bold text-emerald-700 block">⚡ 최다 본회의 실질가결</span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <strong className="text-base font-bold text-slate-900">{data.topAprvMember.assemb_nm}</strong>
                      <span className="text-xs text-slate-600 px-2 py-0.5 rounded bg-white border border-slate-200 font-medium">
                        {data.topAprvMember.pltprt_nm}
                      </span>
                    </div>
                    <span className="text-sm sm:text-base font-black font-mono text-emerald-700">
                      총 {data.topAprvMember.aprv_cnt}건
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/rankings"
              className="w-full py-2.5 px-3 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-1 group"
            >
              <span>300인 전수 순위 & 1:1 맞비교</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* ⚡ 입법 속보 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">최근 본회의 가결 법안</h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  입법 완료
                </span>
              </div>

              <div className="space-y-2">
                {data.recentPassedBills.map((b) => (
                  <div key={b.bill_id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span className="text-slate-600 font-medium">{b.assemb_nm} ({b.pltprt_nm})</span>
                      <span className="text-emerald-700 font-bold">{b.process_stat} ({b.process_dd})</span>
                    </div>
                    <p className="font-semibold text-sm text-slate-800 truncate" title={b.bill_nm}>
                      {b.bill_nm}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/live"
              className="w-full py-2.5 px-3 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-1 group"
            >
              <span>실시간 입법 파이프라인 피드</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* 📊 상임위 진단 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">상임위 심사 속도 진단</h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                  17개 소관위
                </span>
              </div>

              {data.bottleneckSummary.fastest && (
                <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 space-y-1">
                  <span className="text-xs font-bold text-emerald-700 block">⚡ 심사 착수 가장 빠른 곳</span>
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-bold text-slate-900 truncate max-w-[150px]">
                      {data.bottleneckSummary.fastest.name}
                    </strong>
                    <span className="text-sm font-mono font-bold text-emerald-700">
                      평균 {data.bottleneckSummary.fastest.days}일
                    </span>
                  </div>
                </div>
              )}

              {data.bottleneckSummary.slowest && (
                <div className="bg-rose-50/50 rounded-xl p-3 border border-rose-100 space-y-1">
                  <span className="text-xs font-bold text-rose-700 block">⚠️ 법안 심사 정체 주의 상임위</span>
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-bold text-slate-900 truncate max-w-[150px]">
                      {data.bottleneckSummary.slowest.name}
                    </strong>
                    <span className="text-sm font-mono font-bold text-rose-700">
                      평균 {data.bottleneckSummary.slowest.days}일
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/committees"
              className="w-full py-2.5 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-1 group"
            >
              <span>17개 상임위 병목 심층 분석</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

        </div>

        {/* 5. 평가 기준 안내 */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h4 className="font-bold text-base sm:text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              공정 평가: 단순 발의 건수가 아닌 '실질적 성과' 중심 지표
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 break-keep leading-relaxed font-normal">
              발의만 하고 방치되는 법안을 방지하기 위해 <strong>본회의 실질가결(원안 100% + 대안반영 70%) 45점</strong>, <strong>상임위 상정 추진력 35점</strong>, <strong>발의 규모 20점</strong>을 반영하여 100점 만점으로 투명하게 평가합니다.
            </p>
          </div>

          <Link
            href="/rankings"
            className="inline-flex items-center gap-1.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs sm:text-sm font-bold text-white shadow transition-all shrink-0 self-end md:self-auto"
          >
            <span>전체 의원 성적표 확인</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </main>
  );
}