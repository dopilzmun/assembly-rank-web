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
      // 심사소요일은 낮을수록 신속하므로 기본 오름차순 정렬
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

  // 병목 상태 판별 헬퍼 함수
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
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">소관 상임위원회별 입법 병목 분석</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                17개 상임위
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              어느 상임위가 법안 심사를 가장 빠르게 시작하고, 어디에서 법안이 정체되는지 분석합니다.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-semibold text-white transition-colors self-end md:self-auto"
        >
          <span>{isExpanded ? "상세 테이블 접기" : "전체 상임위 비교 펼치기"}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. 핵심 3대 인사이트 카드 (항상 표출) */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-50/60 border-b border-slate-100">
        
        {/* 최다 접수 상임위 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              최대 법안 접수 상임위
            </span>
            <strong className="text-sm font-bold text-slate-800">
              {mostLoadedCmit?.curr_cmit_nm || "-"}
            </strong>
            <span className="text-xs text-slate-500 block mt-0.5 font-mono">
              누적 <strong>{mostLoadedCmit?.total_bills.toLocaleString()}</strong>건 접수
            </span>
          </div>
          <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* 심사 착수 가장 빠른 상임위 */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-600 block mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3" /> 심사 착수 가장 빠른 곳
            </span>
            <strong className="text-sm font-bold text-emerald-950">
              {fastestCmit?.curr_cmit_nm || "-"}
            </strong>
            <span className="text-xs text-emerald-700 block mt-0.5 font-mono">
              평균 <strong>{fastestCmit?.avg_days ?? "-"}일</strong> 만에 상정
            </span>
          </div>
          <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* 심사 착수 가장 느린 상임위 (병목) */}
        <div className="bg-white p-4 rounded-xl border border-rose-200/80 bg-rose-50/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-rose-600 block mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> 심사 착수 가장 지연된 곳
            </span>
            <strong className="text-sm font-bold text-rose-950">
              {slowestCmit?.curr_cmit_nm || "-"}
            </strong>
            <span className="text-xs text-rose-700 block mt-0.5 font-mono">
              평균 <strong>{slowestCmit?.avg_days ?? "-"}일</strong> 소요 (상정률 {slowestCmit?.present_rate}%)
            </span>
          </div>
          <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 3. 전체 상임위 비교 테이블 (토글 펼침 영역) */}
      {isExpanded && (
        <div className="p-5 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              각 컬럼 헤더를 클릭하여 정렬 기준을 바꿀 수 있습니다.
            </span>
            <span className="text-[11px] text-slate-400">
              * 심사소요일은 발의 후 상임위 전체회의 상정까지 걸린 평균 일수입니다.
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
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
                        {/* 상임위명 */}
                        <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {row.curr_cmit_nm}
                        </td>

                        {/* 접수 건수 */}
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                          {row.total_bills.toLocaleString()}건
                        </td>

                        {/* 상정 진행도 프로그레스 바 */}
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

                        {/* 심사착수 평균 소요일 */}
                        <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                          {row.avg_days !== null ? (
                            <span className="font-bold text-slate-800">
                              {row.avg_days}일
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* 본회의 실질가결 */}
                        <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                          <span className="font-bold text-emerald-600">
                            {row.aprv_cnt}건
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1 font-semibold">
                            ({row.aprv_rate}%)
                          </span>
                        </td>

                        {/* 병목 진단 배지 */}
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