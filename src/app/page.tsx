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

    // 5. 전체 300인 의원 랭킹 데이터 (MyDistrictWidget 및 CitizenReactionWidget 전송용)
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
          배경: Clean White
          ========================================================= */}
      <section className="bg-white dark:bg-slate-950 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* 1.1 통합 검색 바 */}
          <div>
            <HomeHeroSearch />
          </div>

          {/* 1.2 오늘의 쟁점 투표 & 우리 동네 의원실 (2분할 레이아웃) */}
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
          ZONE 2. 내 삶의 입법 체감 (Life & Persona Legislation)
          배경: Soft Slate-50 / 테두리 구분선
          ========================================================= */}
      <section className="bg-slate-50/70 dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800/80 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* 2.1 섹션 통합 헤더 */}
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

          {/* 2.2 생활 변화 Before & After 위젯 */}
          <LifeChangesWidget />

          {/* 2.3 페르소나별 입법 성적표 위젯 */}
          <PersonaLawmakerWidget />

        </div>
      </section>


      {/* =========================================================
          ZONE 3. 제22대 입법 데이터 랩 (Legislative Data Lab)
          배경: Clean White
          ========================================================= */}
      <section className="bg-white dark:bg-slate-950 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* 3.1 섹션 헤더 */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>제22대 국회 공식 통계</span>
              </div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                300인 국회의원 입법 데이터 랩
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                단순 발의 건수 중심의 보여주기식 입법을 배제하고, 실질 가결과 심사 신속도를 정량 집계합니다.
              </p>
            </div>

            <Link
              href="/rankings"
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-indigo-600 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-indigo-500 dark:hover:text-white"
            >
              <span>300인 전체 순위 보기</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* 3.2 거시 핵심 지표 요약 바 (KPI Bar) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">재적 의원</span>
              <strong className="mt-1.5 text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-slate-100 block">
                {macro.total_members}명
              </strong>
              <span className="mt-1 text-[11px] text-slate-400">제22대 국회 공식</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">총 대표발의</span>
              <strong className="mt-1.5 text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-slate-100 block">
                {Number(macro.total_bills).toLocaleString()}건
              </strong>
              <span className="mt-1 text-[11px] text-slate-400">의원 발의 법률안</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block">상임위 심사착수율</span>
              <strong className="mt-1.5 text-2xl sm:text-3xl font-black font-mono text-indigo-700 dark:text-indigo-300 block">
                {macro.avg_cmt_present_rate}%
              </strong>
              <span className="mt-1 text-[11px] text-slate-400">발의 후 첫 상정 비율</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">본회의 실질가결률</span>
              <strong className="mt-1.5 text-2xl sm:text-3xl font-black font-mono text-emerald-700 dark:text-emerald-300 block">
                {macro.avg_aprv_rate}%
              </strong>
              <span className="mt-1 text-[11px] text-slate-400">원안 + 대안반영 가결</span>
            </div>
          </div>

          {/* 3.3 3대 큐레이션 하이라이트 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* 하이라이트 1: 종합 1위 의원 카드 */}
            <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-indigo-50/50 via-white to-white p-5 shadow-xs dark:border-slate-800 dark:from-slate-900/80 dark:to-slate-900">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  <Trophy className="h-3.5 w-3.5" />
                  제22대 종합 1위
                </span>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {topMember ? `${Number(topMember.score).toFixed(1)}점` : "-"}
                </span>
              </div>

              {topMember ? (
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                      {topMember.assemb_nm}
                    </h3>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {topMember.pltprt_nm}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {topMember.rgn_nm || "비례대표"}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                    <div>
                      <span className="text-slate-400 block text-[11px]">실질가결</span>
                      <strong className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {topMember.aprv_cnt}건
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">대표발의</span>
                      <strong className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                        {topMember.ttl_motn_cnt}건
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">집계 중입니다.</div>
              )}
            </div>

            {/* 하이라이트 2: 최근 본회의 가결 법안 속보 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  본회의 가결 속보
                </span>
                <Link href="/live" className="text-[11px] font-semibold text-indigo-600 hover:underline">
                  더보기
                </Link>
              </div>

              <div className="mt-3 space-y-2.5">
                {recentPassedBills.length > 0 ? (
                  recentPassedBills.map((b) => (
                    <div key={b.bill_id} className="text-xs space-y-0.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{b.curr_cmit_nm || "소관위"}</span>
                        <span>{b.process_dd}</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {b.bill_nm}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">가결 내역 집계 중</div>
                )}
              </div>
            </div>

            {/* 하이라이트 3: 상임위 심사 속도 진단 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    상임위 심사 속도 진단
                  </span>
                  <Link href="/committees" className="text-[11px] font-semibold text-indigo-600 hover:underline">
                    병목 분석
                  </Link>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-emerald-50/70 p-3 text-xs dark:bg-emerald-950/30">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300">최속 상임위</span>
                      <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                        평균 {fastestCmit?.avg_days || "-"}일
                      </strong>
                    </div>
                    <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300">
                      {fastestCmit?.curr_cmit_nm || "집계 중"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-rose-50/70 p-3 text-xs dark:bg-rose-950/30">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-900 dark:text-rose-300">최장 지연(병목)</span>
                      <strong className="font-mono text-rose-700 dark:text-rose-400">
                        평균 {slowestCmit?.avg_days || "-"}일
                      </strong>
                    </div>
                    <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300">
                      {slowestCmit?.curr_cmit_nm || "집계 중"}
                    </p>
                  </div>
                </div>
              </div>

              <span className="mt-3 text-[10px] text-slate-400">
                * 발의 후 상임위 첫 상정까지 걸린 소요일 기준
              </span>
            </div>

          </div>

          {/* 3.4 100점 평가 산식 배너 */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 dark:border-indigo-950/60 dark:bg-indigo-950/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                공정한 입법 효율성 100점 만점 평가 기준
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                단순 발의 수보다 법안의 본회의 실질가결(45점)과 상임위 심사착수(35점)에 높은 가중치를 둡니다.
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-indigo-900 dark:text-indigo-200 shrink-0">
              <span className="rounded-lg bg-white px-2.5 py-1.5 shadow-xs dark:bg-slate-800">가결 45</span>
              <span>+</span>
              <span className="rounded-lg bg-white px-2.5 py-1.5 shadow-xs dark:bg-slate-800">상정 35</span>
              <span>+</span>
              <span className="rounded-lg bg-white px-2.5 py-1.5 shadow-xs dark:bg-slate-800">발의 20</span>
            </div>
          </div>

        </div>
      </section>


      {/* =========================================================
          ZONE 4. 시민 참여 광장 (Citizen Sentiment)
          배경: Soft Slate-50 / 상단 구분선
          ========================================================= */}
      <section className="bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-200/80 dark:border-slate-800/80 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
              <Users className="h-3.5 w-3.5" />
              <span>시민 여론 & 감정 레이더</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              국회의원을 향한 시민들의 실시간 반응
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              최근 7일간 시민들이 스탬프로 표현한 가장 응원받는 의원과 가장 주목(분발)받는 의원 TOP 3입니다.
            </p>
          </div>

          <CitizenReactionWidget allMembers={allMembers} />

        </div>
      </section>

    </div>
  );
}