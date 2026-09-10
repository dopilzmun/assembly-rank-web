"use client";

import { useState, useMemo, useEffect } from "react";
import { BillRankingRow } from "@/types/ranking";
import { WeeklyRadarStats } from "@/types/activity";
import AssembDetailDrawer from "@/components/AssembDetailDrawer";
import CompareModal from "@/components/CompareModal";
import LegislativeLiveRadar from "@/components/LegislativeLiveRadar";
import MemberSearchModal from "@/components/MemberSearchModal";
import {
  Search,
  RotateCcw,
  Clock,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Award,
  Info,
  Swords,
  X,
  UserPlus,
} from "lucide-react";

interface RankingDashboardProps {
  initialData: BillRankingRow[];
  weeklyRadar?: WeeklyRadarStats;
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

type SortField =
  | "rnkg"
  | "score"
  | "assemb_nm"
  | "ttl_motn_cnt"
  | "monthly_pace"
  | "own_cmit_motn_rate"
  | "cmt_present_rate"
  | "avg_cmt_days"
  | "aprv_cnt"
  | "pure_aprv_cnt"
  | "alt_aprv_cnt"
  | "aprv_rate";

type SortDirection = "asc" | "desc";

function getLegislativeTag(row: BillRankingRow) {
  if (row.is_deferred === 1) {
    return {
      label: "유예",
      style: "bg-slate-100 text-slate-600 border-slate-300",
      tooltip: "임기 개시 후 100일 미만 의원으로, 종합 순위 산정이 유예됩니다.",
      isSpecial: true,
    };
  }

  const motnCnt = Number(row.ttl_motn_cnt) || 0;
  if (motnCnt === 0) {
    return {
      label: "특수",
      style: "bg-slate-100 text-slate-700 border-slate-200",
      tooltip: "의장단, 정당 지도부, 장관 겸직 등의 사유로 개별 발의가 없는 경우입니다.",
      isSpecial: true,
    };
  }
  return null;
}

export default function RankingDashboard({ initialData, weeklyRadar }: RankingDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParty, setSelectedParty] = useState("ALL");
  const [selectedCmit, setSelectedCmit] = useState("ALL");
  const [minBills, setMinBills] = useState<number>(0);

