"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { BillRankingRow } from "@/types/ranking";
import { Search, X, Award, ChevronRight } from "lucide-react";

interface MemberSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (member: BillRankingRow) => void;
  allMembers: BillRankingRow[];
  title?: string;
  excludeId?: string;
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

export default function MemberSearchModal({
  isOpen,
  onClose,
  onSelect,
  allMembers,
  title = "비교할 국회의원 검색",
  excludeId,
}: MemberSearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allMembers
      .filter((m) => {
        if (excludeId && m.assemb_id === excludeId) return false;
        if (!q) return true;
        const matchName = m.assemb_nm.toLowerCase().includes(q);
        const matchParty = m.pltprt_nm?.toLowerCase().includes(q) ?? false;
        const matchRegion = m.rgn_nm?.toLowerCase().includes(q) ?? false;
        return matchName || matchParty || matchRegion;
      })
      .slice(0, 15); // 모바일 스크롤 최적화를 위해 상위 15건 우선 표출
  }, [allMembers, query, excludeId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm p-4 flex items-start justify-center pt-16 sm:pt-24 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[75vh]">
        
        {/* 모달 상단 검색바 */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="의원명, 정당, 지역구 검색 (예: 김선교, 마포)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 안내 바 */}
        <div className="px-4 py-2 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between text-[11px] text-indigo-950">
          <span className="font-semibold">{title}</span>
          <span className="text-slate-500 font-mono">
            {query ? `${candidates.length}명 검색됨` : `추천 목록`}
          </span>
        </div>

        {/* 의원 리스트 영역 */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-100">
          {candidates.length > 0 ? (
            candidates.map((m) => (
              <div
                key={m.assemb_id}
                onClick={() => {
                  onSelect(m);
                  onClose();
                }}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/60 active:bg-indigo-100/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-6 text-center font-mono font-bold text-xs text-slate-400 group-hover:text-indigo-600">
                    {m.rnkg ?? "-"}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <strong className="text-sm font-bold text-slate-900 group-hover:text-indigo-700">
                        {m.assemb_nm}
                      </strong>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                          PARTY_COLORS[m.pltprt_nm] || "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {m.pltprt_nm}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                      {m.rgn_nm || "비례대표"} · {m.cmit_nm || "상임위 미배정"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-right pl-2">
                  <div>
                    <span className="text-xs font-black text-indigo-600 block">
                      {m.score ? `${Number(m.score).toFixed(1)}점` : "유예"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      발의 {m.ttl_motn_cnt}건
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              일치하는 국회의원이 없습니다.
            </div>
          )}
        </div>

        {/* 닫기 버튼 */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}