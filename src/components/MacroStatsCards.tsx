"use client";

import { MacroOverviewStats, PartyOverviewStats } from "@/types/stats";
import {
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  ChevronRight,
} from "lucide-react";

interface MacroStatsCardsProps {
  overview: MacroOverviewStats;
  parties: PartyOverviewStats[];
}

const PARTY_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  더불어민주당: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", bar: "bg-blue-600" },
  국민의힘: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", bar: "bg-red-600" },
  조국혁신당: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", bar: "bg-sky-600" },
  개혁신당: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", bar: "bg-orange-600" },
  진보당: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", bar: "bg-purple-600" },
  기본소득당: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", bar: "bg-teal-600" },
  사회민주당: { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200", bar: "bg-yellow-500" },
  무소속: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", bar: "bg-gray-600" },
};

export default function MacroStatsCards({ overview, parties }: MacroStatsCardsProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* 1. 최상단 4대 거시 핵심 지표 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* 총 국회의원 수 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5 whitespace-nowrap">
              등록 국회의원
            </span>
            <strong className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {overview.total_assemb_cnt}
            </strong>
            <span className="text-xs text-slate-500 ml-1">인 전수</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600 shrink-0">
            <Award className="w-5 h-5 text-indigo-600" />
          </div>
        </div>

        {/* 총 대표발의 건수 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5 whitespace-nowrap">
              총 대표발의 법안
            </span>
            <strong className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {overview.total_motn_cnt.toLocaleString()}
            </strong>
            <span className="text-xs text-slate-500 ml-1">건</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600 shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        {/* 상임위 상정률 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5 whitespace-nowrap">
              상임위 심사 착수율
            </span>
            <strong className="text-xl sm:text-2xl font-black text-indigo-700 font-mono">
              {overview.overall_cmt_present_rate}%
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">
              {overview.total_cmt_present_cnt.toLocaleString()}건 상정
            </span>
          </div>
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* 본회의 실질 가결률 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5 whitespace-nowrap">
              본회의 실질 가결률
            </span>
            <strong className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
              {overview.overall_aprv_rate}%
            </strong>
            <span className="text-[10px] text-slate-400 block font-mono">
              {overview.total_aprv_cnt.toLocaleString()}건 처리
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 2. 정당별 입법 파이프라인 실적 비교 영역 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900 whitespace-nowrap">
                정당별 입법 파이프라인 실적 비교
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-semibold whitespace-nowrap">
                국회 평균 가결률: {overview.overall_aprv_rate}%
              </span>
            </div>
            {/* 한글 단어 단위 줄바꿈 break-keep 적용 */}
            <p className="text-xs text-slate-500 mt-1 break-keep">
              각 당의 전체 대표발의 법안 중 본회의 가결 및 상임위 심사 단계별 비중입니다.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium whitespace-nowrap shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 가결
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> 심사중
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> 미상정 방치
            </span>
          </div>
        </div>

        {/* 정당 카드 리스트 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {parties.map((p) => {
            const colors = PARTY_COLORS[p.pltprt_nm] || PARTY_COLORS["무소속"];
            const aprvRate = Number(p.aprv_rate) || 0;
            const presentRate = Number(p.cmt_present_rate) || 0;
            const diffFromAvg = Math.round((aprvRate - overview.overall_aprv_rate) * 10) / 10;
            const pendingRate = Math.max(0, Math.round((presentRate - aprvRate) * 10) / 10);
            const untouchedRate = Math.max(0, Math.round((100 - presentRate) * 10) / 10);

            return (
              <div
                key={p.pltprt_nm}
                className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3 transition-colors"
              >
                {/* 정당 뱃지 & 발의 건수 & 가결률 (줄바꿈 원천 차단) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border whitespace-nowrap shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}
                    >
                      {p.pltprt_nm}
                    </span>
                    <span className="text-xs text-slate-500 font-mono whitespace-nowrap truncate">
                      {p.assemb_cnt}명 · 발의 {p.total_motn_cnt.toLocaleString()}건
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                    {diffFromAvg > 0 ? (
                      <span className="text-[11px] font-bold text-emerald-600 font-mono">
                        ↗ +{diffFromAvg}%p
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400 font-mono">
                        {diffFromAvg}%p
                      </span>
                    )}
                    <strong className="text-sm sm:text-base font-black text-slate-900 font-mono">
                      {aprvRate}%
                    </strong>
                  </div>
                </div>

                {/* 파이프라인 누적 바 */}
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${aprvRate}%` }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`가결: ${aprvRate}%`}
                  />
                  <div
                    style={{ width: `${pendingRate}%` }}
                    className="bg-indigo-600 h-full transition-all"
                    title={`상임위 심사중: ${pendingRate}%`}
                  />
                  <div
                    style={{ width: `${untouchedRate}%` }}
                    className="bg-slate-200 h-full transition-all"
                    title={`미상정 방치: ${untouchedRate}%`}
                  />
                </div>

                {/* 3대 세부 지표 (모바일 3분할 한 줄 고정) */}
                <div className="grid grid-cols-3 gap-1 text-center font-mono text-xs pt-0.5">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100 overflow-hidden">
                    <span className="text-[10px] text-slate-400 block whitespace-nowrap truncate">본회의 가결</span>
                    <strong className="text-[11px] sm:text-xs text-emerald-700 font-bold whitespace-nowrap">
                      {p.aprv_cnt}건 ({aprvRate}%)
                    </strong>
                  </div>

                  <div className="bg-white p-1.5 rounded-lg border border-slate-100 overflow-hidden">
                    <span className="text-[10px] text-slate-400 block whitespace-nowrap truncate">상임위 심사</span>
                    <strong className="text-[11px] sm:text-xs text-indigo-700 font-bold whitespace-nowrap">
                      {p.cmt_present_cnt}건 ({presentRate}%)
                    </strong>
                  </div>

                  <div className="bg-white p-1.5 rounded-lg border border-slate-100 overflow-hidden">
                    <span className="text-[10px] text-slate-400 block whitespace-nowrap truncate">미상정 방치</span>
                    <strong className="text-[11px] sm:text-xs text-slate-600 font-bold whitespace-nowrap">
                      {(p.total_motn_cnt - p.cmt_present_cnt).toLocaleString()}건 ({untouchedRate}%)
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}