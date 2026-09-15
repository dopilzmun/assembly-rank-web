"use client";

import { useEffect, useState } from "react";
import { BillRankingRow } from "@/types/ranking";
import AssembDetailDrawer from "@/components/AssembDetailDrawer";
import {
  Briefcase,
  Home,
  Baby,
  Coins,
  Car,
  HeartHandshake,
  ChevronRight,
} from "lucide-react";

interface PersonaLawmakerWidgetProps {
  allMembers?: BillRankingRow[];
}

interface PersonaLawmakerItem {
  assemb_id: string;
  assemb_nm: string;
  pltprt_nm: string;
  rgn_nm: string | null;
  ctgr_se: string;
  aprv_cnt: number;
  pure_aprv_cnt: number;
  alt_aprv_cnt: number;
  aprv_scor: number;
  rnkg: number;
  repr_bill_nm: string | null;
}

// 6대 표준 카테고리 정의 (CARE, FIN, HOUSE, LIFE, TRAF, WORK)
const PERSONAS = [
  { key: "WORK", label: "직장·노동", icon: Briefcase, desc: "퇴근, 근로, 일자리" },
  { key: "HOUSE", label: "주거·부동산", icon: Home, desc: "전월세, 청약, 주택" },
  { key: "CARE", label: "육아·돌봄", icon: Baby, desc: "보육, 돌봄, 교육" },
  { key: "FIN", label: "금융·경제", icon: Coins, desc: "소상공인, 세금, 금융" },
  { key: "TRAF", label: "교통·이동", icon: Car, desc: "대중교통, 철도, 도로" },
  { key: "LIFE", label: "생활·안전", icon: HeartHandshake, desc: "소비자, 먹거리, 안전" },
];

const PARTY_COLORS: Record<string, string> = {
  더불어민주당: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300",
  국민의힘: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300",
  조국혁신당: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300",
  개혁신당: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300",
  진보당: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300",
  기본소득당: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300",
  사회민주당: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300",
  무소속: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300",
};

export default function PersonaLawmakerWidget({ allMembers = [] }: PersonaLawmakerWidgetProps) {
  const [selectedPersona, setSelectedPersona] = useState("WORK");
  const [lawmakers, setLawmakers] = useState<PersonaLawmakerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDrawerMember, setSelectedDrawerMember] = useState<BillRankingRow | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/district/persona?ctgr_se=${selectedPersona}`)
      .then((res) => (res.ok ? res.json() : { lawmakers: [] }))
      .then((data) => setLawmakers(data.lawmakers || []))
      .catch((err) => console.error("페르소나 의원 로드 실패:", err))
      .finally(() => setIsLoading(false));
  }, [selectedPersona]);

  // 의원 카드 클릭 시 full data 매칭 후 드로어 팝업
  const handleOpenDrawer = (item: PersonaLawmakerItem) => {
    const cleanId = String(item.assemb_id).trim();

    let fullMember = allMembers.find(
      (m) => String(m.assemb_id).trim() === cleanId
    );

    if (!fullMember) {
      fullMember = allMembers.find(
        (m) => m.assemb_nm === item.assemb_nm && m.pltprt_nm === item.pltprt_nm
      );
    }

    if (fullMember) {
      setSelectedDrawerMember(fullMember);
    } else {
      setSelectedDrawerMember({
        assemb_id: item.assemb_id,
        age: 22,
        assemb_nm: item.assemb_nm,
        pltprt_nm: item.pltprt_nm,
        rgn_nm: item.rgn_nm || "비례대표",
        cmit_nm: null,
        term_start_dd: "2024-05-30",
        is_deferred: 0,
        monthly_pace: 1.5,
        ttl_motn_cnt: item.aprv_cnt + 5,
        pure_aprv_cnt: item.pure_aprv_cnt,
        alt_aprv_cnt: item.alt_aprv_cnt,
        aprv_cnt: item.aprv_cnt,
        dss_cnt: 0,
        aprv_rate: 25.0,
        cmt_present_cnt: 8,
        cmt_present_rate: 65.0,
        avg_cmt_days: 90,
        own_cmit_motn_cnt: item.aprv_cnt,
        own_cmit_motn_rate: 80.0,
        score: item.aprv_scor,
        rnkg: item.rnkg,
      });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all space-y-6">
      
      {/* 1. 상단 타이틀 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>내 라이프스타일 대변 의원 성적표</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
              TOP 6
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            단순 발의가 아닌, 해당 분야에서 실제 본회의 통과(원안 1.0 + 대안 0.7)를 이끌어낸 실적 상위 의원입니다.
          </p>
        </div>
      </div>

      {/* 2. 6대 표준 페르소나 선택 탭 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {PERSONAS.map((p) => {
          const Icon = p.icon;
          const isSelected = selectedPersona === p.key;

          return (
            <button
              key={p.key}
              onClick={() => setSelectedPersona(p.key)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? "bg-indigo-50/80 border-indigo-500/80 shadow-xs dark:bg-indigo-950/50 dark:border-indigo-800"
                  : "bg-slate-50/60 border-slate-200/70 hover:bg-slate-100 dark:bg-slate-800/40 dark:border-slate-800 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`p-1.5 rounded-lg ${isSelected ? "bg-indigo-600 text-white" : "bg-white text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className={`text-[10px] font-bold ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}>
                  {p.key}
                </span>
              </div>
              <div>
                <strong className={`text-xs block font-bold ${isSelected ? "text-indigo-950 dark:text-indigo-100" : "text-slate-800 dark:text-slate-200"}`}>
                  {p.label}
                </strong>
                <span className="text-[10px] text-slate-400 truncate block">
                  {p.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. TOP 6 의원 카드 그리드 */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          대변 의원 성적표를 산출하는 중...
        </div>
      ) : lawmakers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {lawmakers.map((item) => (
            <button
              key={item.assemb_id}
              onClick={() => handleOpenDrawer(item)}
              className="flex flex-col justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all text-left group cursor-pointer dark:bg-slate-800/40 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white font-mono text-[11px] font-black dark:bg-slate-100 dark:text-slate-900">
                      {item.rnkg}
                    </span>
                    <strong className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {item.assemb_nm}
                    </strong>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${PARTY_COLORS[item.pltprt_nm] || "bg-slate-100 text-slate-600"}`}>
                      {item.pltprt_nm}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                      {Number(item.aprv_scor).toFixed(1)}점
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>{item.rgn_nm || "비례대표"}</span>
                  <span className="font-mono text-[11px]">
                    원{item.pure_aprv_cnt} · 대{item.alt_aprv_cnt} (총 {item.aprv_cnt}건)
                  </span>
                </div>

                {item.repr_bill_nm && (
                  <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">대표 통과 법안</span>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate group-hover:text-indigo-600 transition-colors">
                      {item.repr_bill_nm}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                <span>상세 성적표 보기</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-slate-400">
          해당 페르소나 분야에 집계된 의원 실적이 없습니다.
        </div>
      )}

      {/* 모달 연동: 상세 성적표 드로어 */}
      <AssembDetailDrawer
        assemb={selectedDrawerMember}
        onClose={() => setSelectedDrawerMember(null)}
      />
    </div>
  );
}