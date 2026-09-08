"use client";

import { useState, useMemo } from "react";
import { BillRankingRow } from "@/types/ranking";
import AssembDetailDrawer from "@/components/AssembDetailDrawer";
import CompareModal from "@/components/CompareModal";
import {
  Search,
  Filter,
  RotateCcw,
  Clock,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Award,
  Info,
  Swords,
  X,
} from "lucide-react";

interface RankingDashboardProps {
  initialData: BillRankingRow[];
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
  | "aprv_rate";

type SortDirection = "asc" | "desc";

function getLegislativeTag(row: BillRankingRow) {
  if (row.is_deferred === 1) {
    return {
      label: "평가 유예",
      style: "bg-slate-100 text-slate-500 border-slate-300",
      tooltip: "임기 개시 후 100일 미만 의원으로, 통계적 최소 표본 보호를 위해 종합 순위 산정이 유예됩니다.",
      isSpecial: true,
    };
  }

  const motnCnt = Number(row.ttl_motn_cnt) || 0;
  if (motnCnt === 0) {
    return {
      label: "직무 특수",
      style: "bg-slate-100 text-slate-600 border-slate-200",
      tooltip: "국회의장단, 정당 지도부(원내대표·당대표), 장관 겸직 등의 사유로 개별 발의가 없는 경우입니다.",
      isSpecial: true,
    };
  }
  return null;
}

export default function RankingDashboard({ initialData }: RankingDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParty, setSelectedParty] = useState("ALL");
  const [selectedCmit, setSelectedCmit] = useState("ALL");
  const [minBills, setMinBills] = useState<number>(0);

