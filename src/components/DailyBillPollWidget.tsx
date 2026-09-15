"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Vote, ChevronRight, CheckCircle2, Flame } from "lucide-react";

interface PollData {
  poll_id: number;
  bill_id: string;
  poll_titl: string;
  smry_cnts: string;
  pro_cnt: number;
  con_cnt: number;
  poll_dd: string;
}

export default function DailyBillPollWidget() {
  const [poll, setPoll] = useState<PollData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [votedChoice, setVotedChoice] = useState<"pro" | "con" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/poll/daily")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.poll) {
          setPoll(data.poll);
          const savedVote = localStorage.getItem(`voted_poll_${data.poll.poll_id}`);
          if (savedVote === "pro" || savedVote === "con") {
            setVotedChoice(savedVote);
          }
        }
      })
      .catch((err) => console.error("일일 투표 로드 실패:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleVote = async (choice: "pro" | "con") => {
    if (!poll || votedChoice || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/poll/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poll_id: poll.poll_id, vote_choice: choice }),
      });

      if (res.ok) {
        setVotedChoice(choice);
        localStorage.setItem(`voted_poll_${poll.poll_id}`, choice);
        setPoll((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pro_cnt: choice === "pro" ? prev.pro_cnt + 1 : prev.pro_cnt,
            con_cnt: choice === "con" ? prev.con_cnt + 1 : prev.con_cnt,
          };
        });
      }
    } catch (err) {
      console.error("투표 등록 실패:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalVotes = poll ? poll.pro_cnt + poll.con_cnt : 0;
  const proPercent = totalVotes > 0 ? Math.round((poll!.pro_cnt / totalVotes) * 100) : 50;
  const conPercent = 100 - proPercent;

  return (
    <div className="h-full flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all">
      
      {/* 1. 헤더 영역 */}
      <div>
        <div className="flex items-center justify-between pb-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
            <Vote className="h-3.5 w-3.5" />
            <span>오늘의 쟁점 법안 1초 투표</span>
          </div>

          <Link
            href="/poll/archive"
            className="group inline-flex items-center gap-0.5 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <span>투표 아카이브</span>
            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 2. 본문 내용 */}
        {isLoading ? (
          <div className="py-10 text-center text-xs text-slate-400">
            오늘의 쟁점 법안을 불러오는 중...
          </div>
        ) : poll ? (
          <div className="mt-2 space-y-3">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug line-clamp-2">
              {poll.poll_titl}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              {poll.smry_cnts}
            </p>
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-slate-400">
            오늘 등록된 쟁점 법안이 없습니다.
          </div>
        )}
      </div>

      {/* 3. 액션 및 집계 게이지 */}
      {poll && (
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
          
          {/* 찬반 버튼 */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleVote("pro")}
              disabled={Boolean(votedChoice) || isSubmitting}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                votedChoice === "pro"
                  ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600 ring-offset-2"
                  : votedChoice
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800"
                  : "bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900"
              }`}
            >
              {votedChoice === "pro" && <CheckCircle2 className="h-4 w-4" />}
              <span>찬성해요 ({proPercent}%)</span>
            </button>

            <button
              onClick={() => handleVote("con")}
              disabled={Boolean(votedChoice) || isSubmitting}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                votedChoice === "con"
                  ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-600 ring-offset-2"
                  : votedChoice
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800"
                  : "bg-rose-50/70 text-rose-700 hover:bg-rose-100 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
              }`}
            >
              {votedChoice === "con" && <CheckCircle2 className="h-4 w-4" />}
              <span>반대해요 ({conPercent}%)</span>
            </button>
          </div>

          {/* 게이지 바 & 참여 현황 */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 flex dark:bg-slate-800">
              <div
                style={{ width: `${proPercent}%` }}
                className="bg-indigo-600 transition-all duration-500"
              />
              <div
                style={{ width: `${conPercent}%` }}
                className="bg-rose-500 transition-all duration-500"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1 font-sans">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                <span>총 <strong>{totalVotes.toLocaleString()}</strong>명 참여</span>
              </span>
              <span>{poll.poll_dd} 24:00 마감</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}