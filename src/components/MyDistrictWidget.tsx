"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BillRankingRow } from "@/types/ranking";
import AssembDetailDrawer from "@/components/AssembDetailDrawer";
import { MapPin, Settings2, ChevronRight, ArrowRight } from "lucide-react";

interface MyDistrictWidgetProps {
  allMembers: BillRankingRow[];
  onSelectMember?: (member: BillRankingRow) => void;
}

export default function MyDistrictWidget({ allMembers, onSelectMember }: MyDistrictWidgetProps) {
  const [district, setDistrict] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [selectedMember, setSelectedMember] = useState<BillRankingRow | null>(null);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("my_district");
    if (saved) {
      setDistrict(saved);
      setInputVal(saved);
    }
  }, []);

  const matchedMembers = district
    ? allMembers.filter((m) => m.rgn_nm && m.rgn_nm.includes(district))
    : [];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const clean = inputVal.trim();
    setDistrict(clean);
    localStorage.setItem("my_district", clean);
    setIsEditing(false);
  };

  const handleMemberClick = (member: BillRankingRow) => {
    if (onSelectMember) {
      onSelectMember(member);
    } else {
      setSelectedMember(member);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between space-y-4 h-full">
        
        {/* 1. 헤더 (고정) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                우리 동네 국회의원 의정활동
              </h3>
              <span className="text-xs text-slate-400">
                {district ? `등록 지역: ${district}` : "내 지역구 등록하기"}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsEditing((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <Settings2 className="w-4 h-4" />
            <span>{district ? "지역 변경" : "동네 등록"}</span>
          </button>
        </div>

        {/* 2. 본문 영역 (flex-1 중앙 배치로 좌측 높이에 맞춰 자동 확장) */}
        <div className="flex-1 flex flex-col justify-center space-y-2.5">
          {/* 지역구 입력 폼 */}
          {(isEditing || !district) ? (
            <form onSubmit={handleSave} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="거주지 지역구 입력 (예: 종로, 분당, 해운대, 전주)"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  저장
                </button>
              </div>
              <p className="text-xs text-slate-400 pl-1">
                * 구·군 단위 또는 행정구역명을 입력하시면 지역구 의원을 즉시 찾아드립니다.
              </p>
            </form>
          ) : (
            /* 매칭된 의원 목록 */
            <div className="space-y-2.5">
              {matchedMembers.length > 0 ? (
                matchedMembers.map((m) => (
                  <div
                    key={m.assemb_id}
                    onClick={() => handleMemberClick(m)}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/90 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-7 text-center font-mono font-bold text-indigo-600 text-sm shrink-0">
                        {m.rnkg ? `${m.rnkg}위` : "-"}
                      </span>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {m.assemb_nm}
                          </strong>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white border border-slate-200 text-slate-700">
                            {m.pltprt_nm}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 block truncate mt-0.5 max-w-[200px] sm:max-w-[260px]">
                          {m.rgn_nm} · {m.cmit_nm || "상임위 미배정"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono text-right pl-2">
                      <div>
                        <span className="text-sm font-black text-indigo-700 block">
                          {m.score ? `${Number(m.score).toFixed(1)}점` : "유예"}
                        </span>
                        <span className="text-xs text-emerald-700 font-bold block">
                          실질가결 {m.aprv_cnt}건
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs sm:text-sm text-slate-400 bg-slate-50 rounded-xl">
                  '{district}'에 매칭되는 지역구 의원이 없습니다. 지역명을 확인해주세요 (예: 마포, 해운대, 수원).
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. 하단 안내선 (좌측 투표 안내선과 동일한 Baseline 수평 정렬) */}
        <div className="shrink-0 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>* 의원 카드를 터치하면 상세 성적표가 열립니다.</span>
          <Link
            href="/rankings"
            className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <span>전체 순위</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>

      {/* 홈 화면 의원 성적표 Drawer */}
      <AssembDetailDrawer
        assemb={selectedMember}
        onClose={() => setSelectedMember(null)}
        onOpenCompareWith={(m) => {
          setSelectedMember(null);
          router.push(`/rankings?member=${m.assemb_id}`);
        }}
      />
    </>
  );
}