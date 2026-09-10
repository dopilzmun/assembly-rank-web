"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, Heart, Eye, Flame } from "lucide-react";

interface MemberEmotionStampsProps {
  assembId: string;
  assembNm: string;
}

const STAMP_CONFIG = [
  { type: "praise", label: "열일 응원", emoji: "👍", icon: ThumbsUp, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { type: "cheer", label: "법안 훌륭", emoji: "👏", icon: Heart, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { type: "watch", label: "매의눈 감시", emoji: "👀", icon: Eye, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { type: "encourage", label: "분발하세요", emoji: "🔥", icon: Flame, color: "text-rose-600 bg-rose-50 border-rose-200" },
];

export default function MemberEmotionStamps({ assembId, assembNm }: MemberEmotionStampsProps) {
  const [stamps, setStamps] = useState<Record<string, number>>({
    praise: 0,
    cheer: 0,
    watch: 0,
    encourage: 0,
  });
  const [myStamp, setMyStamp] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/assemblies/${assembId}/stamp`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.stamps) setStamps(data.stamps);
      })
      .catch(() => {});

    const saved = localStorage.getItem(`stamp_${assembId}`);
    if (saved) setMyStamp(saved);
  }, [assembId]);

  const handleStamp = async (type: string) => {
    if (myStamp) return;

    setMyStamp(type);
    localStorage.setItem(`stamp_${assembId}`, type);
    setStamps((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }));

    try {
      await fetch(`/api/assemblies/${assembId}/stamp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stamp_type: type }),
      });
    } catch (err) {
      console.error("스탬프 반영 실패:", err);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-700">
          💬 {assembNm} 의원 시민 반응 스탬프
        </span>
        <span className="text-[10px] text-slate-400">
          {myStamp ? "참여 완료" : "1초 선택"}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {STAMP_CONFIG.map((c) => {
          const count = stamps[c.type] || 0;
          const isSelected = myStamp === c.type;

          return (
            <button
              key={c.type}
              onClick={() => handleStamp(c.type)}
              disabled={Boolean(myStamp)}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-700 shadow-sm scale-105"
                  : myStamp
                  ? "bg-white text-slate-400 border-slate-200 opacity-60"
                  : "bg-white hover:border-indigo-300 active:scale-95 text-slate-700 border-slate-200"
              }`}
            >
              <span className="text-base mb-0.5">{c.emoji}</span>
              <span className={`text-[10px] font-semibold whitespace-nowrap ${isSelected ? "text-white" : "text-slate-600"}`}>
                {c.label}
              </span>
              <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? "text-indigo-100 font-bold" : "text-slate-400"}`}>
                {count.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}