  const [sortField, setSortField] = useState<SortField>("rnkg");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedAssemb, setSelectedAssemb] = useState<BillRankingRow | null>(null);

  const [compareList, setCompareList] = useState<BillRankingRow[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const memberId = params.get("member");
    if (memberId) {
      const target = initialData.find((m) => m.assemb_id === memberId);
      if (target) setSelectedAssemb(target);
    }
    const q = params.get("q");
    if (q) {
      setSearchQuery(q);
    }
  }, [initialData]);

  const handleSelectAssemb = (row: BillRankingRow | null) => {
    setSelectedAssemb(row);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (row) {
        url.searchParams.set("member", row.assemb_id);
      } else {
        url.searchParams.delete("member");
      }
      window.history.replaceState({}, "", url.toString());
    }
  };

  const partyList = useMemo(() => {
    const set = new Set(initialData.map((d) => d.pltprt_nm).filter(Boolean));
    return Array.from(set);
  }, [initialData]);

  const committeeList = useMemo(() => {
    const cmitSet = new Set<string>();
    initialData.forEach((d) => {
      if (!d.cmit_nm) return;
      d.cmit_nm.split(",").forEach((c) => {
        const trimmed = c.trim();
        if (trimmed) cmitSet.add(trimmed);
      });
    });
    return Array.from(cmitSet).sort((a, b) => a.localeCompare(b, "ko"));
  }, [initialData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      if (field === "rnkg" || field === "assemb_nm" || field === "avg_cmt_days") {
        setSortDirection("asc");
      } else {
        setSortDirection("desc");
      }
    }
  };

  const toggleCompare = (member: BillRankingRow, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCompareList((prev) => {
      const exists = prev.some((m) => m.assemb_id === member.assemb_id);
      if (exists) {
        return prev.filter((m) => m.assemb_id !== member.assemb_id);
      }
      if (prev.length >= 2) {
        return [prev[1], member];
      }
      return [...prev, member];
    });
  };

  const filteredData = useMemo(() => {
    return initialData.filter((row) => {
      const motnCnt = Number(row.ttl_motn_cnt) || 0;
      if (motnCnt < minBills) return false;
      if (selectedParty !== "ALL" && row.pltprt_nm !== selectedParty) return false;
      if (selectedCmit !== "ALL") {
        if (!row.cmit_nm || !row.cmit_nm.includes(selectedCmit)) return false;
      }
      if (searchQuery.trim() !== "") {
        const query = searchQuery.trim().toLowerCase();
        const matchName = row.assemb_nm.toLowerCase().includes(query);
        const matchRegion = row.rgn_nm?.toLowerCase().includes(query) ?? false;
        const matchCmit = row.cmit_nm?.toLowerCase().includes(query) ?? false;
        if (!matchName && !matchRegion && !matchCmit) return false;
      }
      return true;
    });
  }, [initialData, minBills, selectedParty, selectedCmit, searchQuery]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (sortField === "rnkg" || sortField === "score") {
        if (a.is_deferred === 1 && b.is_deferred === 0) return 1;
        if (a.is_deferred === 0 && b.is_deferred === 1) return -1;
      }

      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal, "ko")
          : bVal.localeCompare(aVal, "ko");
      }

      if (sortField === "avg_cmt_days") {
        const aDays = Number(aVal) || 0;
        const bDays = Number(bVal) || 0;
        if (sortDirection === "asc") {
          if (aDays === 0 && bDays > 0) return 1;
          if (bDays === 0 && aDays > 0) return -1;
          return aDays - bDays;
        } else {
          return bDays - aDays;
        }
      }

      const aNum = aVal !== null && aVal !== undefined ? Number(aVal) : -99999;
      const bNum = bVal !== null && bVal !== undefined ? Number(bVal) : -99999;
      return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
    });
  }, [filteredData, sortField, sortDirection]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedParty("ALL");
    setSelectedCmit("ALL");
    setMinBills(0);
    setSortField("rnkg");
    setSortDirection("asc");
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600 font-bold shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600 font-bold shrink-0" />
    );
  };

  const isFilterActive =
    searchQuery || selectedParty !== "ALL" || selectedCmit !== "ALL" || minBills > 0;

  return (
    <div className="space-y-6">
      {weeklyRadar && (
        <LegislativeLiveRadar
          data={weeklyRadar}
          onSelectAssemb={(id) => {
            const target = initialData.find((m) => m.assemb_id === id);
            if (target) handleSelectAssemb(target);
          }}
        />
      )}

      {/* 1. 검색 및 필터 컨트롤 패널 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="의원명, 지역구, 상임위 검색 (예: 종로, 교육위, 김선교)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">전체 정당 ({initialData.length}명)</option>
              {partyList.map((party) => (
                <option key={party} value={party}>
                  {party}
                </option>
              ))}
            </select>

            <select
              value={selectedCmit}
              onChange={(e) => setSelectedCmit(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 max-w-[200px]"
            >
              <option value="ALL">전체 상임위</option>
              {committeeList.map((cmit) => (
                <option key={cmit} value={cmit}>
                  {cmit}
                </option>
              ))}
            </select>

            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                초기화
              </button>
            )}
          </div>
        </div>

        {/* 발의 건수 허들 및 모바일 정렬 옵션 */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-500">최소 발의:</span>
            {[
              { label: "전체", value: 0 },
              { label: "5건+", value: 5 },
              { label: "10건+", value: 10 },
              { label: "20건+", value: 20 },
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setMinBills(btn.value)}
                className={`px-3 py-1.5 rounded-full font-semibold text-xs transition-all cursor-pointer ${
                  minBills === btn.value
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 md:hidden ml-auto">
            <span className="text-slate-500 text-xs font-semibold">정렬:</span>
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split("-") as [SortField, SortDirection];
                setSortField(f);
                setSortDirection(d);
              }}
              className="text-xs bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700"
            >
              <option value="rnkg-asc">순위순</option>
              <option value="score-desc">종합점수순</option>
              <option value="ttl_motn_cnt-desc">대표발의순</option>
              <option value="aprv_cnt-desc">실질가결순</option>
              <option value="cmt_present_rate-desc">상정률순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 종합점수 안내 배너 */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 text-xs sm:text-sm text-indigo-950 flex flex-wrap gap-x-4 gap-y-1.5 items-center">
        <span className="font-bold flex items-center gap-1.5 text-indigo-700">
          <Award className="w-4 h-4 text-indigo-600 shrink-0" /> 종합 점수 (100점):
        </span>
        <span className="leading-relaxed">
          <strong>실질가결(45점)</strong> [원안 100% + 대안반영 70%] + <strong>심사 추진력(35점)</strong> + <strong>입법 규모(20점)</strong>
        </span>
      </div>

      {/* 결과 수치 카운터 */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 px-1">
        <div>
          조회 결과: <strong className="text-slate-900 font-bold">{sortedData.length}</strong>명 / 전체 {initialData.length}명
        </div>
        <span className="text-slate-400 text-xs hidden sm:inline">
          * 의원 행을 클릭하면 상세 성적표가 열립니다.
        </span>
      </div>

      {/* 2. [모바일 전용] 시원한 3대 지표 카드 뷰 */}
      <div className="block md:hidden space-y-3">
        {sortedData.length > 0 ? (
          sortedData.map((row) => {
            const tag = getLegislativeTag(row);
            const isDeferred = row.is_deferred === 1;
            const isSelectedForCompare = compareList.some((m) => m.assemb_id === row.assemb_id);
            const pureCnt = Number(row.pure_aprv_cnt) || 0;
            const altCnt = Number(row.alt_aprv_cnt) || 0;
            const motnCnt = Number(row.ttl_motn_cnt) || 0;

            return (
              <div
                key={row.assemb_id}
                onClick={() => handleSelectAssemb(row)}
                className={`bg-white rounded-2xl border p-4 shadow-sm transition-all active:scale-[0.99] cursor-pointer space-y-3 ${
                  isSelectedForCompare
                    ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* 1열: 순위, 이름, 정당, 점수 및 VS 버튼 */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 truncate">
                    {isDeferred ? (
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-500 shrink-0">
                        유예
                      </span>
                    ) : row.rnkg && row.rnkg <= 3 ? (
                      <span className="w-6 h-6 flex items-center justify-center bg-indigo-600 text-white rounded-full font-black text-xs shrink-0 shadow-xs">
                        {row.rnkg}
                      </span>
                    ) : (
                      <span className="text-sm font-bold font-mono text-slate-500 min-w-[20px] text-center shrink-0">
                        {row.rnkg ?? "-"}
                      </span>
                    )}

                    <strong className="font-bold text-slate-900 text-base whitespace-nowrap">
                      {row.assemb_nm}
                    </strong>

                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-bold border whitespace-nowrap ${
                        PARTY_COLORS[row.pltprt_nm] || "bg-gray-50 text-gray-700 border-gray-200"
                      }`}
                    >
                      {row.pltprt_nm}
                    </span>

                    {tag && (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border whitespace-nowrap ${tag.style}`}>
                        {tag.label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className="font-mono text-sm font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                      {isDeferred || row.score === null ? "유예" : `${Number(row.score).toFixed(1)}점`}
                    </span>

                    <button
                      onClick={(e) => toggleCompare(row, e)}
                      title="1:1 맞비교 추가"
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all flex items-center justify-center shrink-0 ${
                        isSelectedForCompare
                          ? "bg-indigo-600 text-white shadow"
                          : "bg-slate-100 text-slate-400 hover:bg-indigo-100 hover:text-indigo-700"
                      }`}
                    >
                      VS
                    </button>
                  </div>
                </div>

                {/* 2열: 소속 상임위 및 지역구 */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-0.5">
                  <span className="truncate max-w-[65%]">{row.cmit_nm || "상임위 미배정"}</span>
                  <span className="shrink-0 text-slate-400">{row.rgn_nm || "비례대표"}</span>
                </div>

                {/* 3열: 3대 핵심 지표 그리드 */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50/90 rounded-xl p-2.5 text-center font-mono">
                  <div className="p-1">
                    <span className="text-xs text-slate-500 font-sans block mb-0.5 font-medium">대표발의</span>
                    <strong className="text-sm sm:text-base font-bold text-slate-900 block">
                      {motnCnt}건
                    </strong>
                    <span className="text-xs text-slate-400 block">
                      월 {Number(row.monthly_pace || 0).toFixed(1)}건
                    </span>
                  </div>

                  <div className="p-1 border-x border-slate-200/70">
                    <span className="text-xs text-slate-500 font-sans block mb-0.5 font-medium">상임위상정</span>
                    <strong className="text-sm sm:text-base font-bold text-indigo-700 block">
                      {Number(row.cmt_present_rate) || 0}%
                    </strong>
                    <span className="text-xs text-slate-400 block">
                      {Number(row.avg_cmt_days) > 0 ? `평균 ${Number(row.avg_cmt_days)}일` : "-"}
                    </span>
                  </div>

                  <div className="p-1">
                    <span className="text-xs text-emerald-700 font-sans block mb-0.5 font-bold">실질가결</span>
                    <strong className="text-sm sm:text-base font-bold text-emerald-600 block">
                      {Number(row.aprv_cnt) || 0}건
                    </strong>
                    <span className="text-xs text-slate-500 font-sans block">
                      원{pureCnt} · 대{altCnt}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-400">
            조건에 일치하는 국회의원이 없습니다.
          </div>
        )}
      </div>

      {/* 3. [PC 전용] 가로 스크롤 없는 반응형 맞춤 테이블 (Zero Horizontal Scroll) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600 table-auto">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold text-xs tracking-wider border-b border-slate-200 select-none whitespace-nowrap">
            <tr>
              <th className="py-3 px-2 text-center w-10">비교</th>
              
              <th
                onClick={() => handleSort("rnkg")}
                className="py-3 px-2 text-center w-12 cursor-pointer hover:bg-slate-200/70 transition-colors group"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>순위</span>
                  {renderSortIcon("rnkg")}
                </div>
              </th>

              <th
                onClick={() => handleSort("score")}
                className="py-3 px-2 text-right w-20 cursor-pointer hover:bg-slate-200/70 transition-colors group"
              >
                <div className="flex items-center justify-end gap-1 text-indigo-700">
                  <span>종합점수</span>
                  {renderSortIcon("score")}
                </div>
              </th>

              <th
                onClick={() => handleSort("assemb_nm")}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/70 transition-colors group"
              >
                <div className="flex items-center gap-1">
                  <span>의원명</span>
                  {renderSortIcon("assemb_nm")}
                </div>
              </th>

              <th className="py-3 px-2 text-center w-20">정당</th>
              <th className="py-3 px-2 w-24 lg:w-28">지역구</th>

              <th
                onClick={() => handleSort("ttl_motn_cnt")}
                className="py-3 px-2 text-right cursor-pointer hover:bg-slate-200/70 transition-colors group w-20 lg:w-24"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>대표발의</span>
                  {renderSortIcon("ttl_motn_cnt")}
                </div>
              </th>

              {/* 1280px(xl) 이상 화면에서만 표시되어 중간 노트북 스크롤 방지 */}
              <th
                onClick={() => handleSort("own_cmit_motn_rate")}
                className="hidden xl:table-cell py-3 px-2 text-right cursor-pointer hover:bg-slate-200/70 transition-colors group w-20"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>소속위집중</span>
                  {renderSortIcon("own_cmit_motn_rate")}
                </div>
              </th>

              <th
                onClick={() => handleSort("cmt_present_rate")}
                className="py-3 px-2 text-right cursor-pointer hover:bg-slate-200/70 transition-colors group w-18 lg:w-20"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>상정률</span>
                  {renderSortIcon("cmt_present_rate")}
                </div>
              </th>

              {/* 1280px(xl) 이상 화면에서만 표시되어 중간 노트북 스크롤 방지 */}
              <th
                onClick={() => handleSort("avg_cmt_days")}
                className="hidden xl:table-cell py-3 px-2 text-right cursor-pointer hover:bg-slate-200/70 transition-colors group w-20"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>심사소요</span>
                  {renderSortIcon("avg_cmt_days")}
                </div>
              </th>

              <th
                onClick={() => handleSort("aprv_cnt")}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/70 transition-colors group w-24 lg:w-28"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>실질가결</span>
                  {renderSortIcon("aprv_cnt")}
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sortedData.length > 0 ? (
              sortedData.map((row) => {
                const tag = getLegislativeTag(row);
                const motnCnt = Number(row.ttl_motn_cnt) || 0;
                const monthlyPace = Number(row.monthly_pace || 0).toFixed(1);
                const isDeferred = row.is_deferred === 1;
                const isSelectedForCompare = compareList.some((m) => m.assemb_id === row.assemb_id);
                const pureCnt = Number(row.pure_aprv_cnt) || 0;
                const altCnt = Number(row.alt_aprv_cnt) || 0;

                return (
                  <tr
                    key={row.assemb_id}
                    onClick={() => handleSelectAssemb(row)}
                    className={`hover:bg-indigo-50/50 cursor-pointer transition-colors group ${
                      isSelectedForCompare ? "bg-indigo-50/60" : isDeferred ? "bg-slate-50/40 opacity-75" : ""
                    }`}
                  >
                    <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => toggleCompare(row, e)}
                        title="1:1 맞비교 대상에 추가"
                        className={`w-7 h-7 rounded-lg text-xs font-black transition-all flex items-center justify-center mx-auto cursor-pointer ${
                          isSelectedForCompare
                            ? "bg-indigo-600 text-white shadow-md scale-105"
                            : "bg-slate-100 text-slate-400 hover:bg-indigo-100 hover:text-indigo-700"
                        }`}
                      >
                        VS
                      </button>
                    </td>

                    <td className="py-3 px-2 text-center font-bold text-slate-900 whitespace-nowrap">
                      {isDeferred ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-slate-200 text-slate-600">
                          유예
                        </span>
                      ) : row.rnkg && row.rnkg <= 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full font-black text-xs shadow-sm mx-auto">
                          {row.rnkg}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-xs">{row.rnkg ?? "-"}</span>
                      )}
                    </td>

                    <td className="py-3 px-2 text-right whitespace-nowrap">
                      {isDeferred || row.score === null ? (
                        <span className="text-slate-400 text-xs font-mono">-</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono shadow-xs">
                          {Number(row.score).toFixed(1)}점
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {row.assemb_nm}
                          </span>
                          {tag && (
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[11px] font-semibold border ${tag.style}`}>
                              {tag.label}
                              {tag.isSpecial && <Info className="w-3 h-3 text-slate-400" />}
                            </span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-all shrink-0 ml-0.5" />
                        </div>
                        <span className="text-xs text-slate-400 block truncate max-w-[200px] lg:max-w-[280px] mt-0.5">
                          {row.cmit_nm || "상임위 미배정"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          PARTY_COLORS[row.pltprt_nm] || "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {row.pltprt_nm}
                      </span>
                    </td>

                    <td className="py-3 px-2 text-slate-600 text-xs truncate max-w-[100px] lg:max-w-[130px]">
                      {row.rgn_nm || "비례대표"}
                    </td>

                    <td className="py-3 px-2 text-right font-mono whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-slate-800 font-semibold">{motnCnt.toLocaleString()}건</span>
                        <span className="text-xs text-slate-400">월 {monthlyPace}건</span>
                      </div>
                    </td>

                    {/* 1280px(xl) 이상 화면에서만 노출 */}
                    <td className="hidden xl:table-cell py-3 px-2 text-right whitespace-nowrap font-mono">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-blue-700">
                          {Number(row.own_cmit_motn_rate) || 0}%
                        </span>
                        <span className="text-xs text-slate-400">
                          {Number(row.own_cmit_motn_cnt) || 0}건
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-2 text-right whitespace-nowrap font-mono">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-slate-800">
                          {Number(row.cmt_present_rate) || 0}%
                        </span>
                        <span className="text-xs text-slate-400">
                          {Number(row.cmt_present_cnt) || 0}건
                        </span>
                      </div>
                    </td>

                    {/* 1280px(xl) 이상 화면에서만 노출 */}
                    <td className="hidden xl:table-cell py-3 px-2 text-right font-mono whitespace-nowrap">
                      {Number(row.avg_cmt_days) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-slate-700 text-xs">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {Number(row.avg_cmt_days)}일
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-emerald-600 font-mono">
                          {(Number(row.aprv_cnt) || 0).toLocaleString()}건
                        </span>
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                          <span className="text-emerald-700 font-medium">원{pureCnt}</span>
                          <span>·</span>
                          <span className="text-sky-700 font-medium">대{altCnt}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400 text-sm">
                  선택하신 조건에 일치하는 국회의원이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. 하단 플로팅 맞비교 독 */}
      {compareList.length > 0 && (
        <div className="fixed bottom-4 left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-40 bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between md:justify-start gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-1.5 shrink-0">
            <Swords className="w-4 h-4 text-indigo-400 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-slate-200 hidden sm:inline">1:1 맞비교</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs truncate">
            {compareList.map((m) => (
              <span
                key={m.assemb_id}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 font-semibold text-xs shrink-0 whitespace-nowrap"
              >
                {m.assemb_nm}
                <button onClick={() => toggleCompare(m)} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}

            {compareList.length === 1 && (
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 rounded-lg text-indigo-300 font-medium text-xs whitespace-nowrap animate-pulse transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ 상대 검색</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto md:ml-2">
            <button
              disabled={compareList.length < 2}
              onClick={() => setIsCompareModalOpen(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                compareList.length === 2
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg cursor-pointer scale-105"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              대결 분석 ⚔️
            </button>
            <button
              onClick={() => setCompareList([])}
              className="p-1 text-slate-400 hover:text-white"
              title="초기화"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5. 의원 상세 Drawer */}
      <AssembDetailDrawer
        assemb={selectedAssemb}
        onClose={() => handleSelectAssemb(null)}
        onOpenCompareWith={(m) => {
          setCompareList([m]);
          handleSelectAssemb(null);
          setIsSearchModalOpen(true);
        }}
      />

      {/* 6. 1:1 맞비교 대결 모달 */}
      {isCompareModalOpen && compareList.length === 2 && (
        <CompareModal
          memberA={compareList[0]}
          memberB={compareList[1]}
          allMembers={initialData}
          onSelectMemberA={(newA) => setCompareList([newA, compareList[1]])}
          onSelectMemberB={(newB) => setCompareList([compareList[0], newB])}
          onClose={() => setIsCompareModalOpen(false)}
        />
      )}

      {/* 7. 상대 의원 빠른 검색 모달 */}
      <MemberSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        allMembers={initialData}
        excludeId={compareList[0]?.assemb_id}
        title="맞비교할 상대 국회의원 선택"
        onSelect={(picked) => {
          if (compareList.length === 0) {
            setCompareList([picked]);
          } else {
            setCompareList([compareList[0], picked]);
            setIsCompareModalOpen(true);
          }
        }}
      />
    </div>
  );
}