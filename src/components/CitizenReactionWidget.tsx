"use client";

import { useState, useEffect } from "react";
import { BillRankingRow } from "@/types/ranking";
import AssembDetailDrawer from "@/components/AssembDetailDrawer";
import { Sparkles, HeartHandshake, Eye, ChevronRight } from "lucide-react";

interface CitizenReactionWidgetProps {
  allMembers: BillRankingRow[];
}

interface StampLeader {
  assemb_id: string;
  assemb_nm: string;
  pltprt_nm: string;
  stamp_cnt: number;
}

export default function CitizenReactionWidget({ allMembers }: CitizenReactionWidgetProps) {
  const [praised, setPraised] = useState<StampLeader[]>([]);
  const [watched, setWatched] = useState<StampLeader[]>([]);
  const [selectedMember, setSelectedMember] = useState<BillRankingRow | null>(null);

  useEffect(() => {
    fetch("/api/stamps/weekly-summary")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setPraised(data.topPraised || []);
          setWatched(data.topWatched || []);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleMemberClick = (assembId: string) => {
    const found = allMembers.find((m) => m.assemb_id === assembId);
    if (found) setSelectedMember(found);
  };

  // 집계 데이터가 아직 없을 때도 안내 메시지 표시
  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                주간 시민 반응 레이더
              </h3>
              <span className="text-xs text-slate-400">
                의원 성적표 스탬프로 전하는 최근 7일간 시민 여론
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">최근 7일 집계</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 👏 응원·칭찬 TOP 3 */}
          <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              <span>유권자 응원·칭찬 집중 의원</span>
            </div>

            {praised.length > 0 ? (
              <div className="space-y-1.5">
                {praised.map((m, idx) => (
                  <div
                    key={m.assemb_id}
                    onClick={() => handleMemberClick(m.assemb_id)}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-emerald-200/60 hover:border-emerald-400 transition-all cursor-pointer group text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-black text-emerald-700 w-4 text-center">
                        {idx + 1}
                      </span>
                      <strong className="text-slate-900 font-bold group-hover:text-emerald-700 transition-colors">
                        {m.assemb_nm}
                      </strong>
                      <span className="text-[11px] text-slate-500 px-1.5 py-0.2 rounded bg-slate-50 border border-slate-200">
                        {m.pltprt_nm}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-mono shrink-0">
                      <span className="font-bold text-emerald-700">+{m.stamp_cnt}표</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 bg-white/60 rounded-lg">
                아직 주간 응원 스탬프가 없습니다. 의원 성적표에서 첫 스탬프를 남겨보세요!
              </div>
            )}
          </div>

          {/* 🔍 집중 감시·분발 TOP 3 */}
          <div className="bg-rose-50/50 rounded-xl p-3.5 border border-rose-100 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
              <Eye className="w-4 h-4 text-rose-600" />
              <span>시민 집중 감시·분발 촉구 의원</span>
            </div>

            {watched.length > 0 ? (
              <div className="space-y-1.5">
                {watched.map((m, idx) => (
                  <div
                    key={m.assemb_id}
                    onClick={() => handleMemberClick(m.assemb_id)}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-rose-200/60 hover:border-rose-400 transition-all cursor-pointer group text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-black text-rose-700 w-4 text-center">
                        {idx + 1}
                      </span>
                      <strong className="text-slate-900 font-bold group-hover:text-rose-700 transition-colors">
                        {m.assemb_nm}
                      </strong>
                      <span className="text-[11px] text-slate-500 px-1.5 py-0.2 rounded bg-slate-50 border border-slate-200">
                        {m.pltprt_nm}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-mono shrink-0">
                      <span className="font-bold text-rose-700">{m.stamp_cnt}표</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 bg-white/60 rounded-lg">
                아직 주간 감시 스탬프가 없습니다. 의원 성적표에서 입법 감시를 시작해보세요!
              </div>
            )}
          </div>
        </div>
      </div>

      <AssembDetailDrawer
        assemb={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </>
  );
}