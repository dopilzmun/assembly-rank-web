"use client";

import { useState, useEffect } from "react";
import { Vote, CheckCircle2, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";

interface PollData {
  poll_id: number;
  title: string;
  summary: string;
  pro_cnt: number;
  con_cnt: number;
  total_cnt: number;
  pro_rate: number;
  con_rate: number;
}

export default function DailyBillPollWidget() {
  const [poll, setPoll] = useState<PollData | null>(null);
  const [userChoice, setUserChoice] = useState<"pro" | "con" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/poll/daily")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.poll) {
          setPoll(data.poll);
          const savedVote = localStorage.getItem(`bill_poll_${data.poll.poll_id}`);
          if (savedVote === "pro" || savedVote === "con") {
            setUserChoice(savedVote);
          }
        }
      })
      .catch((err) => console.error("투표 데이터 로드 실패:", err));
  }, []);

  const handleVote = async (choice: "pro" | "con") => {
    if (!poll || userChoice || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/poll/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poll_id: poll.poll_id, choice }),
      });

      if (res.ok) {
        const updated = await res.json();
        setUserChoice(choice);
        localStorage.setItem(`bill_poll_${poll.poll_id}`, choice);
        setPoll((prev) =>
          prev
            ? {
                ...prev,
                pro_cnt: updated.pro_cnt,
                con_cnt: updated.con_cnt,
                total_cnt: updated.total_cnt,
                pro_rate: updated.pro_rate,
                con_rate: updated.con_rate,
              }
            : null
        );
      }
    } catch (err) {
      console.error("투표 실패:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!poll) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-indigo-700/50 space-y-3.5 relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            <Vote className="w-4 h-4 text-amber-400 animate-pulse" />
          </span>
          <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
            오늘의 쟁점 법안 1초 투표
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30">
              로그인 없이 참여
            </span>
          </span>
        </div>
        <span className="text-[11px] font-mono text-indigo-300/80">
          총 <strong>{poll.total_cnt.toLocaleString()}명</strong> 참여
        </span>
      </div>

      {/* 법안 안건 타이틀 및 설명 */}
      <div>
        <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-snug">
          {poll.title}
        </h3>
        <p className="text-xs text-indigo-200/80 mt-1 break-keep leading-relaxed">
          {poll.summary}
        </p>
      </div>

      {/* 투표 선택지 or 결과 게이지 바 */}
      {userChoice ? (
        <div className="space-y-2 pt-1 animate-in fade-in duration-300">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-emerald-400 flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" /> 찬성 {poll.pro_rate}% ({poll.pro_cnt}명)
              {userChoice === "pro" && <span className="text-[10px] text-white font-sans ml-1">(내 투표)</span>}
            </span>
            <span className="text-rose-400 flex items-center gap-1">
              {userChoice === "con" && <span className="text-[10px] text-white font-sans mr-1">(내 투표)</span>}
              반대 {poll.con_rate}% ({poll.con_cnt}명) <ThumbsDown className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-white/10">
            <div
              style={{ width: `${poll.pro_rate}%` }}
              className="bg-emerald-500 h-full rounded-l-full transition-all duration-700"
            />
            <div
              style={{ width: `${poll.con_rate}%` }}
              className="bg-rose-500 h-full rounded-r-full transition-all duration-700"
            />
          </div>

          <div className="flex items-center justify-center gap-1 text-[11px] text-indigo-300/70 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>투표가 성공적으로 집계되었습니다. 내일 새로운 법안이 등록됩니다.</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => handleVote("pro")}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] rounded-xl text-xs font-bold text-white transition-all shadow-md"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>찬성합니다</span>
          </button>
          <button
            onClick={() => handleVote("con")}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] rounded-xl text-xs font-bold text-white transition-all shadow-md"
          >
            <ThumbsDown className="w-4 h-4" />
            <span>반대합니다</span>
          </button>
        </div>
      )}
    </div>
  );
}