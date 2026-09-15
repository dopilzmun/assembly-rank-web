"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
  ExternalLink,
  Users,
} from "lucide-react";

interface CommitteeBottleneckSectionProps {
  data: CommitteeBottleneckStats[];
}

type SortField = "total_bills" | "present_rate" | "avg_days" | "aprv_rate";
type SortDirection = "asc" | "desc";

interface SortOption {
  label: string;
  field: SortField;
  direction: SortDirection;
}

const SORT_OPTIONS: SortOption[] = [
  { label: "접수량 많은순", field: "total_bills", direction: "desc" },
  { label: "⚡ 신속 착수순", field: "avg_days", direction: "asc" },
  { label: "🚨 병목 지연순", field: "avg_days", direction: "desc" },
  { label: "상정 진행도순", field: "present_rate", direction: "desc" },
  { label: "가결률 높은순", field: "aprv_rate", direction: "desc" },
];

export default function CommitteeBottleneckSection({ data }: CommitteeBottleneckSectionProps) {
  // 기본값을 펼침(true)으로 변경하여 진입 즉시 탐색 가능
  const [isExpanded, setIsExpanded] = useState(true);
  const [sortField, setSortField] = useState<SortField>("total_bills");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // 1. 하이라이트 3대 지표 계산
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

  // 2. 정렬 핸들러
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "avg_days" ? "asc" : "desc");
    }
  };

  const applySortOption = (opt: SortOption) => {
    setSortField(opt.field);
    setSortDirection(opt.direction);
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

  // 병목 상태 판별 헬퍼 (다크모드 지원)
  const getBottleneckStatus = (item: CommitteeBottleneckStats) => {
    const days = item.avg_days;
    const rate = item.present_rate;

    if (days !== null && days <= 60 && rate >= 40) {
      return {
        label: "원활 (신속 착수)",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
        dot: "bg-emerald-500",
      };
    }
    if ((days !== null && days >= 100) || rate < 25) {
      return {
        label: "정체 (병목 주의)",
        color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900",
        dot: "bg-rose-500",
      };
    }
    return {
      label: "보통 (평균 진행)",
      color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
      dot: "bg-amber-500",
    };
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 font-bold shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 font-bold shrink-0" />
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
      
      {/* 1. 상단 요약 배너 */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-white whitespace-nowrap">
                소관 상임위원회별 입법 병목 분석
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 whitespace-nowrap font-mono">
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold text-white transition-colors self-end md:self-auto shrink-0 cursor-pointer"
        >
          <span>{isExpanded ? "상임위 목록 접기" : "전체 17개 상임위 펼치기"}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. 핵심 3대 하이라이트 인사이트 카드 */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/60 border-b border-slate-100 dark:bg-slate-800/30 dark:border-slate-800">
        
        {/* 하이라이트 1: 최다 접수 상임위 */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
          <div className="truncate">
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5 whitespace-nowrap dark:text-slate-500">
              최대 법안 접수 상임위
            </span>
            <strong className="text-sm sm:text-base font-black text-slate-800 truncate block dark:text-slate-100">
              {mostLoadedCmit?.curr_cmit_nm || "-"}
            </strong>
            <span className="text-xs text-slate-500 block mt-0.5 font-mono whitespace-nowrap dark:text-slate-400">
              누적 <strong className="text-slate-900 dark:text-slate-200">{mostLoadedCmit?.total_bills.toLocaleString()}</strong>건 접수
            </span>
          </div>
          <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500 shrink-0 ml-2 dark:bg-slate-800 dark:text-slate-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* 하이라이트 2: 심사 착수 가장 빠른 상임위 */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs flex items-center justify-between dark:bg-slate-900 dark:border-emerald-900/60 dark:bg-emerald-950/10">
          <div className="truncate">
            <span className="text-[11px] font-bold text-emerald-600 block mb-0.5 flex items-center gap-1 whitespace-nowrap dark:text-emerald-400">
              <Zap className="w-3 h-3" /> 심사 착수 가장 빠른 곳
            </span>
            <strong className="text-sm sm:text-base font-black text-emerald-950 truncate block dark:text-emerald-200">
              {fastestCmit?.curr_cmit_nm || "-"}
            </strong>
            <span className="text-xs text-emerald-700 block mt-0.5 font-mono whitespace-nowrap dark:text-emerald-400">
              평균 <strong className="text-emerald-600 dark:text-emerald-300">{fastestCmit?.avg_days ?? "-"}일</strong> 만에 상정
            </span>
          </div>
          <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600 shrink-0 ml-2 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* 하이라이트 3: 심사 착수 가장 지연된 상임위 (병목) */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-rose-200/80 bg-rose-50/20 shadow-xs flex items-center justify-between dark:bg-slate-900 dark:border-rose-900/60 dark:bg-rose-950/10">
          <div className="truncate">
            <span className="text-[11px] font-bold text-rose-600 block mb-0.5 flex items-center gap-1 whitespace-nowrap dark:text-rose-400">
              <AlertTriangle className="w-3 h-3" /> 심사 착수 가장 지연된 곳
            </span>
            <strong className="text-sm sm:text-base font-black text-rose-950 truncate block dark:text-rose-200">
              {slowestCmit?.curr_cmit_nm || "-"}
            </strong>
            <span className="text-xs text-rose-700 block mt-0.5 font-mono whitespace-nowrap dark:text-rose-400">
              평균 <strong className="text-rose-600 dark:text-rose-300">{slowestCmit?.avg_days ?? "-"}일</strong> 소요 (상정률 {slowestCmit?.present_rate}%)
            </span>
          </div>
          <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600 shrink-0 ml-2 dark:bg-rose-950 dark:text-rose-300">
            <Clock className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 3. 전체 17개 상임위 목록 영역 */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
          
          {/* 가로 스크롤 원터치 정렬 칩 바 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 shrink-0 mr-1">빠른 정렬:</span>
            {SORT_OPTIONS.map((opt) => {
              const isSelected = sortField === opt.field && sortDirection === opt.direction;
              return (
                <button
                  key={opt.label}
                  onClick={() => applySortOption(opt)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs dark:bg-indigo-500"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* (A) [모바일 전용] 컴팩트 카드 뷰 (md 미만 표시) */}
          <div className="block md:hidden space-y-3">
            {sortedData.map((row) => {
              const status = getBottleneckStatus(row);

              return (
                <div
                  key={row.curr_cmit_nm}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 dark:bg-slate-900 dark:border-slate-800"
                >
                  {/* 상임위명 & 상태 뱃지 */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <span className="font-black text-slate-900 text-sm sm:text-base whitespace-nowrap truncate dark:text-slate-100">
                      {row.curr_cmit_nm}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap shrink-0 ${status.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>

                  {/* 심사 상정 진행도 게이지 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] font-sans font-medium">심사 상정 진행도</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {row.present_rate}%{" "}
                        <span className="text-slate-400 font-normal text-[10px]">
                          ({row.present_cnt.toLocaleString()}건)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden dark:bg-slate-800">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all dark:bg-indigo-500"
                        style={{ width: `${Math.min(100, row.present_rate)}%` }}
                      />
                    </div>
                  </div>

                  {/* 3분할 세부 수치 그리드 */}
                  <div className="grid grid-cols-3 gap-1 text-center bg-slate-50/90 rounded-xl p-2.5 font-mono text-xs dark:bg-slate-800/40">
                    <div>
                      <span className="text-[10px] text-slate-400 block whitespace-nowrap font-sans">접수 법안</span>
                      <strong className="text-xs text-slate-800 font-bold whitespace-nowrap dark:text-slate-200">
                        {row.total_bills.toLocaleString()}건
                      </strong>
                    </div>

                    <div className="border-x border-slate-200/70 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block whitespace-nowrap font-sans">평균 착수일</span>
                      <strong className="text-xs text-slate-800 font-bold whitespace-nowrap dark:text-slate-200">
                        {row.avg_days !== null ? `${row.avg_days}일` : "-"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block whitespace-nowrap font-sans">본회의 가결</span>
                      <strong className="text-xs text-emerald-600 font-bold whitespace-nowrap dark:text-emerald-400">
                        {row.aprv_cnt}건 ({row.aprv_rate}%)
                      </strong>
                    </div>
                  </div>

                  {/* 소속 국회의원 순위표 연계 버튼 */}
                  <div className="pt-1 flex justify-end">
                    <Link
                      href={`/rankings?q=${encodeURIComponent(row.curr_cmit_nm)}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors py-1 px-2 rounded-lg hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{row.curr_cmit_nm} 소속 의원 순위표 보기</span>
                      <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* (B) [PC 전용] 6열 테이블 (md 이상 표시) */}
          <div className="hidden md:block border border-slate-200 rounded-xl overflow-hidden shadow-xs dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 text-slate-700 font-semibold select-none border-b border-slate-200 whitespace-nowrap dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-3.5 w-48">상임위원회명</th>
                    
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
                    <th className="py-3 px-3 text-center w-24">의원 보기</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {sortedData.map((row) => {
                    const status = getBottleneckStatus(row);

                    return (
                      <tr key={row.curr_cmit_nm} className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap dark:text-slate-100">
                          {row.curr_cmit_nm}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap dark:text-slate-200">
                          {row.total_bills.toLocaleString()}건
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden max-w-[120px] dark:bg-slate-800">
                              <div
                                className="bg-indigo-600 h-full rounded-full transition-all dark:bg-indigo-500"
                                style={{ width: `${Math.min(100, row.present_rate)}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-800 text-[11px] dark:text-slate-200">
                              {row.present_rate}%
                            </span>
                            <span className="text-slate-400 text-[10px] font-mono">
                              ({row.present_cnt}건)
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                          {row.avg_days !== null ? (
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {row.avg_days}일
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
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

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <Link
                            href={`/rankings?q=${encodeURIComponent(row.curr_cmit_nm)}`}
                            className="inline-flex items-center gap-0.5 text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                            title={`${row.curr_cmit_nm} 소속 국회의원 순위 조회`}
                          >
                            <span className="text-[11px] font-semibold">의원</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
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