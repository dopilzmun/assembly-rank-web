"use client";

import { useEffect, useState } from "react";
import { Sparkles, Heart, ArrowRight, Calendar, ExternalLink, Tag } from "lucide-react";

interface LifeChangeItem {
  chng_seq: number;
  bill_id: string;
  chng_nm: string;
  ctgr_se: string;
  tgt_cnts: string;
  bfor_cnts: string;
  aftr_cnts: string;
  opertn_dd: string | null;
  opertn_se: string | null;
  symp_cnt: number;
}

const CATEGORIES = [
  { key: "ALL", label: "전체" },
  { key: "직장/노동", label: "직장·노동" },
  { key: "주거/부동산", label: "주거·부동산" },
  { key: "육아/교육", label: "육아·교육" },
  { key: "청년/취업", label: "청년·취업" },
  { key: "복지/시니어", label: "복지·시니어" },
];

export default function LifeChangesWidget() {
  const [changes, setChanges] = useState<LifeChangeItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setIsLoading(true);
    const url =
      selectedCategory === "ALL"
        ? "/api/district/life-changes"
        : `/api/district/life-changes?ctgr_se=${encodeURIComponent(selectedCategory)}`;

    fetch(url)
      .then((res) => (res.ok ? res.json() : { changes: [] }))
      .then((data) => setChanges(data.changes || []))
      .catch((err) => console.error("생활변화 법안 로드 실패:", err))
      .finally(() => setIsLoading(false));
  }, [selectedCategory]);

  const handleLike = async (chngSeq: number) => {
    if (likedMap[chngSeq]) return;

    setLikedMap((prev) => ({ ...prev, [chngSeq]: true }));
    setChanges((prev) =>
      prev.map((c) => (c.chng_seq === chngSeq ? { ...c, symp_cnt: c.symp_cnt + 1 } : c))
    );

    try {
      await fetch("/api/district/life-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chng_seq: chngSeq }),
      });
    } catch (err) {
      console.error("공감 등록 실패:", err);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all space-y-6">
      
      {/* 1. 상단 바 및 카테고리 필터 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>생활 입법 Before & After</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
              실질 가결안
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            본회의를 통과하여 실제 내 삶에 적용되는 법안들의 핵심 변화 내용입니다.
          </p>
        </div>

        {/* 카테고리 탭 버튼 리스트 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat.key
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Before & After 카드 목록 */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          생활 입법 변화 데이터를 불러오는 중...
        </div>
      ) : changes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {changes.map((item) => (
            <div
              key={item.chng_seq}
              className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-5 hover:border-indigo-200 transition-all dark:border-slate-800 dark:bg-slate-800/40"
            >
              <div className="space-y-3.5">
                {/* 카드 상단: 분류, 대상, 시행일 */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[11px]">
                      {item.ctgr_se}
                    </span>
                    {item.tgt_cnts && (
                      <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {item.tgt_cnts}
                      </span>
                    )}
                  </div>
                  {item.opertn_dd && (
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {item.opertn_dd} 시행
                    </span>
                  )}
                </div>

                {/* 법안 명칭 */}
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
                  {item.chng_nm}
                </h4>

                {/* Before vs After 비교 박스 */}
                <div className="space-y-2 pt-1">
                  {/* Before */}
                  <div className="rounded-lg bg-white p-2.5 border border-slate-200/70 dark:bg-slate-900/60 dark:border-slate-800 text-xs flex items-start gap-2">
                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] dark:bg-rose-950 dark:text-rose-300">
                      기존
                    </span>
                    <p className="text-slate-500 line-through dark:text-slate-400 leading-relaxed">
                      {item.bfor_cnts}
                    </p>
                  </div>

                  {/* After */}
                  <div className="rounded-lg bg-emerald-50/60 p-2.5 border border-emerald-200/70 dark:bg-emerald-950/30 dark:border-emerald-900 text-xs flex items-start gap-2">
                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                      변경
                    </span>
                    <p className="text-emerald-900 font-semibold dark:text-emerald-200 leading-relaxed">
                      {item.aftr_cnts}
                    </p>
                  </div>
                </div>
              </div>

              {/* 카드 하단: 공감 버튼 & 원문 링크 */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleLike(item.chng_seq)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    likedMap[item.chng_seq]
                      ? "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      likedMap[item.chng_seq] ? "fill-rose-600 text-rose-600" : ""
                    }`}
                  />
                  <span>공감돼요 {item.symp_cnt}</span>
                </button>

                <a
                  href={`http://likms.assembly.go.kr/bill/billDetail.do?billId=${item.bill_id}&ageFrom=22&ageTo=22`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors font-medium text-[11px]"
                >
                  <span>의안 원문 확인</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-slate-400">
          선택하신 분야에 등록된 생활 입법 변경 내역이 없습니다.
        </div>
      )}

    </div>
  );
}