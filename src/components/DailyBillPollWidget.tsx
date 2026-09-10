"use client";

import { useState, useEffect } from "react";
import { Vote, CheckCircle2, ThumbsUp, ThumbsDown, ShieldCheck } from "lucide-react";

interface PollData {
  poll_id: number;
  title: string;
  summary: string;
  pro_cnt: number;
  con_cnt: number;
  total_cnt: number;
  pro_rate: number;
  con_rate: number;
  poll_date: string;
  has_voted?: boolean;
  user_choice?: "pro" | "con" | null;
}

export default function DailyBillPollWidget() {
  const [poll, setPoll] = useState<PollData | null>(null);
  const [userChoice, setUserChoice] = useState<"pro" | "con" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/poll/daily")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.poll) {
          setPoll(data.poll);
          
          // 서버에서 판정된 투표 기록 우선 적용, 없으면 localStorage 확인
          if (data.poll.has_voted && data.poll.user_choice) {
            setUserChoice(data.poll.user_choice);
            localStorage.setItem(`bill_poll_${data.poll.poll_id}`, data.poll.user_choice);
          } else {
            const savedVote = localStorage.getItem(`bill_poll_${data.poll.poll_id}`);
            if (savedVote === "pro" || savedVote === "con") {
              setUserChoice(savedVote);
            }
          }
        }
      })
      .catch((err) => console.error("투표 데이터 로드 실패:", err));
  }, []);

  const handleVote = async (choice: "pro" | "con") => {
    if (!poll || userChoice || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

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
                has_voted: true,
                user_choice: choice,
              }
            : null
        );
      } else if (res.status === 409) {
        // 이미 서버 로그에 투표 기록이 있는 경우
        setErrorMsg("이미 본 투표에 참여하셨습니다.");
        setUserChoice(choice);
      } else {
        setErrorMsg("투표 반영 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } catch (err) {
      console.error("투표 실패:", err);
      setErrorMsg("네트워크 연결을 확인해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!poll) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between space-y-4">
      
      {/* 1. 헤더 */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Vote className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                오늘의 쟁점 법안 1초 투표
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                진행중
              </span>
            </div>
            <span className="text-xs text-slate-400">
              로그인 없이 바로 참여하는 1인 1표 시민 여론
            </span>
          </div>
        </div>
        <span className="text-xs sm:text-sm font-mono text-slate-500">
          총 <strong className="text-slate-800 font-bold">{poll.total_cnt.toLocaleString()}명</strong>
        </span>
      </div>

      {/* 2. 법안 안건 타이틀 및 설명 */}
      <div className="space-y-2">
        <h4 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
          {poll.title}
        </h4>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-keep bg-slate-50/90 p-3.5 rounded-xl border border-slate-100 font-normal">
          {poll.summary}
        </p>
      </div>

      {/* 3. 투표 선택지 or 결과 게이지 바 */}
      {userChoice ? (
        <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs sm:text-sm font-mono">
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <ThumbsUp className="w-4 h-4" /> 찬성 {poll.pro_rate}%
              <span className="text-xs font-normal text-slate-500">({poll.pro_cnt.toLocaleString()}명)</span>
              {userChoice === "pro" && (
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-sans font-bold">
                  내 투표
                </span>
              )}
            </span>
            <span className="text-rose-700 font-bold flex items-center gap-1.5">
              {userChoice === "con" && (
                <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-sans font-bold">
                  내 투표
                </span>
              )}
              <span className="text-xs font-normal text-slate-500">({poll.con_cnt.toLocaleString()}명)</span>
              반대 {poll.con_rate}% <ThumbsDown className="w-4 h-4" />
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${poll.pro_rate}%` }}
              className="bg-emerald-500 h-full transition-all duration-700"
            />
            <div
              style={{ width: `${poll.con_rate}%` }}
              className="bg-rose-400 h-full transition-all duration-700"
            />
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>투표가 안전하게 집계되었습니다. 매일 자정 새로운 쟁점 법안이 등록됩니다.</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleVote("pro")}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 hover:bg-emerald-100/80 active:scale-[0.99] border border-emerald-200 rounded-xl text-sm font-bold text-emerald-800 transition-all shadow-xs cursor-pointer min-h-[44px]"
            >
              <ThumbsUp className="w-4 h-4 text-emerald-600" />
              <span>찬성합니다</span>
            </button>
            <button
              onClick={() => handleVote("con")}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-rose-50 hover:bg-rose-100/80 active:scale-[0.99] border border-rose-200 rounded-xl text-sm font-bold text-rose-800 transition-all shadow-xs cursor-pointer min-h-[44px]"
            >
              <ThumbsDown className="w-4 h-4 text-rose-600" />
              <span>반대합니다</span>
            </button>
          </div>
          {errorMsg && (
            <p className="text-xs text-rose-600 text-center font-medium">{errorMsg}</p>
          )}
        </div>
      )}

    </div>
  );
}