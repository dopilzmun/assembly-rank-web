"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  Search,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Calendar,
  Users,
} from "lucide-react";

interface PollArchiveItem {
  poll_id: number;
  bill_id: string;
  title: string;
  summary: string;
  pro_cnt: number;
  con_cnt: number;
  total_cnt: number;
  pro_rate: number;
  con_rate: number;
  poll_date: string;
}

export default function PollArchivePage() {
  const [archives, setArchives] = useState<PollArchiveItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchArchives = (q = "") => {
    setIsLoading(true);
    fetch(`/api/poll/archive?q=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((data) => setArchives(data.archives || []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArchives(search);
  };

  return (
    <main className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>홈으로 돌아가기</span>
          </Link>
          <span className="text-xs text-slate-400 font-mono">
            총 {archives.length}건 마감 보관
          </span>
        </div>

        {/* 타이틀 및 검색 바 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                역대 쟁점 법안 시민 투표 아카이브
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                매일 자정 마감된 시민 여론 조사 결과와 법안 원문을 보존합니다.
              </p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="법안명, 쟁점 키워드 검색 (예: 음주운전, 플랫폼, 상속세)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </form>
        </div>

        {/* 아카이브 카드 리스트 */}
        {isLoading ? (
          <div className="py-20 text-center text-sm text-slate-400">
            아카이브 데이터를 불러오는 중...
          </div>
        ) : archives.length > 0 ? (
          <div className="space-y-4">
            {archives.map((item) => (
              <div
                key={item.poll_id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3.5"
              >
                {/* 메타 정보 */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 text-xs">
                  <div className="flex items-center gap-2 font-mono text-slate-500">
                    <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.poll_date} 투표
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {item.total_cnt.toLocaleString()}명 참여
                    </span>
                  </div>

                  {item.bill_id && !item.bill_id.startsWith("PRC_SAMPLE") && (
                    <a
                      href={`http://likms.assembly.go.kr/bill/billDetail.do?billId=${item.bill_id}&ageFrom=22&ageTo=22`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-600 font-medium transition-colors"
                    >
                      <span>원문 보기</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* 법안 타이틀 & 설명 */}
                <div className="space-y-1.5">
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    {item.summary}
                  </p>
                </div>

                {/* 최종 결과 게이지 */}
                <div className="space-y-2 pt-1 font-mono">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <ThumbsUp className="w-4 h-4" /> 찬성 {item.pro_rate}%
                      <span className="text-xs text-slate-400 font-normal">
                        ({item.pro_cnt.toLocaleString()}명)
                      </span>
                    </span>
                    <span className="text-rose-700 font-bold flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-normal">
                        ({item.con_cnt.toLocaleString()}명)
                      </span>
                      반대 {item.con_rate}% <ThumbsDown className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${item.pro_rate}%` }}
                      className="bg-emerald-500 h-full"
                    />
                    <div
                      style={{ width: `${item.con_rate}%` }}
                      className="bg-rose-400 h-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-400">
            마감 보관된 이전 쟁점 법안 투표가 없습니다.
          </div>
        )}
      </div>
    </main>
  );
}