  const [sortField, setSortField] = useState<SortField>("rnkg");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedAssemb, setSelectedAssemb] = useState<BillRankingRow | null>(null);

  // 1:1 맞비교 선택 상태 관리
  const [compareList, setCompareList] = useState<BillRankingRow[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

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

  // 맞비교 선택 토글 함수
  const toggleCompare = (member: BillRankingRow, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCompareList((prev) => {
      const exists = prev.some((m) => m.assemb_id === member.assemb_id);
      if (exists) {
        return prev.filter((m) => m.assemb_id !== member.assemb_id);
      }
      if (prev.length >= 2) {
        // 이미 2명이면 마지막 한 명을 교체
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
      return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0" />;
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
      {/* 1. 상단 컨트롤 패널 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="의원명, 지역구, 상임위 검색 (예: 종로, 교육위, 김선교)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:inline" />
              <select
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">전체 정당 ({initialData.length}명)</option>
                {partyList.map((party) => (
                  <option key={party} value={party}>
                    {party}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400 hidden sm:inline" />
              <select
                value={selectedCmit}
                onChange={(e) => setSelectedCmit(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[200px]"
              >
                <option value="ALL">전체 소속 상임위</option>
                {committeeList.map((cmit) => (
                  <option key={cmit} value={cmit}>
                    {cmit}
                  </option>
                ))}
              </select>
            </div>

            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                초기화
              </button>
            )}
          </div>
        </div>

        {/* 최소 발의 건수 허들 */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500 mr-2">최소 발의 건수:</span>
          {[
            { label: "전체 (0건 이상)", value: 0 },
            { label: "5건 이상", value: 5 },
            { label: "10건 이상 (권장)", value: 10 },
            { label: "20건 이상", value: 20 },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setMinBills(btn.value)}
              className={`px-3 py-1.5 rounded-full font-medium transition-all ${
                minBills === btn.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {btn.label}
            </button>
          ))}
          <span className="text-slate-400 text-[11px] ml-auto hidden lg:inline">
            * 각 행의 [VS] 버튼을 클릭해 2명의 국회의원을 1:1 맞비교할 수 있습니다.
          </span>
        </div>
      </div>

      {/* 2. 지표 배너 */}
      <div className="bg-indigo-50/80 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-950 flex flex-wrap gap-x-5 gap-y-1.5 items-center">
        <span className="font-bold flex items-center gap-1 text-indigo-700">
          <Award className="w-4 h-4 text-indigo-600" /> 종합 점수 (100점):
        </span>
        <span>
          <strong>가결 성과(45점)</strong> + <strong>심사 추진력(35점)</strong> + <strong>입법 규모(20점)</strong>
        </span>
        <span className="text-slate-500 hidden md:inline">
          | 각 지표 하단 회색 수치는 모수(건수/페이스)입니다.
        </span>
      </div>

      {/* 결과 수치 안내 */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-2">
          <span>
            조회 결과: <strong className="text-slate-900 font-semibold">{sortedData.length}</strong>명 / 전체 {initialData.length}명
          </span>
          {selectedCmit !== "ALL" && (
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
              [{selectedCmit}] 소속
            </span>
          )}
        </div>
        <span className="text-slate-400 text-[11px]">
          * 의원 행을 클릭하면 상세 Drawer 및 육각형 스탯 차트가 열립니다.
        </span>
      </div>

      {/* 3. 랭킹 테이블 (VS 대결 버튼 탑재) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-semibold text-xs tracking-wider border-b border-slate-200 select-none whitespace-nowrap">
              <tr>
                {/* VS 맞비교 선택 컬럼 */}
                <th className="py-3 px-2 text-center w-12">비교</th>

                {/* 1. 순위 */}
                <th
                  onClick={() => handleSort("rnkg")}
                  className="py-3 px-2.5 text-center w-14 cursor-pointer hover:bg-slate-200/70 transition-colors group"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>순위</span>
                    {renderSortIcon("rnkg")}
                  </div>
                </th>

                {/* 2. 종합점수 */}
                <th
                  onClick={() => handleSort("score")}
                  className="py-3 px-2.5 cursor-pointer hover:bg-slate-200/70 transition-colors group text-right w-20"
                >
                  <div className="flex items-center justify-end gap-1 text-indigo-700">
                    <span>종합점수</span>
                    {renderSortIcon("score")}
                  </div>
                </th>

                {/* 3. 의원명 */}
                <th
                  onClick={() => handleSort("assemb_nm")}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/70 transition-colors group min-w-[280px]"
                >
                  <div className="flex items-center gap-1">
                    <span>의원명</span>
                    {renderSortIcon("assemb_nm")}
                  </div>
                </th>

                {/* 4. 정당 */}
                <th className="py-3 px-2 text-center w-24">정당</th>

                {/* 5. 지역구 */}
                <th className="py-3 px-3 w-36">지역구</th>

                {/* 6. 대표발의 */}
                <th
                  onClick={() => handleSort("ttl_motn_cnt")}
                  className="py-3 px-2.5 text-right cursor-pointer hover:bg-slate-200/70 transition-colors group w-24"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>대표발의</span>
                    {renderSortIcon("ttl_motn_cnt")}
                  </div>
                </th>

                {/* 7. 상임위 집중도 */}
                <th
                  onClick={() => handleSort("own_cmit_motn_rate")}
                  className="py-3 px-2.5 text-right cursor-pointer hover:bg-slate-200/70 transition-colors group w-24"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>상임위 집중</span>
                    {renderSortIcon("own_cmit_motn_rate")}
                  </div>
                </th>

                {/* 8. 상정률 */}
                <th
                  onClick={() => handleSort("cmt_present_rate")}
                  className="py-3 px-2.5 text-right cursor-pointer hover:bg-slate-200/70 transition-colors group w-20"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>상정률</span>
                    {renderSortIcon("cmt_present_rate")}
                  </div>
                </th>

                {/* 9. 심사소요일 */}
                <th
                  onClick={() => handleSort("avg_cmt_days")}
                  className="py-3 px-2.5 text-right cursor-pointer hover:bg-slate-200/70 transition-colors group w-24"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>심사소요일</span>
                    {renderSortIcon("avg_cmt_days")}
                  </div>
                </th>

                {/* 10. 본회의 가결 */}
                <th
                  onClick={() => handleSort("aprv_cnt")}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/70 transition-colors group w-24"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>본회의 가결</span>
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

                  return (
                    <tr
                      key={row.assemb_id}
                      onClick={() => setSelectedAssemb(row)}
                      className={`hover:bg-indigo-50/50 cursor-pointer transition-colors group ${
                        isSelectedForCompare ? "bg-indigo-50/60" : isDeferred ? "bg-slate-50/40 opacity-75" : ""
                      }`}
                    >
                      {/* VS 선택 버튼 */}
                      <td className="py-3.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => toggleCompare(row, e)}
                          title="1:1 맞비교 대상에 추가"
                          className={`w-7 h-7 rounded-lg text-xs font-black transition-all flex items-center justify-center ${
                            isSelectedForCompare
                              ? "bg-indigo-600 text-white shadow-md scale-105"
                              : "bg-slate-100 text-slate-400 hover:bg-indigo-100 hover:text-indigo-700"
                          }`}
                        >
                          VS
                        </button>
                      </td>

                      {/* 순위 */}
                      <td className="py-3.5 px-2.5 text-center font-bold text-slate-900 whitespace-nowrap">
                        {isDeferred ? (
                          <span
                            title="등원 100일 미만으로 종합 평가가 유예되었습니다."
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-600 cursor-help"
                          >
                            유예
                          </span>
                        ) : row.rnkg && row.rnkg <= 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full font-black text-xs shadow-sm">
                            {row.rnkg}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-xs">{row.rnkg ?? "-"}</span>
                        )}
                      </td>

                      {/* 종합점수 */}
                      <td className="py-3.5 px-2.5 text-right whitespace-nowrap">
                        {isDeferred || row.score === null ? (
                          <span className="text-slate-400 text-xs font-mono">-</span>
                        ) : (
                          <div className="inline-flex flex-col items-end">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono shadow-sm">
                              {Number(row.score).toFixed(1)}점
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 의원명 + 상임위 */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex flex-col">
                          <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {row.assemb_nm}
                            </span>
                            {tag && (
                              <span
                                title={tag.tooltip}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold border cursor-help whitespace-nowrap ${tag.style}`}
                              >
                                {tag.label}
                                {tag.isSpecial ? (
                                  <Info className="w-2.5 h-2.5 text-slate-400" />
                                ) : null}
                              </span>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                          </div>
                          <span
                            className="text-[11px] text-slate-400 block truncate max-w-[340px] mt-0.5 whitespace-nowrap"
                            title={row.cmit_nm || ""}
                          >
                            {row.cmit_nm || "상임위 미배정"}
                          </span>
                        </div>
                      </td>

                      {/* 정당 배지 */}
                      <td className="py-3.5 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${
                            PARTY_COLORS[row.pltprt_nm] || "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {row.pltprt_nm}
                        </span>
                      </td>

                      {/* 지역구 */}
                      <td className="py-3.5 px-3 text-slate-600 text-xs whitespace-nowrap truncate max-w-[144px]" title={row.rgn_nm || "비례대표"}>
                        {row.rgn_nm || "비례대표"}
                      </td>

                      {/* 대표발의 + 월평균 페이스 */}
                      <td className="py-3.5 px-2.5 text-right font-mono whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          {motnCnt === 0 ? (
                            <span
                              title="국회의장단, 정당 지도부(당대표·원내대표), 장관 겸직 등의 사유"
                              className="inline-flex items-center gap-0.5 text-slate-400 hover:text-slate-700 cursor-help"
                            >
                              0건
                              <Info className="w-3 h-3 text-slate-400" />
                            </span>
                          ) : (
                            <span className="text-slate-800 font-semibold">
                              {motnCnt.toLocaleString()}건
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            월 {monthlyPace}건
                          </span>
                        </div>
                      </td>

                      {/* 상임위 집중도 */}
                      <td className="py-3.5 px-2.5 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-blue-700 font-mono">
                            {Number(row.own_cmit_motn_rate) || 0}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {Number(row.own_cmit_motn_cnt) || 0}건
                          </span>
                        </div>
                      </td>

                      {/* 상정률 */}
                      <td className="py-3.5 px-2.5 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-slate-800 font-mono">
                            {Number(row.cmt_present_rate) || 0}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {Number(row.cmt_present_cnt) || 0}건
                          </span>
                        </div>
                      </td>

                      {/* 심사소요일 */}
                      <td className="py-3.5 px-2.5 text-right font-mono whitespace-nowrap">
                        {Number(row.avg_cmt_days) > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-slate-700 text-xs">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {Number(row.avg_cmt_days)}일
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* 본회의 가결 (가결수 + 가결률) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-emerald-600 font-mono">
                            {(Number(row.aprv_cnt) || 0).toLocaleString()}건
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 font-mono">
                            {row.aprv_rate !== null ? `${Number(row.aprv_rate)}%` : "-"}
                          </span>
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
      </div>

      {/* 4. 하단 플로팅 맞비교 바 (1명 이상 선택 시 등장) */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-200">1:1 맞비교</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {compareList.map((m) => (
              <span
                key={m.assemb_id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 font-semibold"
              >
                {m.assemb_nm}
                <button
                  onClick={() => toggleCompare(m)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {compareList.length === 1 && (
              <span className="text-slate-400 text-[11px] animate-pulse">
                비교할 의원 1명을 추가 선택하세요
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
            <button
              disabled={compareList.length < 2}
              onClick={() => setIsCompareModalOpen(true)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                compareList.length === 2
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg cursor-pointer scale-105"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              대결 분석 열기 ⚔️
            </button>
            <button
              onClick={() => setCompareList([])}
              className="p-1 text-slate-400 hover:text-white text-xs"
              title="비교 초기화"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 5. 의원 상세 Drawer */}
      <AssembDetailDrawer
        assemb={selectedAssemb}
        onClose={() => setSelectedAssemb(null)}
        onOpenCompareWith={(m) => {
          // Drawer에서 '다른 의원과 1:1 비교' 클릭 시 첫 번째 슬롯으로 등록
          const secondMember = initialData.find((cand) => cand.assemb_id !== m.assemb_id) || m;
          setCompareList([m, secondMember]);
          setSelectedAssemb(null);
          setIsCompareModalOpen(true);
        }}
      />

      {/* 6. 1:1 맞비교 모달 */}
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
    </div>
  );
}