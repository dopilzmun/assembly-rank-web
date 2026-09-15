import Link from "next/link";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { BillRankingRow } from "@/types/ranking";
import HomeHeroSearch from "@/components/HomeHeroSearch";
import DailyBillPollWidget from "@/components/DailyBillPollWidget";
import MyDistrictWidget from "@/components/MyDistrictWidget";
import LifeChangesWidget from "@/components/LifeChangesWidget";
import PersonaLawmakerWidget from "@/components/PersonaLawmakerWidget";
import CitizenReactionWidget from "@/components/CitizenReactionWidget";
import {
  Trophy,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Users,
  FileText,
  Scale,
  Zap,
  ArrowUpRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface MacroStatsRow extends RowDataPacket {
  total_members: number;
  total_bills: number;
  avg_cmt_present_rate: number;
  avg_aprv_rate: number;
}

interface TopMemberRow extends RowDataPacket {
  assemb_id: string;
  assemb_nm: string;
  pltprt_nm: string;
  rgn_nm: string | null;
  score: number;
  rnkg: number;
  aprv_cnt: number;
  ttl_motn_cnt: number;
}

interface RecentPassedBillRow extends RowDataPacket {
  bill_id: string;
  bill_nm: string;
  curr_cmit_nm: string | null;
  process_stat: string | null;
  process_dd: string | null;
}

interface CommitteeSpeedRow extends RowDataPacket {
  curr_cmit_nm: string;
  avg_days: number;
  cnt: number;
}

const PARTY_COLORS: Record<string, string> = {
  더불어민주당: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
  국민의힘: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900",
  조국혁신당: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900",
  개혁신당: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-900",
  진보당: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900",
  기본소득당: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900",
  사회민주당: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-900",
  무소속: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

export default async function HomePage() {
  let macro = {
    total_members: 300,
    total_bills: 0,
    avg_cmt_present_rate: 0,
    avg_aprv_rate: 0,
  };
  let topMember: TopMemberRow | null = null;
  let recentPassedBills: RecentPassedBillRow[] = [];
  let fastestCmit: CommitteeSpeedRow | null = null;
  let slowestCmit: CommitteeSpeedRow | null = null;
  let allMembers: BillRankingRow[] = [];

  try {
    // 1. 거시 지표 집계
    const [macroRows] = await pool.query<MacroStatsRow[]>(
      `SELECT 
        (SELECT COUNT(*) FROM assemb_mastr WHERE age = 22) AS total_members,
        (SELECT COUNT(*) FROM bill_tr WHERE age = 22) AS total_bills,
        COALESCE(ROUND(AVG(cmt_present_rate), 1), 0) AS avg_cmt_present_rate,
        COALESCE(ROUND(AVG(aprv_rate), 1), 0) AS avg_aprv_rate
       FROM vw_bill_efct_rnkg_01
       WHERE age = 22;`
    );
    if (macroRows && macroRows.length > 0) {
      macro = macroRows[0];
    }

    // 2. 종합 1위 의원
    const [topMemberRows] = await pool.query<TopMemberRow[]>(
      `SELECT assemb_id, assemb_nm, pltprt_nm, rgn_nm, score, rnkg, aprv_cnt, ttl_motn_cnt
       FROM vw_bill_efct_rnkg_01
       WHERE age = 22 AND is_deferred = 0
       ORDER BY rnkg ASC
       LIMIT 1;`
    );
    if (topMemberRows && topMemberRows.length > 0) {
      topMember = topMemberRows[0];
    }

    // 3. 최근 본회의 가결 법안 3건
    const [passedBillRows] = await pool.query<RecentPassedBillRow[]>(
      `SELECT 
        bill_id, bill_nm, curr_cmit_nm, process_stat, 
        DATE_FORMAT(process_dd, '%Y-%m-%d') AS process_dd
       FROM bill_tr
       WHERE age = 22 AND (process_stat LIKE '%가결%' OR process_stat LIKE '%반영폐기%')
       ORDER BY process_dd DESC, bill_id DESC
       LIMIT 3;`
    );
    recentPassedBills = passedBillRows;

    // 4. 상임위 심사 속도 (최속 vs 최장 병목)
    const [cmitRows] = await pool.query<CommitteeSpeedRow[]>(
      `SELECT curr_cmit_nm, ROUND(AVG(DATEDIFF(cmt_present_dd, motn_dd)), 1) AS avg_days, COUNT(*) AS cnt
       FROM bill_tr
       WHERE age = 22 AND cmt_present_dd IS NOT NULL AND curr_cmit_nm IS NOT NULL AND curr_cmit_nm != ''
       GROUP BY curr_cmit_nm
       HAVING cnt >= 10
       ORDER BY avg_days ASC;`
    );
    if (cmitRows && cmitRows.length > 0) {
      fastestCmit = cmitRows[0];
      slowestCmit = cmitRows[cmitRows.length - 1];
    }

    // 5. 전체 300인 의원 랭킹 데이터 (전 위젯 공통 주입)
    const [allMemberRows] = await pool.query<RowDataPacket[]>(
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
       WHERE age = 22
       ORDER BY rnkg ASC;`
    );
    allMembers = (allMemberRows || []) as unknown as BillRankingRow[];

  } catch (err) {
    console.error("HomePage server data fetch error:", err);
  }

  return (
    <div className="flex flex-col min-h-screen">

      {/* =========================================================
          ZONE 1. 오늘의 참여 & 우리 동네 (Daily Engagement)
          ========================================================= */}
      <section className="bg-white dark:bg-slate-950 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <HomeHeroSearch />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 h-full">
              <DailyBillPollWidget />
            </div>
            <div className="lg:col-span-6 h-full">
              <MyDistrictWidget allMembers={allMembers} />
            </div>
          </div>
        </div>
      </section>


      {/* =========================================================
          ZONE 2. [전진 배치] 화제의 의원 & 실시간 시민 감정 레이더
          ========================================================= */}
      <section className="bg-slate-50/70 dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800/80 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
              <Users className="h-3.5 w-3.5" />
              <span>실시간 시민 감정 레이더</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              지금 시민들의 민심은 어디로 향하고 있을까요?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              최근 7일간 시민들이 스탬프로 표현한 가장 응원받는 의원과 가장 주목(분발)받는 의원 TOP 3입니다.
            </p>
          </div>

          <CitizenReactionWidget allMembers={allMembers} />
        </div>
      </section>


      {/* =========================================================
          ZONE 3. 내 삶의 입법 체감 & 맞춤 의원 (Life & Persona)
          ========================================================= */}
      <section className="bg-white dark:bg-slate-950 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>체감형 생활 입법 분석</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              법안이 통과되면, 내 일상은 어떻게 바뀔까요?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              어려운 법률 용어 대신 Before & After 변화로 확인하고, 내 라이프스타일 분야에서 실질적으로 법안을 가결시킨 의원을 확인하세요.
            </p>
          </div>

          {/* 3.1 생활 변화 Before & After 위젯 */}
          <LifeChangesWidget />

          {/* 3.2 페르소나별 입법 성적표 위젯 */}
          <PersonaLawmakerWidget allMembers={allMembers} />
        </div>
      </section>


      {/* =========================================================
          ZONE 4. 제22대 팩트체크 & 데이터 랩 (Legislative Data Lab)
          ========================================================= */}
      <section className="bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-200/80 dark:border-slate-800/80 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* 4.1 섹션 헤더 (모바일 액션 버튼 정렬 최적화) */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>제22대 국회 공식 입법 팩트체크</span>
              </div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                300인 국회의원 입법 데이터 랩
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                단순 발의 건수 중심의 보여주기식 입법을 배제하고, 실질 가결과 심사 신속도를 정량 집계합니다.
              </p>
            </div>

            <Link
              href="/rankings"
              className="inline-flex items-center justify-center gap-1.5 self-start sm:self-auto rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-indigo-600 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-indigo-500 dark:hover:text-white shrink-0"
            >
              <span>300인 전체 순위표 보기</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* 4.2 거시 핵심 지표 요약 바 (모바일 반응형 타이포그래피 & 아이콘 보강) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* KPI 1: 재적 의원 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">재적 의원</span>
                <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <Users className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <strong className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-slate-900 dark:text-slate-100 block">
                  {macro.total_members}명
                </strong>
                <span className="mt-1 text-[11px] text-slate-400 block font-medium">제22대 국회 공식</span>
              </div>
            </div>

            {/* KPI 2: 총 대표발의 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">총 대표발의</span>
                <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <FileText className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <strong className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-slate-900 dark:text-slate-100 block">
                  {Number(macro.total_bills).toLocaleString()}건
                </strong>
                <span className="mt-1 text-[11px] text-slate-400 block font-medium">누적 의원 발의 법안</span>
              </div>
            </div>

            {/* KPI 3: 상임위 심사착수율 */}
            <div className="rounded-2xl border border-indigo-100 bg-white p-4 sm:p-5 shadow-xs dark:border-indigo-950/60 dark:bg-slate-900 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">상임위 심사착수율</span>
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Clock className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <strong className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400 block">
                  {macro.avg_cmt_present_rate}%
                </strong>
                <span className="mt-1 text-[11px] text-slate-400 block font-medium">발의 후 첫 상정 비율</span>
              </div>
            </div>

            {/* KPI 4: 본회의 실질가결률 */}
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5 shadow-xs dark:border-emerald-950/60 dark:bg-slate-900 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">본회의 실질가결률</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <strong className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                  {macro.avg_aprv_rate}%
                </strong>
                <span className="mt-1 text-[11px] text-slate-400 block font-medium">원안 + 대안반영 가결</span>
              </div>
            </div>

          </div>

          {/* 4.3 3대 큐레이션 하이라이트 (모바일 카드 가독성 & 컴팩트 그리드 최적화) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* 하이라이트 1: 종합 1위 의원 카드 */}
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-indigo-50/30 p-5 shadow-xs dark:border-amber-900/50 dark:from-slate-900 dark:to-slate-900 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                    <Trophy className="h-3.5 w-3.5" />
                    제22대 종합 1위
                  </span>
                  <span className="text-sm font-mono font-black text-indigo-600 dark:text-indigo-400">
                    {topMember ? `${Number(topMember.score).toFixed(1)}점` : "-"}
                  </span>
                </div>

                {topMember ? (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                        {topMember.assemb_nm}
                      </h3>
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${PARTY_COLORS[topMember.pltprt_nm] || "bg-slate-100 text-slate-600"}`}>
                        {topMember.pltprt_nm}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {topMember.rgn_nm || "비례대표"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/80 p-3 border border-slate-200/70 text-xs dark:bg-slate-800/60 dark:border-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">실질가결</span>
                        <strong className="font-mono text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                          {topMember.aprv_cnt}건
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">대표발의</span>
                        <strong className="font-mono text-sm sm:text-base font-black text-slate-800 dark:text-slate-200">
                          {topMember.ttl_motn_cnt}건
                        </strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">집계 중입니다.</div>
                )}
              </div>

              <Link
                href="/rankings"
                className="inline-flex items-center justify-between w-full pt-3 border-t border-slate-200/60 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors dark:border-slate-800"
              >
                <span>전체 300인 종합 성적표 보기</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 하이라이트 2: 최근 본회의 가결 법안 속보 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    본회의 가결 속보
                  </span>
                  <Link href="/live" className="text-[11px] font-semibold text-indigo-600 hover:underline">
                    실시간 더보기
                  </Link>
                </div>

                <div className="mt-3 space-y-2.5">
                  {recentPassedBills.length > 0 ? (
                    recentPassedBills.map((b) => {
                      const isAlt = b.process_stat?.includes("반영폐기");
                      return (
                        <div key={b.bill_id} className="text-xs space-y-1 p-2 rounded-lg hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/60">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                              {b.curr_cmit_nm || "소관위 미배정"}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${isAlt ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}`}>
                              {isAlt ? "대안반영" : "원안가결"}
                            </span>
                          </div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate leading-snug" title={b.bill_nm}>
                            {b.bill_nm}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            가결일: {b.process_dd}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">가결 내역 집계 중</div>
                  )}
                </div>
              </div>

              <span className="text-[11px] text-slate-400 block pt-1 border-t border-slate-100 dark:border-slate-800">
                * 최근 본회의를 통과한 법률안 속보
              </span>
            </div>

            {/* 하이라이트 3: 상임위 심사 속도 진단 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    상임위 심사 속도 진단
                  </span>
                  <Link href="/committees" className="text-[11px] font-semibold text-indigo-600 hover:underline">
                    병목 진단
                  </Link>
                </div>

                <div className="mt-3 space-y-2.5">
                  {/* 최속 상임위 */}
                  <div className="rounded-xl bg-emerald-50/60 p-3 text-xs dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-emerald-600" />
                        최속 상임위
                      </span>
                      <strong className="font-mono text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-black">
                        평균 {fastestCmit?.avg_days || "-"}일
                      </strong>
                    </div>
                    <p className="mt-1 font-extrabold text-slate-800 dark:text-slate-200 truncate">
                      {fastestCmit?.curr_cmit_nm || "집계 중"}
                    </p>
                  </div>

                  {/* 최장 지연 상임위 (병목) */}
                  <div className="rounded-xl bg-rose-50/60 p-3 text-xs dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/60">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-rose-600" />
                        최장 지연(병목)
                      </span>
                      <strong className="font-mono text-rose-700 dark:text-rose-400 text-xs sm:text-sm font-black">
                        평균 {slowestCmit?.avg_days || "-"}일
                      </strong>
                    </div>
                    <p className="mt-1 font-extrabold text-slate-800 dark:text-slate-200 truncate">
                      {slowestCmit?.curr_cmit_nm || "집계 중"}
                    </p>
                  </div>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 block pt-1 border-t border-slate-100 dark:border-slate-800">
                * 발의 후 상임위 첫 상정까지의 소요일 기준
              </span>
            </div>

          </div>

          {/* 4.4 100점 만점 공정 평가 산식 배너 (반응형 칩 리디자인) */}
          <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/40 p-5 dark:border-indigo-950/80 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-600 shrink-0" />
                <strong className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  왜곡 없는 입법 효율성 100점 만점 산출 기준
                </strong>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                단순 발의 건수 중심의 과열을 지양하고, 법안의 본회의 실질가결(45점)과 상임위 심사착수(35점)에 높은 가중치를 둡니다.
              </p>
            </div>

            {/* 평가 가중치 칩 (컬러 코딩) */}
            <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs font-black shrink-0 flex-wrap">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-700 shadow-xs dark:bg-slate-800 dark:border-emerald-900 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>가결 45점</span>
              </div>
              <span className="text-slate-400">+</span>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 shadow-xs dark:bg-slate-800 dark:border-indigo-900 dark:text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>상정 35점</span>
              </div>
              <span className="text-slate-400">+</span>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>발의 20점</span>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}