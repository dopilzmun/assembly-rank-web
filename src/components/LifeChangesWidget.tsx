"use client";

import { useEffect, useState, useTransition } from "react";
import { Sparkles, Heart, Calendar } from "lucide-react";

interface LifeChangeItem {
  chng_seq: number;
  bill_id: string;
  chng_nm: string;
  ctgr_se: string;
  tgt_cnts: string;
  bfor_cnts: string;
  aftr_cnts: string;
  opertn_dd: string | null;
  opertn_se: string;
  symp_cnt: number;
  bill_nm: string;
  process_stat: string;
  assemb_nm: string | null;
  pltprt_nm: string | null;
}

const CATEGORIES = [
  { code: "ALL", label: "전체" },
  { code: "WORK", label: "직장/노동" },
  { code: "CARE", label: "육아/교육" },
  { code: "HOUSE", label: "주거/부동산" },
  { code: "TRAF", label: "교통/안전" },
  { code: "FIN", label: "금융/소비" },
  { code: "LIFE", label: "생활" },
];

export default function LifeChangesWidget() {
  const [selectedCtgr, setSelectedCtgr] = useState("ALL");
  const [items, setItems] = useState<LifeChangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedSeqs, setLikedSeqs] = useState<Set<number>>(new Set());
  const [, startTransition] = useTransition();

  const fetchChanges = async (ctgr: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/district/life-changes?ctgr_se=${ctgr}`);
      const data = await res.json();
      setItems(data.changes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges(selectedCtgr);
  }, [selectedCtgr]);

  const handleSympathy = async (chng_seq: number) => {
    if (likedSeqs.has(chng_seq)) return;

    setLikedSeqs((prev) => new Set(prev).add(chng_seq));
    setItems((prev) =>
      prev.map((item) =>
        item.chng_seq === chng_seq ? { ...item, symp_cnt: item.symp_cnt + 1 } : item
      )
    );

    try {
      await fetch("/api/district/life-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chng_seq }),
      });
    } catch (e) {
      console.error("공감 등록 실패", e);
    }
  };

  const getDDayText = (dateStr: string | null) => {
    if (!dateStr) return { badge: "시행일 미정", style: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { badge: `현재 시행 중 (${dateStr})`, style: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" };
    } else if (diffDays === 0) {
      return { badge: "오늘부터 시행!", style: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" };
    } else {
      return { badge: `D-${diffDays} 시행 예정 (${dateStr})`, style: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold" };
    }
  };

  return (
    <section className="my-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            생활 입법 Before & After
          </div>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            내 삶이 어떻게 바뀌나요?
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            정쟁 대신 내 지갑과 일상에 직접 적용되는 국회 본회의 통과 법률입니다.
          </p>
        </div>
      </div>

      {/* 카테고리 필터 탭 */}
      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((c) => (
          <button
            key={c.code}
            onClick={() => {
              startTransition(() => {
                setSelectedCtgr(c.code);
              });
            }}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedCtgr === c.code
                ? "bg-slate-900 text-white dark:bg-blue-600 dark:text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 카드 리스트 */}
      <div className="mt-4 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">법률 변경 사항을 불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">해당 분야의 최신 생활 가결 법안이 없습니다.</div>
        ) : (
          items.map((item) => {
            const dday = getDDayText(item.opertn_dd);
            const isLiked = likedSeqs.has(item.chng_seq);

            return (
              <div
                key={item.chng_seq}
                className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40"
              >
                {/* 상단 뱃지 */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {CATEGORIES.find((c) => c.code === item.ctgr_se)?.label || "생활"}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] ${dday.style}`}>
                      <Calendar className="h-3 w-3" />
                      {dday.badge}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    체감 대상: <strong className="text-slate-700 dark:text-slate-200">{item.tgt_cnts}</strong>
                  </span>
                </div>

                {/* 핵심 제목 */}
                <h3 className="mt-2.5 text-base font-bold text-slate-900 dark:text-slate-100">
                  {item.chng_nm}
                </h3>

                {/* Before vs After 대조 박스 */}
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700/60 dark:bg-slate-800">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <span>🛑</span> 개정 전 (Before)
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {item.bfor_cnts}
                    </p>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-900/50 dark:bg-blue-950/30">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                      <span>✅</span> 개정 후 달라지는 점 (After)
                    </div>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-blue-950 dark:text-blue-100">
                      {item.aftr_cnts}
                    </p>
                  </div>
                </div>

                {/* 근거 법안 및 공감 버튼 */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-3 text-xs text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate">근거: {item.bill_nm}</span>
                    {item.assemb_nm && (
                      <span className="shrink-0 font-medium text-slate-700 dark:text-slate-300">
                        (대표발의: {item.assemb_nm} {item.pltprt_nm ? `· ${item.pltprt_nm}` : ""})
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleSympathy(item.chng_seq)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors ${
                      isLiked
                        ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                        : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                    } border border-slate-200 dark:border-slate-600`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                    <span>내 삶에 도움돼요</span>
                    <span className="font-semibold">{item.symp_cnt}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}