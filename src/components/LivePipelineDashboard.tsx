"use client";

import { useState } from "react";
import { BillRankingRow } from "@/types/ranking";
import AssembDetailDrawer from "@/components/AssembDetailDrawer";
import {
  Zap,
  Sparkles,
  Flame,
  ChevronRight,
  ExternalLink,
  FileText,
  Clock,
  CheckCircle2,
  Layers,
} from "lucide-react";

export interface PipelineFeedItem {
  bill_id: string;
  bill_nm: string;
  curr_cmit_nm: string;
  event_date: string; // MM-DD
  raw_date: string;
  event_type: "motn" | "present" | "passed";
  status_text: string;
  assemb_id: string;
  assemb_nm: string;
  pltprt_nm: string;
}

interface TopMover {
  assemb_id: string;
  assemb_nm: string;
  pltprt_nm: string;
  cnt: number;
}

interface LivePipelineDashboardProps {
  radarMetrics: {
    newMotnCnt: number;
    newPresentCnt: number;
    newPassedCnt: number;
  };
  topMovers: TopMover[];
  feeds: {
    all: PipelineFeedItem[];
    motn: PipelineFeedItem[];
    present: PipelineFeedItem[];
    passed: PipelineFeedItem[];
  };
  allMembers: BillRankingRow[];
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

export default function LivePipelineDashboard({
  radarMetrics,
  topMovers,
  feeds,
  allMembers,
}: LivePipelineDashboardProps) {
  const [activeTab, setActiveTab] = useState<"all" | "motn" | "present" | "passed">("all");
  const [selectedMember, setSelectedMember] = useState<BillRankingRow | null>(null);

  const currentList = feeds[activeTab] || [];

  const handleMemberClick = (assembId: string) => {
    const found = allMembers.find((m) => m.assemb_id === assembId);
    if (found) setSelectedMember(found);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* ======================= 좌측: 최근 입법 레이더 카드 ======================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            
            {/* 상단 타이틀 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30">
                  <Zap className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black tracking-tight">최근 입법 레이더</h2>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      최근 14일 기준
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>단기 페이스</span>
              </span>
            </div>

            {/* 3대 핵심 수치 박스 (클릭 시 우측 탭 실시간 연동) */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              
              {/* 1. 신규 발의 */}
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "motn" ? "all" : "motn")}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left sm:text-center ${
                  activeTab === "motn"
                    ? "bg-indigo-600/40 border-indigo-400 shadow-md ring-2 ring-indigo-400/50"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <span className="text-[11px] sm:text-xs text-slate-300 block font-medium">신규 발의</span>
                <strong className="text-lg sm:text-2xl font-black font-mono block mt-0.5 text-white">
                  {radarMetrics.newMotnCnt}
                </strong>
                <span className="text-[10px] text-slate-400 font-mono">건</span>
              </button>

              {/* 2. 상임위 상정 */}
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "present" ? "all" : "present")}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left sm:text-center ${
                  activeTab === "present"
                    ? "bg-amber-500/30 border-amber-400 shadow-md ring-2 ring-amber-400/50"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <span className="text-[11px] sm:text-xs text-amber-200 block font-medium">상임위 상정</span>
                <strong className="text-lg sm:text-2xl font-black font-mono block mt-0.5 text-amber-300">
                  {radarMetrics.newPresentCnt}
                </strong>
                <span className="text-[10px] text-slate-400 font-mono">건</span>
              </button>

              {/* 3. 본회의 가결 (가결 건수 있을 시 초록 강조 점등) */}
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "passed" ? "all" : "passed")}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left sm:text-center relative ${
                  activeTab === "passed"
                    ? "bg-emerald-600/40 border-emerald-400 shadow-md ring-2 ring-emerald-400/50"
                    : radarMetrics.newPassedCnt > 0
                    ? "bg-emerald-500/15 border-emerald-500/40 hover:bg-emerald-500/25"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                {radarMetrics.newPassedCnt > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
                <span className="text-[11px] sm:text-xs text-emerald-200 block font-medium">본회의 가결</span>
                <strong className="text-lg sm:text-2xl font-black font-mono block mt-0.5 text-emerald-300">
                  {radarMetrics.newPassedCnt}
                </strong>
                <span className="text-[10px] text-slate-400 font-mono">건</span>
              </button>

            </div>

            {/* 최근 최다 발의 의원 (Movers) */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>최근 최다 발의 의원 (Movers)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">최근 14일</span>
              </div>

              <div className="space-y-2">
                {topMovers.map((m, idx) => (
                  <div
                    key={m.assemb_id}
                    onClick={() => handleMemberClick(m.assemb_id)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/40 transition-all cursor-pointer group text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center font-mono font-black text-amber-300 text-sm">
                        {idx + 1}
                      </span>
                      <strong className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {m.assemb_nm}
                      </strong>
                      <span className="px-1.5 py-0.2 rounded text-[11px] font-semibold bg-white/10 text-slate-200">
                        {m.pltprt_nm}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-slate-300">
                      <strong className="text-white text-xs">{m.cnt} 건</strong>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <p className="text-[11px] text-slate-400 border-t border-white/10 pt-3">
            * 숫자 박스를 터치하면 우측 피드가 해당 안건으로 자동 전환됩니다.
          </p>
        </div>

        {/* ======================= 우측: 실시간 파이프라인 피드 카드 ======================= */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between space-y-4">
          
          {/* 헤더 & 필터 탭 */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                실시간 파이프라인 피드
              </h3>
            </div>

            {/* 4대 탭 */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("motn")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === "motn"
                    ? "bg-white text-indigo-700 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                발의
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("present")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === "present"
                    ? "bg-white text-amber-700 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                상정
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("passed")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === "passed"
                    ? "bg-white text-emerald-700 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                가결
              </button>
            </div>
          </div>

          {/* 피드 목록 리스트 (최대 25건, 내부 스크롤) */}
          <div className="flex-1 overflow-y-auto max-h-[480px] space-y-2.5 pr-1">
            {currentList.length > 0 ? (
              currentList.map((item) => {
                const isPassed = item.event_type === "passed";
                const isPresent = item.event_type === "present";

                return (
                  <div
                    key={`${item.bill_id}-${item.event_type}`}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isPassed
                        ? "bg-emerald-50/50 border-emerald-200/90 hover:bg-emerald-50"
                        : isPresent
                        ? "bg-amber-50/30 border-amber-200/70 hover:bg-amber-50/60"
                        : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60"
                    }`}
                  >
                    {/* 좌측: 날짜 + 배지 */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="text-center shrink-0 w-12 font-mono">
                        <span className="text-[11px] text-slate-400 block">{item.event_date}</span>
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                            isPassed
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : isPresent
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-slate-200/80 text-slate-700 border-slate-300"
                          }`}
                        >
                          {isPassed && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />}
                          {isPresent && <Layers className="w-2.5 h-2.5 text-amber-600" />}
                          {!isPassed && !isPresent && <FileText className="w-2.5 h-2.5 text-slate-500" />}
                          <span>{isPassed ? "가결" : isPresent ? "상정" : "발의"}</span>
                        </span>
                      </div>

                      {/* 중앙: 의원명 + 정당 + 상태 + 법안명 */}
                      <div className="truncate space-y-0.5 flex-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <button
                            type="button"
                            onClick={() => handleMemberClick(item.assemb_id)}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            {item.assemb_nm}
                          </button>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                              PARTY_COLORS[item.pltprt_nm] || "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            {item.pltprt_nm}
                          </span>
                          <span
                            className={`text-[11px] font-medium ${
                              isPassed
                                ? "text-emerald-700 font-bold"
                                : isPresent
                                ? "text-amber-700 font-semibold"
                                : "text-slate-500"
                            }`}
                          >
                            {item.status_text}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate" title={item.bill_nm}>
                          {item.bill_nm}
                        </p>
                      </div>
                    </div>

                    {/* 우측: 국회 의안정보시스템 원문 바로가기 링크 */}
                    <a
                      href={`http://likms.assembly.go.kr/bill/billDetail.do?billId=${item.bill_id}&ageFrom=22&ageTo=22`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors shrink-0 cursor-pointer"
                      title="의안 원문 보기"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-xs sm:text-sm text-slate-400 bg-slate-50 rounded-xl">
                선택하신 조건에 해당하는 실시간 입법 안건이 없습니다.
              </div>
            )}
          </div>

          {/* 하단 안내 바 */}
          <div className="shrink-0 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>* 카드 터치 시 의원 상세 성적표 열람</span>
            <span className="font-mono">최신 {currentList.length}건 표시</span>
          </div>

        </div>

      </div>

      {/* 의원 상세 성적표 Drawer */}
      <AssembDetailDrawer
        assemb={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </>
  );
}