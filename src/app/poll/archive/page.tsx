"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import DailyBillPollWidget from "@/components/DailyBillPollWidget";
import {
  Vote,
  Archive,
  Search,
  ExternalLink,
  Flame,
  Calendar,
  Sparkles,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

interface ArchivedPoll {
  poll_id: number;
  bill_id: string;
  poll_titl: string;
  smry_cnts: string;
  pro_cnt: number;
  con_cnt: number;
  poll_dd: string;
}

export default function PollArchivePage() {
  const [polls, setPolls] = useState<ArchivedPoll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/poll/archive")
      .then((res) => (res.ok ? res.json() : { polls: [] }))
      .then((data) => {
        const list = Array.isArray(data) ? data : data.polls || [];
        setPolls(list);
      })
      .catch((err) => console.error("아카이브 로드 실패:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // 검색 및 정렬 필터링
  const filteredPolls = useMemo(() => {
    let result = polls.filter((p) => {
      const term = searchTerm.toLowerCase();
      return (
        p.poll_titl.toLowerCase().includes(term) ||
        p.smry_cnts?.toLowerCase().includes(term)
      );
    });

    if (sortBy === "popular") {
      result.sort((a, b) => b.pro_cnt + b.con_cnt - (a.pro_cnt + a.con_cnt));
    } else {
      result.sort(
        (a, b) =>
          new Date(b.poll_dd).getTime() - new Date(a.poll_dd).getTime() ||
          b.poll_id - a.poll_id
      );
    }
    return result;
  }, [polls, searchTerm, sortBy]);

  // 누적 참여 통계 집계
  const totalVotesCount = useMemo(() => {
    return polls.reduce((sum, p) => sum + p.pro_cnt + p.con_cnt, 0);
  }, [polls]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* =========================================================
            1. 페이지 메인 헤더
            ========================================================= */}
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
            <Vote className="h-3.5 w-3.5" />
            <span>제22대 국회 입법 투표 센터</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            시민 1초 쟁점 투표 & 여론 아카이브
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            오늘 가장 뜨거운 국회 쟁점 법안에 실시간으로 찬반 의사를 표명하고, 마감된 법안들의 최종 시민 여론 집계 결과를 확인하세요.
          </p>
        </div>

        {/* =========================================================
            2. [핵심] 오늘의 쟁점 법안 실시간 투표 섹션
            ========================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                오늘의 쟁점 법안 투표
              </h2>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              실시간 집계 중
            </span>
          </div>

          {/* 데일리 투표 컴포넌트 마운트 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
            <DailyBillPollWidget />
          </div>
        </div>

        {/* =========================================================
            3. 지난 쟁점 법안 투표 아카이브 섹션
            ========================================================= */}
        <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          
          {/* 아카이브 헤더 및 검색/정렬 도구 바 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                  마감된 투표 결과 아카이브
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                투표가 종료된 법안들의 찬반 비율과 최종 참여 시민 수입니다.
              </p>
            </div>

            {/* 누적 참여 요약 뱃지 */}
            <div className="flex items-center gap-2 font-mono text-xs text-slate-500 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                총 <strong>{polls.length}</strong>개 안건
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-900 dark:text-indigo-300">
                누적 <strong>{totalVotesCount.toLocaleString()}</strong>명 참여
              </span>
            </div>
          </div>

          {/* 검색창 및 최신순/인기순 탭 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="법안명 또는 주요 내용 검색..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-100 p-1 rounded-xl dark:bg-slate-800">
              <button
                onClick={() => setSortBy("latest")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortBy === "latest"
                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                최신순
              </button>
              <button
                onClick={() => setSortBy("popular")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sortBy === "popular"
                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                최다 참여순
              </button>
            </div>
          </div>

          {/* 아카이브 카드 리스트 */}
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              투표 아카이브 데이터를 불러오는 중...
            </div>
          ) : filteredPolls.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPolls.map((item) => {
                const total = item.pro_cnt + item.con_cnt;
                const proRate = total > 0 ? Math.round((item.pro_cnt / total) * 100) : 50;
                const conRate = 100 - proRate;
                const isProWin = item.pro_cnt >= item.con_cnt;

                return (
                  <div
                    key={item.poll_id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-indigo-200 transition-all dark:border-slate-800 dark:bg-slate-900 space-y-4"
                  >
                    <div className="space-y-2.5">
                      {/* 상단 메타: 종료일 및 참여자 수 */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1 font-mono text-slate-400 text-[11px]">
                          <Calendar className="w-3 h-3" />
                          {item.poll_dd} 마감
                        </span>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px] font-bold dark:bg-slate-800 dark:text-slate-300">
                          <Flame className="w-3 h-3 text-amber-500" />
                          {total.toLocaleString()}명 참여
                        </span>
                      </div>

                      {/* 법안 명칭 */}
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
                        {item.poll_titl}
                      </h3>

                      {/* 요약 내용 */}
                      {item.smry_cnts && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {item.smry_cnts}
                        </p>
                      )}
                    </div>

                    {/* 투표 결과 게이지 바 */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          찬성 {proRate}% ({item.pro_cnt.toLocaleString()}표)
                        </span>
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          반대 {conRate}% ({item.con_cnt.toLocaleString()}표)
                        </span>
                      </div>

                      {/* 듀얼 프로그레스 바 */}
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 flex dark:bg-slate-800">
                        <div
                          style={{ width: `${proRate}%` }}
                          className="bg-indigo-600 transition-all duration-500"
                        />
                        <div
                          style={{ width: `${conRate}%` }}
                          className="bg-rose-500 transition-all duration-500"
                        />
                      </div>

                      {/* 카드 최하단: 우세 결과 요약 & 의안 원문 링크 */}
                      <div className="flex items-center justify-between pt-2 text-[11px]">
                        <span className="font-bold text-slate-500 dark:text-slate-400">
                          최종 결과:{" "}
                          <strong className={isProWin ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600 dark:text-rose-400"}>
                            {isProWin ? "찬성 우세" : "반대 우세"}
                          </strong>
                        </span>

                        {item.bill_id && (
                          <a
                            href={`https://likms.assembly.go.kr/bill/billDetail.do?billId=${item.bill_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors font-medium"
                          >
                            <span>의안 원문</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              {searchTerm ? "검색 조건에 맞는 투표 내역이 없습니다." : "마감된 투표 아카이브가 없습니다."}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}