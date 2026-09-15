"use client";

import { useState } from "react";
import { WeeklyRadarStats } from "@/types/activity";
import {
  Zap,
  Sparkles,
  Flame,
  ChevronRight,
  ExternalLink,
  FileText,
  Clock,
  CheckCircle2,
  User,
} from "lucide-react";

interface LegislativeLiveRadarProps {
  data: WeeklyRadarStats;
  onSelectAssemb: (assembId: string) => void;
}

type TabType = "전체" | "가결" | "상정" | "발의";

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

export default function LegislativeLiveRadar({
  data,
  onSelectAssemb,
}: LegislativeLiveRadarProps) {
  const [activeTab, setActiveTab] = useState<TabType>("전체");

  // 피드 필터링
  const filteredEvents = (data.recent_events || []).filter((event) => {
    if (activeTab === "전체") return true;
    return event.action_type === activeTab;
  });

  const handleMetricClick = (target: TabType) => {
    setActiveTab((prev) => (prev === target ? "전체" : target));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      
      {/* =========================================================
          좌측: 최근 입법 레이더 & 다발의 Movers
          ========================================================= */}
      <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-6">
        <div className="space-y-5">
          
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 shrink-0">
                <Zap className="w-4 h-4 text-indigo-300" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight whitespace-nowrap">
                  최근 입법 레이더
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 whitespace-nowrap font-mono">
                  {data.period_label || "최근 14일"}
                </span>
              </div>
            </div>

            <span className="text-xs text-amber-300 font-semibold flex items-center gap-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">단기 페이스</span>
            </span>
          </div>

          {/* 3대 핵심 수치 박스 (클릭 시 우측 탭 자동 연동) */}
          <div className="grid grid-cols-3 gap-2 text-center">
            
            {/* 1. 본회의 가결 */}
            <button
              type="button"
              onClick={() => handleMetricClick("가결")}
              className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer text-center relative ${
                activeTab === "가결"
                  ? "bg-emerald-600/40 border-emerald-400 shadow-md ring-2 ring-emerald-400/60"
                  : data.recent_aprv_total > 0
                  ? "bg-emerald-500/15 border-emerald-500/40 hover:bg-emerald-500/25"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              {data.recent_aprv_total > 0 && activeTab !== "가결" && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
              <span className="text-[11px] text-emerald-200 block font-medium whitespace-nowrap">본회의 가결</span>
              <strong className="text-lg sm:text-2xl font-black font-mono block mt-0.5 text-emerald-300">
                {data.recent_aprv_total}
              </strong>
              <span className="text-[10px] text-slate-400 font-mono">건</span>
            </button>

            {/* 2. 상임위 상정 */}
            <button
              type="button"
              onClick={() => handleMetricClick("상정")}
              className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer text-center relative ${
                activeTab === "상정"
                  ? "bg-indigo-600/50 border-indigo-400 shadow-md ring-2 ring-indigo-400/60"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <span className="text-[11px] text-indigo-200 block font-medium whitespace-nowrap">상임위 상정</span>
              <strong className="text-lg sm:text-2xl font-black font-mono block mt-0.5 text-indigo-200">
                {data.recent_present_total}
              </strong>
              <span className="text-[10px] text-slate-400 font-mono">건</span>
            </button>

            {/* 3. 신규 발의 */}
            <button
              type="button"
              onClick={() => handleMetricClick("발의")}
              className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer text-center relative ${
                activeTab === "발의"
                  ? "bg-slate-700/60 border-slate-400 shadow-md ring-2 ring-slate-400/60"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <span className="text-[11px] text-slate-300 block font-medium whitespace-nowrap">신규 발의</span>
              <strong className="text-lg sm:text-2xl font-black font-mono block mt-0.5 text-white">
                {data.recent_motn_total}
              </strong>
              <span className="text-[10px] text-slate-400 font-mono">건</span>
            </button>

          </div>

          {/* 최근 최다 발의 의원 (Movers) */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold flex items-center gap-1.5 text-amber-300">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="whitespace-nowrap">최근 최다 발의 의원 TOP 3</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {data.period_label || "최근 14일"}
              </span>
            </div>

            <div className="space-y-2">
              {(data.top_movers || []).map((m, idx) => (
                <div
                  key={m.assemb_id}
                  onClick={() => onSelectAssemb(m.assemb_id)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/40 transition-all cursor-pointer group text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-center font-mono font-black text-amber-300 text-sm">
                      {idx + 1}
                    </span>
                    <strong className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors whitespace-nowrap">
                      {m.assemb_nm}
                    </strong>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-white/10 text-slate-200 whitespace-nowrap">
                      {m.pltprt_nm}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-slate-300 shrink-0">
                    <strong className="text-white text-xs whitespace-nowrap">{m.recent_cnt}건</strong>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <p className="text-[11px] text-slate-400 border-t border-white/10 pt-3">
          * 상단 지표 박스를 누르면 우측 피드가 해당 안건으로 자동 필터링됩니다.
        </p>
      </div>

      {/* =========================================================
          우측: 실시간 파이프라인 타임라인 피드
          ========================================================= */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-4 dark:bg-slate-900 dark:border-slate-800">
        
        {/* 헤더 & 탭바 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900 whitespace-nowrap dark:text-slate-100">
              실시간 입법 파이프라인 타임라인
            </h3>
          </div>

          {/* 4대 탭 (전체, 가결, 상정, 발의) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto shrink-0 dark:bg-slate-800">
            {(["전체", "가결", "상정", "발의"] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 text-xs ${
                    isActive
                      ? tab === "가결"
                        ? "bg-white text-emerald-700 shadow-xs font-bold dark:bg-slate-900 dark:text-emerald-400"
                        : tab === "상정"
                        ? "bg-white text-indigo-700 shadow-xs font-bold dark:bg-slate-900 dark:text-indigo-400"
                        : tab === "발의"
                        ? "bg-white text-slate-900 shadow-xs font-bold dark:bg-slate-900 dark:text-slate-100"
                        : "bg-white text-slate-900 shadow-xs font-bold dark:bg-slate-900 dark:text-slate-100"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* 피드 목록 리스트 */}
        <div className="flex-1 overflow-y-auto max-h-[520px] space-y-2.5 pr-1">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((item) => {
              const isPassed = item.action_type === "가결";
              const isPresent = item.action_type === "상정";
              const displayDate = item.event_date?.includes("-")
                ? item.event_date.slice(5)
                : item.event_date;

              return (
                <div
                  key={`${item.bill_id}-${item.action_type}`}
                  className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                    isPassed
                      ? "bg-emerald-50/50 border-emerald-200/90 hover:border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900"
                      : isPresent
                      ? "bg-indigo-50/40 border-indigo-200/70 hover:border-indigo-300 dark:bg-indigo-950/20 dark:border-indigo-900"
                      : "bg-slate-50/70 border-slate-200/80 hover:border-slate-300 dark:bg-slate-800/40 dark:border-slate-800"
                  }`}
                >
                  {/* 1열: 날짜, 액션 뱃지, 소관위/처리결과 메타 */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 text-[11px] font-semibold">
                        {displayDate}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          isPassed
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                            : isPresent
                            ? "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800"
                            : "bg-slate-200/80 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {isPassed && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {isPresent && <Clock className="w-3 h-3 text-indigo-600" />}
                        {!isPassed && !isPresent && <FileText className="w-3 h-3 text-slate-500" />}
                        <span>{item.action_type}</span>
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-semibold truncate max-w-[180px] sm:max-w-xs ${
                        isPassed
                          ? "text-emerald-700 dark:text-emerald-400"
                          : isPresent
                          ? "text-indigo-700 dark:text-indigo-400"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {item.detail_text}
                    </span>
                  </div>

                  {/* 2열: 법안명 (클릭 또는 툴팁) */}
                  <p
                    className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug truncate dark:text-slate-100"
                    title={item.bill_nm}
                  >
                    {item.bill_nm}
                  </p>

                  {/* 3열: 대표발의 의원 마이크로 프로필 칩 & 국회 의안 원문 링크 */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    {/* 의원 드로어 호출 칩 */}
                    <button
                      type="button"
                      onClick={() => onSelectAssemb(item.assemb_id)}
                      className="inline-flex items-center gap-1.5 py-1 px-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                      title={`${item.assemb_nm} 의원 상세 성적표 열기`}
                    >
                      <User className="w-3 h-3 text-slate-400" />
                      <strong className="text-xs font-bold">{item.assemb_nm}</strong>
                      <span
                        className={`px-1 py-0.2 rounded text-[10px] font-semibold border ${
                          PARTY_COLORS[item.pltprt_nm] || "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {item.pltprt_nm}
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                    </button>

                    {/* 의안 원문 공식 링크 (HTTPS) */}
                    <a
                      href={`https://likms.assembly.go.kr/bill/billDetail.do?billId=${item.bill_id}&ageFrom=22&ageTo=22`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer text-[11px] font-medium dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                      title="국회 의안정보시스템 원문"
                    >
                      <span>원문</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center text-xs sm:text-sm text-slate-400 bg-slate-50 rounded-xl dark:bg-slate-800/40">
              선택하신 조건('{activeTab}')에 해당하는 최근 입법 안건이 없습니다.
            </div>
          )}
        </div>

        {/* 하단 안내 푸터 */}
        <div className="shrink-0 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 dark:border-slate-800">
          <span>* 의원 칩을 터치하면 상세 성적표가 열립니다.</span>
          <span className="font-mono font-bold">총 {filteredEvents.length}건 표시</span>
        </div>

      </div>

    </div>
  );
}