"use client";

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
} from "lucide-react";

interface LegislativeLiveRadarProps {
  data: WeeklyRadarStats;
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

export default function LegislativeLiveRadar({ data }: LegislativeLiveRadarProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      {/* 1. 좌측: 금주의 입법 레이더 (Weekly Movers & Activity Summary) */}
      <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
        {/* 배경 은은한 빛 효과 */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-400/30">
                <Zap className="w-4 h-4 animate-pulse text-amber-400" />
              </span>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  최근 입법 레이더
                  <span className="text-[10px] font-normal text-indigo-300 bg-indigo-800/60 px-2 py-0.5 rounded-full border border-indigo-700">
                    {data.period_label}
                  </span>
                </h3>
              </div>
            </div>
            <span className="text-[11px] text-indigo-300/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> 단기 활동 집중도
            </span>
          </div>

          {/* 최근 14일 3대 파이프라인 합계 */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
              <span className="text-[11px] text-slate-400 block mb-0.5">신규 발의</span>
              <strong className="text-base font-black text-indigo-300 font-mono">
                {data.recent_motn_total}
              </strong>
              <span className="text-[10px] text-slate-400 block">건</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
              <span className="text-[11px] text-slate-400 block mb-0.5">상임위 상정</span>
              <strong className="text-base font-black text-amber-300 font-mono">
                {data.recent_present_total}
              </strong>
              <span className="text-[10px] text-slate-400 block">건</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
              <span className="text-[11px] text-slate-400 block mb-0.5">본회의 가결</span>
              <strong className="text-base font-black text-emerald-300 font-mono">
                {data.recent_aprv_total}
              </strong>
              <span className="text-[10px] text-slate-400 block">건</span>
            </div>
          </div>

          {/* 최근 최다 발의 의원 TOP 3 */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-indigo-200 flex items-center justify-between">
              <span>🔥 최근 최다 발의 의원 (Movers)</span>
              <span className="text-[10px] text-indigo-300/70 font-normal">누적 순위 외 단기 페이스</span>
            </span>

            <div className="space-y-1.5">
              {data.top_movers.length > 0 ? (
                data.top_movers.map((mover, idx) => (
                  <div
                    key={mover.assemb_id}
                    className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-center font-bold font-mono text-amber-400 text-xs">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-white">{mover.assemb_nm}</span>
                      <span className="text-[10px] text-slate-300 px-1.5 py-0.2 rounded bg-white/10">
                        {mover.pltprt_nm}
                      </span>
                    </div>
                    <div className="font-mono text-xs">
                      <strong className="text-indigo-300 font-bold">{mover.recent_cnt}</strong>
                      <span className="text-slate-400 text-[11px] ml-0.5">건 발의</span>
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

        <div className="pt-3 mt-3 border-t border-white/10 text-[11px] text-indigo-300/80 flex items-center justify-between">
          <span>* 누적 점수와 무관하게 최근 법안 제출 활동량 집계</span>
          <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
        </div>
      </div>

      {/* 2. 우측: 실시간 입법 파이프라인 타임라인 피드 (Live Feed) */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          {/* 헤더 */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                입법 파이프라인 라이브 피드
              </h3>
              <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
                (발의 · 소관위 상정 · 본회의 처리 실시간 흐름)
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="text-[11px] font-mono text-emerald-600 font-medium">Auto Synced</span>
            </div>
          </div>

          {/* 스크롤 가능한 타임라인 리스트 (높이 약 220px) */}
          <div className="space-y-2.5 max-h-[225px] overflow-y-auto pr-1">
            {data.recent_events.length > 0 ? (
              data.recent_events.map((evt, idx) => {
                const isAprv = evt.action_type === "가결";
                const isPresent = evt.action_type === "상정";

                return (
                  <div
                    key={`${evt.bill_id}-${idx}`}
                    className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-all text-xs"
                  >
                    {/* 날짜 & 액션 뱃지 */}
                    <div className="flex flex-col items-center shrink-0 w-16 pt-0.5">
                      <span className="font-mono text-[10px] text-slate-400 mb-1">
                        {evt.event_date.slice(5)}
                      </span>
                      {isAprv ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" /> 가결
                        </span>
                      ) : isPresent ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Clock className="w-2.5 h-2.5" /> 상정
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <FileText className="w-2.5 h-2.5" /> 발의
                        </span>
                      )}
                    </div>

                    {/* 의원명 & 법안 요약 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-slate-900">{evt.assemb_nm}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                            PARTY_COLORS[evt.pltprt_nm] || "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          {evt.pltprt_nm}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[160px]">
                          {evt.detail_text}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium truncate" title={evt.bill_nm}>
                        {evt.bill_nm}
                      </p>
                    </div>

                    {/* 국회 의안시스템 외부 링크 */}
                    <a
                      href={`http://likms.assembly.go.kr/bill/billDetail.do?billId=${evt.bill_id}&ageFrom=22&ageTo=22`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="국회 의안정보시스템 확인"
                      className="text-slate-300 hover:text-indigo-600 p-1 shrink-0 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                표시할 최신 파이프라인 변동 내역이 없습니다.
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>열린국회정보 Open API 동기화 타임라인</span>
          <span>최신 15건 표시</span>
        </div>
      </div>

    </div>
  );
}