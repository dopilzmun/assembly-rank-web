"use client";

import { useEffect, useState } from "react";
import { BillRankingRow } from "@/types/ranking";
import { BillDetailRow, AssembBillListResponse } from "@/types/bill";
import RadarChart from "@/components/RadarChart";
import { calculateRadarStats } from "@/components/CompareModal";
import {
  X,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Bookmark,
  Layers,
  Info,
  ShieldAlert,
  BarChart2,
  Sparkles,
  Share2,
  Check,
} from "lucide-react";

interface AssembDetailDrawerProps {
  assemb: BillRankingRow | null;
  onClose: () => void;
  onOpenCompareWith?: (assemb: BillRankingRow) => void;
}

export default function AssembDetailDrawer({
  assemb,
  onClose,
  onOpenCompareWith,
}: AssembDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"aprv" | "pending">("aprv");
  const [billData, setBillData] = useState<AssembBillListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!assemb) return;

    const fetchBills = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/assemblies/${assemb.assemb_id}/bills`);
        if (res.ok) {
          const data: AssembBillListResponse = await res.json();
          setBillData(data);
          if (data.aprv_bills.length === 0 && data.pending_bills.length > 0) {
            setActiveTab("pending");
          } else {
            setActiveTab("aprv");
          }
        }
      } catch (err) {
        console.error("의원 상세 법안 로드 실패:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBills();
  }, [assemb]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!assemb) return null;

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?member=${assemb.assemb_id}`;
    const shareTitle = `[입법 모니터] ${assemb.assemb_nm} 의원 (${assemb.pltprt_nm}) 입법 성적표`;
    const shareText = `${assemb.assemb_nm} 의원의 대표발의 ${assemb.ttl_motn_cnt}건, 본회의 실질가결 ${assemb.aprv_cnt}건 성적표와 6대 역량 지표를 확인해보세요.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // 취소 시 무시
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
    }
  };

  const currentList = activeTab === "aprv" ? billData?.aprv_bills : billData?.pending_bills;
  const isDeferred = assemb.is_deferred === 1;
  const totalMotnCnt = Number(assemb.ttl_motn_cnt) || 0;
  const monthlyPace = Number(assemb.monthly_pace || 0).toFixed(1);
  const pureAprvCnt = Number(assemb.pure_aprv_cnt) || 0;
  const altAprvCnt = Number(assemb.alt_aprv_cnt) || 0;
  const radarStats = calculateRadarStats(assemb);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* 모바일에서는 패딩 없이 전체 화면, PC에서는 우측 max-w-xl 고정 */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 md:pl-10">
        <div className="w-screen max-w-full md:max-w-xl bg-white shadow-2xl flex flex-col h-full">
          
          {/* 1. 드로어 헤더 */}
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50 space-y-3 sm:space-y-4 shrink-0 overflow-y-auto max-h-[45vh] md:max-h-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <span className="text-lg sm:text-xl font-bold text-slate-900">{assemb.assemb_nm}</span>
                <span className="text-xs sm:text-sm text-slate-500 font-medium">의원</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm">
                  {assemb.pltprt_nm}
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">{assemb.rgn_nm || "비례대표"}</span>
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-white border-slate-200 text-slate-600 hover:text-indigo-600 shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">복사됨</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>공유</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 의원 소속 상임위 & 등원일 */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>상임위:</span>
                <strong className="text-slate-800 font-medium truncate max-w-[200px]">
                  {assemb.cmit_nm || "미배정"}
                </strong>
              </div>
              <div className="text-slate-400 font-mono text-[11px]">등원일: {assemb.term_start_dd}</div>
            </div>

            {/* 유예 및 직무 특수 배너 */}
            {isDeferred ? (
              <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 text-xs text-slate-700 space-y-0.5">
                <div className="font-semibold flex items-center gap-1.5 text-slate-900">
                  <ShieldAlert className="w-4 h-4 text-slate-600 shrink-0" /> 종합 평가 유예 대상
                </div>
                <p className="text-slate-500 text-[11px]">
                  등원 100일 미만으로 종합 점수 산정에서 유예되었습니다.
                </p>
              </div>
            ) : totalMotnCnt === 0 ? (
              <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-950 space-y-0.5">
                <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" /> 직무 특수 대상
                </div>
                <p className="text-amber-800 text-[11px]">
                  의장단, 원내대표단, 장관 겸직 등의 사유로 개별 발의가 발생하지 않았습니다.
                </p>
              </div>
            ) : null}

            {/* 핵심 지표 5분할 칩 (모바일 글자 크기 최적화) */}
            <div className="grid grid-cols-5 gap-1 text-center text-xs">
              <div className="bg-indigo-50/80 p-1.5 sm:p-2 rounded-lg border border-indigo-100 flex flex-col justify-center">
                <span className="text-indigo-600 block text-[9px] sm:text-[10px] mb-0.5 font-semibold">종합점수</span>
                <strong className="text-indigo-700 text-[11px] sm:text-xs font-black font-mono">
                  {isDeferred || assemb.score === null ? "유예" : `${Number(assemb.score).toFixed(1)}`}
                </strong>
              </div>
              <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-slate-400 block text-[9px] sm:text-[10px] mb-0.5">대표발의</span>
                <strong className="text-slate-800 text-[11px] sm:text-xs font-mono">{totalMotnCnt}건</strong>
                <span className="text-[8px] sm:text-[9px] text-slate-400 block font-mono">월 {monthlyPace}</span>
              </div>
              <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-slate-400 block text-[9px] sm:text-[10px] mb-0.5">상임위집중</span>
                <strong className="text-blue-600 text-[11px] sm:text-xs font-mono">{Number(assemb.own_cmit_motn_rate) || 0}%</strong>
              </div>
              <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-slate-400 block text-[9px] sm:text-[10px] mb-0.5">상정률</span>
                <strong className="text-slate-700 text-[11px] sm:text-xs font-mono">{Number(assemb.cmt_present_rate) || 0}%</strong>
              </div>
              <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-slate-400 block text-[9px] sm:text-[10px] mb-0.5">실질가결</span>
                <strong className="text-emerald-600 text-[11px] sm:text-xs font-mono">{Number(assemb.aprv_cnt) || 0}건</strong>
                <span className="text-[8px] sm:text-[9px] text-slate-400 block font-mono">
                  원{pureAprvCnt}·대{altAprvCnt}
                </span>
              </div>
            </div>

            {/* 6대 역량 육각형 레이더 차트 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
              <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-0.5 flex items-center gap-1">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-600" /> 6대 입법 역량 스탯 밸런스
              </div>
              <RadarChart
                size={210}
                data1={{
                  label: assemb.assemb_nm,
                  color: "#4f46e5",
                  fillColor: "rgba(79, 70, 229, 0.2)",
                  stats: radarStats,
                }}
              />
            </div>
          </div>

          {/* 2. 탭 내비게이션 (가로 스크롤 허용) */}
          <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-white shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab("aprv")}
              className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === "aprv"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              가결 및 실질반영
              <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-mono border border-emerald-200">
                {billData?.aprv_bills.length ?? 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("pending")}
              className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === "pending"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              상임위 계류 / 대기
              <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-mono border border-indigo-200">
                {billData?.pending_bills.length ?? 0}
              </span>
            </button>
          </div>

          {/* 3. 법안 리스트 영역 */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 bg-slate-50/50">
            {isLoading ? (
              <div className="py-20 text-center text-slate-400 text-xs sm:text-sm">
                법안 상세 내역을 불러오는 중...
              </div>
            ) : currentList && currentList.length > 0 ? (
              currentList.map((bill) => (
                <div
                  key={bill.bill_id}
                  className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {bill.curr_cmit_nm ? (
                        bill.is_own_cmit ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Bookmark className="w-2.5 h-2.5" /> 소속위 ({bill.curr_cmit_nm})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            타상임위 ({bill.curr_cmit_nm})
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-400 border border-slate-200">
                          미배정
                        </span>
                      )}
                    </div>

                    <a
                      href={`http://likms.assembly.go.kr/bill/billDetail.do?billId=${bill.bill_id}&ageFrom=22&ageTo=22`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-indigo-600 p-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                    {bill.bill_nm}
                  </h4>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1 border-t border-slate-100 text-slate-500">
                    <span className="font-mono text-slate-400">발의: {bill.motn_dd}</span>

                    {activeTab === "aprv" ? (
                      <div className="flex items-center gap-1 font-mono">
                        {bill.process_stat?.includes("반영폐기") ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            <Sparkles className="w-2.5 h-2.5 text-sky-500" />
                            대안반영(실질가결)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {bill.process_stat}
                          </span>
                        )}
                        {bill.process_dd && <span className="text-slate-400 text-[10px]">({bill.process_dd})</span>}
                      </div>
                    ) : (
                      <>
                        {bill.cmt_present_dd ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                            상정 ({bill.cmt_present_dd})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="w-2.5 h-2.5" />
                            미상정 대기
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-xs text-slate-400">
                표시할 법안 내역이 없습니다.
              </div>
            )}
          </div>

          {/* 4. 드로어 푸터 */}
          <div className="p-3 sm:p-4 border-t border-slate-200 bg-white flex justify-between items-center text-xs shrink-0">
            {onOpenCompareWith ? (
              <button
                onClick={() => onOpenCompareWith(assemb)}
                className="px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-semibold flex items-center gap-1"
              >
                ⚔️ 1:1 맞비교
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">국회 의안정보시스템 연동</span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
            >
              닫기
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}