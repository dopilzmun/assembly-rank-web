"use client";

import { useState } from "react";
import { WeeklyRadarStats } from "@/types/activity";
import {
  Zap,
  Radio,
  FileText,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Filter,
} from "lucide-react";

interface LegislativeLiveRadarProps {
  data: WeeklyRadarStats;
  onSelectAssemb?: (assembId: string) => void;
}

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

export default function LegislativeLiveRadar({ data, onSelectAssemb }: LegislativeLiveRadarProps) {
  const [filterType, setFilterType] = useState<"ALL" | "발의" | "상정" | "가결">("ALL");

  const filteredEvents = data.recent_events.filter((evt) => {
    if (filterType === "ALL") return true;
    return evt.action_type === filterType;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
      
      {/* 1. 좌측: 금주의 입법 레이더 (Weekly Movers) */}
      <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3.5 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-400/30">
                <Zap className="w-4 h-4 animate-pulse text-amber-400" />
              </span>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  최근 입법 레이더
                  <span className="text-[10px] font-normal text-indigo-300 bg-indigo-800/60 px-2 py-0.5 rounded-full border border-indigo-700 whitespace-nowrap">
                    {data.period_label}
                  </span>
                </h3>
              </div>
            </div>
            <span className="text-[11px] text-indigo-300/80 hidden sm:flex items-center gap-1 whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-amber-300" /> 집중도 분석
            </span>
          </div>

          {/* 최근 14일 3대 파이프라인 합계 */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="bg-white/5 border border-white/10 rounded-xl p-2 sm:p-2.5">
              <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-0.5 whitespace-nowrap">신규 발의</span>
              <strong className="text-sm sm:text-base font-black text-indigo-300">
                {data.recent_motn_total}
              </strong>
              <span className="text-[10px] text-slate-400 block">건</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2 sm:p-2.5">
              <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-0.5 whitespace-nowrap">상임위 상정</span>
              <strong className="text-sm sm:text-base font-black text-amber-300">
                {data.recent_present_total}
              </strong>
              <span className="text-[10px] text-slate-400 block">건</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2 sm:p-2.5">
              <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-0.5 whitespace-nowrap">본회의 가결</span>
              <strong className="text-sm sm:text-base font-black text-emerald-300">
                {data.recent_aprv_total}
              </strong>
              <span className="text-[10px] text-slate-400 block">건</span>
            </div>
          </div>

          {/* 최근 최다 발의 의원 TOP 3 */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-semibold text-indigo-200 flex items-center justify-between whitespace-nowrap">
              <span>🔥 최근 최다 발의 의원 (Movers)</span>
              <span className="text-[10px] text-indigo-300/70 font-normal">단기 페이스</span>
            </span>

            <div className="space-y-1.5">
              {data.top_movers.length > 0 ? (
                data.top_movers.map((mover, idx) => (
                  <div
                    key={mover.assemb_id}
                    onClick={() => onSelectAssemb?.(mover.assemb_id)}
                    className="flex items-center justify-between bg-white/5 hover:bg-indigo-600/30 border border-white/10 rounded-lg px-3 py-2 transition-all text-xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-4 text-center font-bold font-mono text-amber-400 text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-white whitespace-nowrap shrink-0">
                        {mover.assemb_nm}
                      </span>
                      <span className="text-[10px] text-slate-300 px-1.5 py-0.2 rounded bg-white/10 whitespace-nowrap shrink-0">
                        {mover.pltprt_nm}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs shrink-0 whitespace-nowrap">
                      <strong className="text-indigo-300 font-bold">{mover.recent_cnt}</strong>
                      <span className="text-slate-400 text-[11px]">건</span>
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-400/60" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  최근 기간 동안 신규 발의 내역이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-2.5 mt-2.5 border-t border-white/10 text-[11px] text-indigo-300/80 flex items-center justify-between whitespace-nowrap">
          <span>* 카드 터치 시 의원 성적표 열람</span>
          <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        </div>
      </div>

      {/* 2. 우측: 실시간 입법 파이프라인 타임라인 피드 (필터 탭 탑재) */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="space-y-3">
          
          {/* 헤더 및 액션 필터 탭 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 truncate">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 whitespace-nowrap">
                실시간 파이프라인 피드
              </h3>
            </div>

            {/* 필터 탭 */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {[
                { label: "전체", value: "ALL" },
                { label: "발의", value: "발의" },
                { label: "상정", value: "상정" },
                { label: "가결", value: "가결" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilterType(tab.value as any)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterType === tab.value
                      ? "bg-white text-indigo-700 shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 타임라인 리스트 */}
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((evt, idx) => {
                const isAprv = evt.action_type === "가결";
                const isPresent = evt.action_type === "상정";

                return (
                  <div
                    key={`${evt.bill_id}-${idx}`}
                    onClick={() => onSelectAssemb?.(evt.assemb_id)}
                    className="flex items-start gap-2.5 sm:gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all text-xs cursor-pointer group"
                  >
                    <div className="flex flex-col items-center shrink-0 w-14 sm:w-16 pt-0.5">
                      <span className="font-mono text-[10px] text-slate-400 mb-0.5 whitespace-nowrap">
                        {evt.event_date.slice(5)}
                      </span>
                      {isAprv ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                          <CheckCircle2 className="w-2.5 h-2.5" /> 가결
                        </span>
                      ) : isPresent ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                          <Clock className="w-2.5 h-2.5" /> 상정
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                          <FileText className="w-2.5 h-2.5" /> 발의
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap sm:flex-nowrap">
                        <span className="font-bold text-slate-900 whitespace-nowrap shrink-0 group-hover:text-indigo-600">
                          {evt.assemb_nm}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border whitespace-nowrap shrink-0 ${
                            PARTY_COLORS[evt.pltprt_nm] || "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          {evt.pltprt_nm}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[150px] sm:max-w-[200px] whitespace-nowrap">
                          {evt.detail_text}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium truncate" title={evt.bill_nm}>
                        {evt.bill_nm}
                      </p>
                    </div>

                    <a
                      href={`http://likms.assembly.go.kr/bill/billDetail.do?billId=${evt.bill_id}&ageFrom=22&ageTo=22`}
                      onClick={(e) => e.stopPropagation()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-300 hover:text-indigo-600 p-1 shrink-0 transition-colors"
                      title="원문 보기"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                선택하신 필터 조건에 일치하는 변동 내역이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 하단 푸터 */}
        <div className="pt-2 mt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-[11px] text-slate-400">
          <span className="truncate">* 카드 터치 시 의원 상세 성적표 열람</span>
          <span className="shrink-0 whitespace-nowrap">최신 25건 표시</span>
        </div>
      </div>

    </div>
  );
}