"use client";

import { useState, useMemo } from "react";
import { CommitteeBottleneckStats } from "@/types/committee";
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
} from "lucide-react";

interface CommitteeBottleneckSectionProps {
  data: CommitteeBottleneckStats[];
}

type SortField = "total_bills" | "present_rate" | "avg_days" | "aprv_rate";
type SortDirection = "asc" | "desc";

export default function CommitteeBottleneckSection({ data }: CommitteeBottleneckSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortField, setSortField] = useState<SortField>("total_bills");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // 1. 하이라이트 지표 계산
  const { fastestCmit, slowestCmit, mostLoadedCmit } = useMemo(() => {
    const validWithDays = data.filter((d) => d.avg_days !== null && d.avg_days > 0 && d.total_bills >= 10);
    
    const sortedBySpeed = [...validWithDays].sort((a, b) => (a.avg_days ?? 999) - (b.avg_days ?? 999));
    const fastest = sortedBySpeed[0] || null;
    const slowest = sortedBySpeed[sortedBySpeed.length - 1] || null;
    
    const sortedByBills = [...data].sort((a, b) => b.total_bills - a.total_bills);
    const mostLoaded = sortedByBills[0] || null;

    return {
      fastestCmit: fastest,
      slowestCmit: slowest,
      mostLoadedCmit: mostLoaded,
    };
  }, [data]);

  // 2. 정렬 로직
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "avg_days" ? "asc" : "desc");
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (sortField === "avg_days") {
        const aDays = aVal !== null ? Number(aVal) : 9999;
        const bDays = bVal !== null ? Number(bVal) : 9999;
        return sortDirection === "asc" ? aDays - bDays : bDays - aDays;
      }

      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
    });
  }, [data, sortField, sortDirection]);

  // 병목 상태 판별 헬퍼
  const getBottleneckStatus = (item: CommitteeBottleneckStats) => {
    const days = item.avg_days;
    const rate = item.present_rate;

    if (days !== null && days <= 60 && rate >= 40) {
      return {
        label: "원활 (신속 착수)",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
      };
    }
    if ((days !== null && days >= 100) || rate < 25) {
      return {
        label: "정체 (병목 주의)",
        color: "bg-rose-50 text-rose-700 border-rose-200",
        dot: "bg-rose-500",
      };
    }
    return {
      label: "보통 (평균 진행)",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    };
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* 1. 상단 요약 바 */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-white whitespace-nowrap">
                소관 상임위원회별 입법 병목 분석
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 whitespace-nowrap">
                17개 상임위
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 break-keep">
              어느 상임위가 법안 심사를 가장 빠르게 시작하고, 어디에서 법안이 정체되는지 분석합니다.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-semibold text-white transition-colors self-end md:self-auto shrink-0 whitespace-nowrap"
        >
          <span>{isExpanded ? "상세 내역 접기" : "전체 상임위 비교 펼치기"}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. 핵심 3대 인사이트 카드 */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/60 border-b border-slate-100">
        
        {/* 최다 접수 상임위 */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="truncate">
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5 whitespace-nowrap">
              최대 법안 접수 상임위
            </span>
            <strong className="text-sm font-bold text-slate-800 truncate block">
              {mostLoadedCmit?.curr_cmit_nm || "-"}
            </strong>
            <span className="text-xs text-slate-500 block mt-0.5 font-mono whitespace-nowrap">
              누적 <strong>{mostLoadedCmit?.total_bills.toLocaleString()}</strong>건 접수
            </span>
          </div>
          <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500 shrink-0 ml-2">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* 심사 착수 가장 빠른 상임위 */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm flex items-center justify-between">
          <div className="truncate">
            <span className="text-[11px] font-semibold text-emerald-600 block mb-0.5 flex items-center gap-1 whitespace-nowrap">
              <Zap className="w-3 h-3" /> 심사 착수 가장 빠른 곳
            </span>
            <strong className="text-sm font-bold text-emerald-950 truncate block">
              {fastestCmit?.curr_cmit_nm || "-"}
            </strong>
            <span className="text-xs text-emerald-700 block mt-0.5 font-mono whitespace-nowrap">
              평균 <strong>{fastestCmit?.avg_days ?? "-"}일</strong> 만에 상정
            </span>
          </div>
          <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600 shrink-0 ml-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* 심사 착수 가장 지연된 상임위 */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-rose-200/80 bg-rose-50/20 shadow-sm flex items-center justify-between">
          <div className="truncate">
            <span className="text-[11px] font-semibold text-rose-600 block mb-0.5 flex items-center gap-1 whitespace-nowrap">
              <AlertTriangle className="w-3 h-3" /> 심사 착수 가장 지연된 곳
            </span>
            <strong className="text-sm font-bold text-rose-950 truncate block">
              {slowestCmit?.curr_cmit_nm || "-"}
            </strong>
            <span className="text-xs text-rose-700 block mt-0.5 font-mono whitespace-nowrap">
              평균 <strong>{slowestCmit?.avg_days ?? "-"}일</strong> 소요 (상정률 {slowestCmit?.present_rate}%)
            </span>
          </div>
          <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600 shrink-0 ml-2">
            <Clock className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 3. 전체 17개 상임위 펼침 영역 */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-3 animate-in fade-in duration-200">
          
          {/* 정렬 안내 및 모바일 정렬 셀렉터 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              17개 상임위원회의 심사 진행도 및 착수 속도 비교
            </span>

            {/* 모바일 전용 정렬 셀렉터 (md 미만 표시) */}
            <div className="flex items-center gap-1.5 md:hidden self-end">
              <span className="text-slate-400 text-[11px]">정렬:</span>
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [f, d] = e.target.value.split("-") as [SortField, SortDirection];
                  setSortField(f);
                  setSortDirection(d);
                }}
                className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700"
              >
                <option value="total_bills-desc">접수건수 많은순</option>
                <option value="present_rate-desc">상정 진행도 높은순</option>
                <option value="avg_days-asc">심사착수 빠른순</option>
                <option value="aprv_rate-desc">본회의가결률 높은순</option>
              </select>
            </div>
          </div>

          {/* (A) [모바일 전용] 컴팩트 카드 뷰 (md 미만 노출) */}
          <div className="block md:hidden space-y-2.5">
            {sortedData.map((row) => {
              const status = getBottleneckStatus(row);

              return (
                <div
                  key={row.curr_cmit_nm}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm space-y-2.5"
                >
                  {/* 상임위명 & 상태 뱃지 */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-sm whitespace-nowrap truncate">
                      {row.curr_cmit_nm}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap shrink-0 ${status.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>

                  {/* 심사 상정 진행도 바 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 text-[11px] font-sans">심사 상정 진행도</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {row.present_rate}%{" "}
                        <span className="text-slate-400 font-normal text-[10px]">
                          ({row.present_cnt.toLocaleString()}건)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, row.present_rate)}%` }}
                      />
                    </div>
                  </div>

                  {/* 3분할 세부 수치 그리드 */}
                  <div className="grid grid-cols-3 gap-1 text-center bg-slate-50/80 rounded-lg p-2 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block whitespace-nowrap font-sans">접수 법안</span>
                      <strong className="text-xs text-slate-800 font-bold whitespace-nowrap">
                        {row.total_bills.toLocaleString()}건
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block whitespace-nowrap font-sans">평균 착수일</span>
                      <strong className="text-xs text-slate-800 font-bold whitespace-nowrap">
                        {row.avg_days !== null ? `${row.avg_days}일` : "-"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block whitespace-nowrap font-sans">본회의 가결</span>
                      <strong className="text-xs text-emerald-700 font-bold whitespace-nowrap">
                        {row.aprv_cnt}건 ({row.aprv_rate}%)
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* (B) [PC 전용] 6열 테이블 (md 이상 노출) */}
          <div className="hidden md:block border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 font-semibold select-none border-b border-slate-200 whitespace-nowrap">
                  <tr>
                    <th className="py-3 px-3.5 w-44">상임위원회명</th>
                    
                    <th
                      onClick={() => handleSort("total_bills")}
                      className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/70 transition-colors group w-28"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>접수 법안</span>
                        {renderSortIcon("total_bills")}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort("present_rate")}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/70 transition-colors group min-w-[180px]"
                    >
                      <div className="flex items-center gap-1">
                        <span>심사 상정 진행도 (상정률)</span>
                        {renderSortIcon("present_rate")}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort("avg_days")}
                      className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/70 transition-colors group w-28"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>평균 착수일</span>
                        {renderSortIcon("avg_days")}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort("aprv_rate")}
                      className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/70 transition-colors group w-28"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>본회의 실질가결</span>
                        {renderSortIcon("aprv_rate")}
                      </div>
                    </th>

                    <th className="py-3 px-3.5 text-center w-32">병목 진단 상태</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {sortedData.map((row) => {
                    const status = getBottleneckStatus(row);

                    return (
                      <tr key={row.curr_cmit_nm} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {row.curr_cmit_nm}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                          {row.total_bills.toLocaleString()}건
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden max-w-[120px]">
                              <div
                                className="bg-indigo-600 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, row.present_rate)}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-800 text-[11px]">
                              {row.present_rate}%
                            </span>
                            <span className="text-slate-400 text-[10px] font-mono">
                              ({row.present_cnt}건)
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                          {row.avg_days !== null ? (
                            <span className="font-bold text-slate-800">
                              {row.avg_days}일
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                          <span className="font-bold text-emerald-600">
                            {row.aprv_cnt}건
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1 font-semibold">
                            ({row.aprv_rate}%)
                          </span>
                        </td>

                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${status.color}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}