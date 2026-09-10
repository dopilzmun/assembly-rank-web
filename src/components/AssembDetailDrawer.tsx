"use client";

import { useEffect, useState, useMemo } from "react";
import { BillRankingRow } from "@/types/ranking";
import { AssembBillListResponse } from "@/types/bill";
import RadarChart from "@/components/RadarChart";
import { calculateRadarStats } from "@/components/CompareModal";
import MemberEmotionStamps from "@/components/MemberEmotionStamps";
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
  ChevronDown,
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
  const [isCmitExpanded, setIsCmitExpanded] = useState(false);

  const committees = useMemo(() => {
    if (!assemb?.cmit_nm) return [];
    return assemb.cmit_nm
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .sort((a, b) => {
        const aIsSpecial = a.includes("특별위원회");
        const bIsSpecial = b.includes("특별위원회");
        if (aIsSpecial && !bIsSpecial) return 1;
        if (!aIsSpecial && bIsSpecial) return -1;
        return 0;
      });
  }, [assemb?.cmit_nm]);

  useEffect(() => {
    if (!assemb) return;
    setIsCmitExpanded(false);

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
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      } catch {}
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

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 md:pl-10">
        <div className="w-screen max-w-full md:max-w-xl bg-white shadow-2xl flex flex-col h-full">
          
          {/* 1. 드로어 헤더 */}
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50 space-y-3.5 shrink-0 overflow-y-auto max-h-[50vh] md:max-h-none">
            
            {/* 성명 & 뱃지 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <span className="text-xl sm:text-2xl font-bold text-slate-900 whitespace-nowrap">
                  {assemb.assemb_nm}
                </span>
                <span className="text-sm text-slate-500 font-medium shrink-0">의원</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-700 shadow-xs shrink-0 whitespace-nowrap">
                  {assemb.pltprt_nm}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline truncate">
                  {assemb.rgn_nm || "비례대표"}
                </span>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-white border-slate-200 text-slate-700 hover:text-indigo-600 shadow-xs transition-colors cursor-pointer"
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
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 상임위 알약 뱃지 + 카운트 태그 */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="shrink-0 text-slate-500 font-semibold">소속:</span>
                  
                  {committees.length > 0 ? (
                    <>
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100 truncate max-w-[200px] sm:max-w-[280px]">
                        {committees[0]}
                      </span>

                      {committees.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setIsCmitExpanded((prev) => !prev)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <span>{isCmitExpanded ? "접기" : `+${committees.length - 1}개`}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isCmitExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-400">상임위 미배정</span>
                  )}
                </div>

                <div className="text-slate-400 font-mono text-xs shrink-0">
                  등원일: {assemb.term_start_dd}
                </div>
              </div>

              {/* 토글 활성화 시 인라인 전체 위원회 박스 */}
              {isCmitExpanded && committees.length > 1 && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold border-b border-slate-100 pb-1.5">
                    <span>전체 소속 위원회 ({committees.length}개)</span>
                    <span>터치하여 접기</span>
                  </div>
                  <ul className="space-y-1.5 pt-0.5">
                    {committees.map((cmit, idx) => {
                      const isSpecial = cmit.includes("특별위원회");
                      return (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 mt-0.5 border ${
                              isSpecial
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200"
                            }`}
                          >
                            {isSpecial ? "특별위" : "상임위"}
                          </span>
                          <span className="text-slate-800 font-semibold break-keep">
                            {cmit}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* 유예 및 직무 특수 배너 */}
            {isDeferred ? (
              <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-slate-700 space-y-0.5">
                <div className="font-bold flex items-center gap-1.5 text-slate-900">
                  <ShieldAlert className="w-4 h-4 text-slate-600 shrink-0" /> 종합 평가 유예 대상
                </div>
                <p className="text-slate-500 text-xs">
                  등원 100일 미만으로 종합 점수 산정에서 유예되었습니다.
                </p>
              </div>
            ) : totalMotnCnt === 0 ? (
              <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-xs sm:text-sm text-amber-950 space-y-0.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" /> 직무 특수 대상
                </div>
                <p className="text-amber-800 text-xs">
                  의장단, 정당 지도부, 장관 겸직 등의 사유로 개별 발의가 발생하지 않았습니다.
                </p>
              </div>
            ) : null}

            {/* 시민 반응 스탬프 컴포넌트 */}
            <MemberEmotionStamps assembId={assemb.assemb_id} assembNm={assemb.assemb_nm} />

            {/* 핵심 지표 칩 (반응형 2열/3열 구조로 폰트 확대) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="col-span-2 sm:col-span-1 bg-indigo-50/90 p-2.5 rounded-xl border border-indigo-100 flex flex-col justify-center">
                <span className="text-indigo-600 block text-xs mb-0.5 font-bold">종합점수</span>
                <strong className="text-indigo-700 text-base sm:text-lg font-black font-mono">
                  {isDeferred || assemb.score === null ? "유예" : `${Number(assemb.score).toFixed(1)}점`}
                </strong>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-slate-500 block text-xs mb-0.5 font-medium">대표발의</span>
                <strong className="text-slate-900 text-sm sm:text-base font-bold font-mono block">
                  {totalMotnCnt}건
                </strong>
                <span className="text-xs text-slate-400 block font-mono">월 {monthlyPace}건</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-slate-500 block text-xs mb-0.5 font-medium">소속위 집중</span>
                <strong className="text-blue-700 text-sm sm:text-base font-bold font-mono block">
                  {Number(assemb.own_cmit_motn_rate) || 0}%
                </strong>
                <span className="text-xs text-slate-400 block font-mono">
                  {Number(assemb.own_cmit_motn_cnt) || 0}건
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-slate-500 block text-xs mb-0.5 font-medium">심사 상정률</span>
                <strong className="text-slate-800 text-sm sm:text-base font-bold font-mono block">
                  {Number(assemb.cmt_present_rate) || 0}%
                </strong>
                <span className="text-xs text-slate-400 block font-mono">
                  {Number(assemb.cmt_present_cnt) || 0}건
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-emerald-700 block text-xs mb-0.5 font-bold">본회의 실질가결</span>
                <strong className="text-emerald-600 text-sm sm:text-base font-bold font-mono block">
                  {Number(assemb.aprv_cnt) || 0}건
                </strong>
                <span className="text-xs text-slate-500 block font-sans">
                  원{pureAprvCnt} · 대{altAprvCnt}
                </span>
              </div>
            </div>

            {/* 6대 역량 육각형 레이더 차트 */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
              <div className="text-xs sm:text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-indigo-600" /> 6대 입법 역량 스탯 밸런스
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

          {/* 2. 탭 내비게이션 */}
          <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-white shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab("aprv")}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === "aprv"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              가결 및 실질반영
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-mono font-bold border border-emerald-200">
                {billData?.aprv_bills.length ?? 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("pending")}
              className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === "pending"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Clock className="w-4 h-4 text-indigo-600" />
              상임위 계류 / 대기
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-mono font-bold border border-indigo-200">
                {billData?.pending_bills.length ?? 0}
              </span>
            </button>
          </div>

          {/* 3. 법안 리스트 영역 */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/50">
            {isLoading ? (
              <div className="py-20 text-center text-slate-400 text-sm">
                법안 상세 내역을 불러오는 중...
              </div>
            ) : currentList && currentList.length > 0 ? (
              currentList.map((bill) => (
                <div
                  key={bill.bill_id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      {bill.curr_cmit_nm ? (
                        bill.is_own_cmit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                            <Bookmark className="w-3 h-3" /> 소속위 ({bill.curr_cmit_nm})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                            타상임위 ({bill.curr_cmit_nm})
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-400 border border-slate-200 whitespace-nowrap">
                          미배정
                        </span>
                      )}
                    </div>

                    <a
                      href={`http://likms.assembly.go.kr/bill/billDetail.do?billId=${bill.bill_id}&ageFrom=22&ageTo=22`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-indigo-600 p-1 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {bill.bill_nm}
                  </h4>

                  <div className="flex flex-wrap items-center gap-2 text-xs pt-1.5 border-t border-slate-100 text-slate-500 font-mono">
                    <span className="text-slate-400 whitespace-nowrap">발의: {bill.motn_dd}</span>

                    {activeTab === "aprv" ? (
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        {bill.process_stat?.includes("반영폐기") ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
                            <Sparkles className="w-3 h-3 text-sky-500" />
                            대안반영
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            {bill.process_stat}
                          </span>
                        )}
                        {bill.process_dd && <span className="text-slate-400">({bill.process_dd})</span>}
                      </div>
                    ) : (
                      <>
                        {bill.cmt_present_dd ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                            상정 ({bill.cmt_present_dd})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                            <AlertCircle className="w-3 h-3" />
                            미상정 대기
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-xs sm:text-sm text-slate-400">
                표시할 법안 내역이 없습니다.
              </div>
            )}
          </div>

          {/* 4. 드로어 푸터 */}
          <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center text-xs sm:text-sm shrink-0">
            {onOpenCompareWith ? (
              <button
                onClick={() => onOpenCompareWith(assemb)}
                className="px-3.5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                ⚔️ 1:1 맞비교
              </button>
            ) : (
              <span className="text-xs text-slate-400">국회 의안정보시스템 연동</span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}