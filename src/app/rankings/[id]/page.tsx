import { notFound } from "next/navigation";
import Link from "next/link";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import HexagonRadarChart from "@/components/HexagonRadarChart";
import {
  Award,
  CheckCircle2,
  ArrowLeft,
  FileText,
  Sparkles,
} from "lucide-react";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 1. 의원 기본 프로필 및 6대 역량 지표 조회
  const [memberRows] = await pool.query<RowDataPacket[]>(
    `SELECT 
      assemb_id, age, assemb_nm, pltprt_nm, rgn_nm, cmit_nm,
      DATE_FORMAT(term_start_dd, '%Y-%m-%d') AS term_start_dd,
      is_deferred, monthly_pace, ttl_motn_cnt, pure_aprv_cnt, alt_aprv_cnt,
      aprv_cnt, dss_cnt, aprv_rate, cmt_present_cnt, cmt_present_rate,
      avg_cmt_days, own_cmit_motn_cnt, own_cmit_motn_rate, score, rnkg
    FROM vw_bill_efct_rnkg_01
    WHERE assemb_id = ? AND age = 22
    LIMIT 1;`,
    [id]
  );

  if (!memberRows || memberRows.length === 0) {
    notFound();
  }

  const member = memberRows[0];

  // 2. 해당 의원의 최근 대표 발의 법안 15건 조회 (표준 컬럼 repve_assemb_id 사용)
  const [billRows] = await pool.query<RowDataPacket[]>(
    `SELECT 
      bill_id,
      bill_nm,
      curr_cmit_nm,
      process_stat,
      DATE_FORMAT(motn_dd, '%Y-%m-%d') AS motn_dd,
      DATE_FORMAT(process_dd, '%Y-%m-%d') AS process_dd,
      DATE_FORMAT(cmt_present_dd, '%Y-%m-%d') AS cmt_present_dd
    FROM bill_tr
    WHERE repve_assemb_id = ? AND age = 22
    ORDER BY motn_dd DESC, bill_id DESC
    LIMIT 15;`,
    [id]
  );

  // 3. 육각 상태도 100점 만점 정규화 로직
  const normalizedPace = Math.min(100, Math.round((Number(member.monthly_pace) / 3.5) * 100));
  const normalizedAprvCnt = Math.min(100, Math.round((Number(member.aprv_cnt) / 5) * 100));
  const normalizedAprvRate = Math.min(100, Math.round(Number(member.aprv_rate) * 3));
  const normalizedCmtRate = Math.min(100, Math.round(Number(member.cmt_present_rate)));
  const avgDays = Number(member.avg_cmt_days) || 120;
  const normalizedSpeed = Math.min(100, Math.max(15, Math.round(100 - (avgDays / 180) * 80)));
  const normalizedExpertise = Math.min(100, Math.round(Number(member.own_cmit_motn_rate)));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/rankings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>전체 랭킹 목록으로 돌아가기</span>
        </Link>
      </div>

      {/* 1. 의원 프로필 헤더 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                제22대 국회의원
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {member.pltprt_nm}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {member.rgn_nm || "비례대표"}
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {member.assemb_nm} 의원 의정 성적표
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              소관 상임위: <strong className="text-slate-700 dark:text-slate-200">{member.cmit_nm || "미배정"}</strong>
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 shrink-0">
            <div className="text-center">
              <span className="text-[11px] font-medium text-slate-500 block">종합 순위</span>
              <strong className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {member.rnkg}위
              </strong>
              <span className="text-[10px] text-slate-400">/ 300인</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700" />
            <div className="text-center">
              <span className="text-[11px] font-medium text-slate-500 block">입법 종합 점수</span>
              <strong className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {Number(member.score).toFixed(1)}점
              </strong>
              <span className="text-[10px] text-slate-400">/ 100점</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 6대 역량 육각 차트 & 지표 카드 */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 self-start pb-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              6대 입법 역량 육각 상태도
            </h2>
          </div>
          <HexagonRadarChart
            metrics={{
              pace: normalizedPace,
              aprv_cnt: normalizedAprvCnt,
              aprv_rate: normalizedAprvRate,
              cmt_present: normalizedCmtRate,
              speed: normalizedSpeed,
              expertise: normalizedExpertise,
            }}
          />
          <p className="mt-1 text-[11px] text-slate-400 text-center">
            정규화 환산 점수 기준 (중심에서 외곽일수록 우수)
          </p>
        </div>

        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-500 block font-medium">총 대표발의</span>
            <strong className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100 font-mono block">
              {member.ttl_motn_cnt}건
            </strong>
            <span className="text-[11px] text-slate-400">월평균 {member.monthly_pace}건</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-500 block font-medium">본회의 실질가결</span>
            <strong className="mt-1 text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono block">
              {member.aprv_cnt}건
            </strong>
            <span className="text-[11px] text-slate-400">
              단독 {member.pure_aprv_cnt} · 대안 {member.alt_aprv_cnt}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-500 block font-medium">실질가결 성공률</span>
            <strong className="mt-1 text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono block">
              {member.aprv_rate}%
            </strong>
            <span className="text-[11px] text-slate-400">가결 건수 대비</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-500 block font-medium">상임위 심사착수율</span>
            <strong className="mt-1 text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono block">
              {member.cmt_present_rate}%
            </strong>
            <span className="text-[11px] text-slate-400">상정 {member.cmt_present_cnt}건</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-500 block font-medium">심사 착수 속도</span>
            <strong className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100 font-mono block">
              {member.avg_cmt_days || "-"}일
            </strong>
            <span className="text-[11px] text-slate-400">발의 후 평균 소요</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-500 block font-medium">소관위 발의 집중도</span>
            <strong className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100 font-mono block">
              {member.own_cmit_motn_rate}%
            </strong>
            <span className="text-[11px] text-slate-400">{member.own_cmit_motn_cnt}건 집중</span>
          </div>
        </div>
      </div>

      {/* 3. 최근 대표발의 법안 목록 */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              최근 대표발의 법안 목록
            </h2>
          </div>
          <span className="text-xs text-slate-500">최근 15건</span>
        </div>

        <div className="mt-4 space-y-3">
          {billRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              해당 의원이 대표발의한 법안 데이터가 없습니다.
            </p>
          ) : (
            billRows.map((bill) => {
              const isPassed =
                bill.process_stat?.includes("가결") || bill.process_stat?.includes("반영폐기");

              return (
                <div
                  key={bill.bill_id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                        {bill.curr_cmit_nm || "소관위 미배정"}
                      </span>
                      <span className="text-slate-400 font-mono">발의일: {bill.motn_dd}</span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        isPassed
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : bill.cmt_present_dd
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {bill.process_stat
                        ? bill.process_stat.includes("반영폐기")
                          ? "대안반영 (병합 가결)"
                          : bill.process_stat
                        : bill.cmt_present_dd
                        ? `상임위 상정 (${bill.cmt_present_dd})`
                        : "위원회 접수"}
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {bill.bill_nm}
                  </h3>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}