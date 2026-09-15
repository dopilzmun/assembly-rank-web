"use client";

import { useEffect, useState } from "react";
import { BillRankingRow } from "@/types/ranking";
import AssembDetailDrawer from "@/components/AssembDetailDrawer";
import { ThumbsUp, AlertTriangle, ChevronRight, Award, Flame } from "lucide-react";

interface StampSummaryItem {
  assemb_id: string;
  count: number;
}

interface CitizenReactionWidgetProps {
  allMembers: BillRankingRow[];
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

export default function CitizenReactionWidget({ allMembers }: CitizenReactionWidgetProps) {
  const [positiveList, setPositiveList] = useState<StampSummaryItem[]>([]);
  const [criticalList, setCriticalList] = useState<StampSummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<BillRankingRow | null>(null);

  useEffect(() => {
    fetch("/api/stamps/weekly-summary")
      .then((res) => (res.ok ? res.json() : { positive: [], critical: [] }))
      .then((data) => {
        setPositiveList(data.positive || []);
        setCriticalList(data.critical || []);
      })
      .catch((err) => console.error("스탬프 요약 로드 실패:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const getMemberData = (assembId: string) => {
    return allMembers.find((m) => m.assemb_id === assembId);
  };

  const hasData = positiveList.length > 0 || criticalList.length > 0;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900">
          최근 7일간의 시민 감정 스탬프를 분석하는 중입니다...
        </div>
      ) : !hasData ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900 space-y-2">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            최근 7일간 집계된 시민 스탬프가 아직 없습니다.
          </p>
          <p className="text-xs text-slate-400">
            국회의원 상세 성적표에서 칭찬해요, 응원해요, 지켜봐요, 분발해요 스탬프를 눌러 첫 번째 민심을 전해보세요!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* A. 칭찬 & 응원 레이더 (Positive TOP 3) */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 dark:border-emerald-950/60 dark:bg-emerald-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                  <ThumbsUp className="h-4 w-4" />
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  이번 주 칭찬 & 응원 TOP 3
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                최근 7일 누적
              </span>
            </div>

            <div className="space-y-2.5">
              {positiveList.map((item, idx) => {
                const member = getMemberData(item.assemb_id);
                if (!member) return null;

                return (
                  <button
                    key={item.assemb_id}
                    onClick={() => setSelectedMember(member)}
                    className="flex w-full items-center justify-between rounded-xl border border-white bg-white/90 p-3.5 text-left shadow-xs transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                            {member.assemb_nm}
                          </strong>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${PARTY_COLORS[member.pltprt_nm] || "bg-slate-100 text-slate-600"}`}>
                            {member.pltprt_nm}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {member.rgn_nm || "비례대표"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Flame className="h-4 w-4" />
                      <span>{item.count}표</span>
                      <ChevronRight className="h-4 w-4 text-slate-400 ml-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* B. 주목 & 분발 레이더 (Critical TOP 3) */}
          <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5 dark:border-rose-950/60 dark:bg-rose-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  이번 주 감시 & 분발 TOP 3
                </h3>
              </div>
              <span className="text-[11px] font-mono text-rose-700 dark:text-rose-400 font-bold">
                최근 7일 누적
              </span>
            </div>

            <div className="space-y-2.5">
              {criticalList.map((item, idx) => {
                const member = getMemberData(item.assemb_id);
                if (!member) return null;

                return (
                  <button
                    key={item.assemb_id}
                    onClick={() => setSelectedMember(member)}
                    className="flex w-full items-center justify-between rounded-xl border border-white bg-white/90 p-3.5 text-left shadow-xs transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-black text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-mono">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                            {member.assemb_nm}
                          </strong>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${PARTY_COLORS[member.pltprt_nm] || "bg-slate-100 text-slate-600"}`}>
                            {member.pltprt_nm}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {member.rgn_nm || "비례대표"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                      <span>{item.count}표</span>
                      <ChevronRight className="h-4 w-4 text-slate-400 ml-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 모달 연동: 카드 클릭 시 의정활동 상세 드로어 열림 */}
      <AssembDetailDrawer
        assemb={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}