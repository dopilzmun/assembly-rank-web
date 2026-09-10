"use client";

import { useState, useEffect } from "react";
import { BillRankingRow } from "@/types/ranking";
import { MapPin, ArrowRight, Settings2 } from "lucide-react";

interface MyDistrictWidgetProps {
  allMembers: BillRankingRow[];
  onSelectMember?: (member: BillRankingRow) => void;
}

export default function MyDistrictWidget({ allMembers, onSelectMember }: MyDistrictWidgetProps) {
  const [district, setDistrict] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900">
              우리 동네 국회의원 의정활동
            </h3>
            <span className="text-[11px] text-slate-400">
              {district ? `선택 지역: ${district}` : "내 지역구 설정"}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsEditing((prev) => !prev)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>{district ? "지역 변경" : "동네 등록"}</span>
        </button>
      </div>

      {/* 지역구 입력창 */}
      {(isEditing || !district) && (
        <form onSubmit={handleSave} className="flex gap-2">
          <input
            type="text"
            placeholder="거주지 지역구 입력 (예: 종로, 분당, 해운대, 전주)"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            저장
          </button>
        </form>
      )}

      {/* 매칭된 의원 목록 */}
      {district && (
        <div className="space-y-2">
          {matchedMembers.length > 0 ? (
            matchedMembers.map((m) => (
              <div
                key={m.assemb_id}
                onClick={() => onSelectMember?.(m)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-5 text-center font-mono font-bold text-indigo-600">
                    {m.rnkg ? `${m.rnkg}위` : "-"}
                  </span>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                        {m.assemb_nm}
                      </strong>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-white border border-slate-200 text-slate-600">
                        {m.pltprt_nm}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {m.rgn_nm} · {m.cmit_nm || "상임위 미배정"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-right">
                  <div>
                    <span className="text-xs font-black text-indigo-700 block">
                      {m.score ? `${Number(m.score).toFixed(1)}점` : "유예"}
                    </span>
                    <span className="text-[10px] text-emerald-700 block">
                      실질가결 {m.aprv_cnt}건
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              '{district}'에 매칭되는 지역구 의원이 없습니다. 지역명을 확인해주세요 (예: 수원, 마포).
            </div>
          )}
        </div>
      )}
    </div>
  );
}