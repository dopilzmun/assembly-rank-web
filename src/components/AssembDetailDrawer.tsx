"use client";

import { useEffect, useState } from "react";
import { BillRankingRow } from "@/types/ranking";
import DistrictFeedbackSection from "@/components/DistrictFeedbackSection";
import HexagonRadarChart from "@/components/HexagonRadarChart";
import {
  X,
  Award,
  FileText,
  Swords,
  ThumbsUp,
  Heart,
  Eye,
  AlertTriangle,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface AssembDetailDrawerProps {
  assemb: BillRankingRow | { assemb_id: string; [key: string]: any } | null;
  onClose: () => void;
  onOpenCompareWith?: (member: BillRankingRow) => void;
}

interface RecentBillItem {
  bill_id: string;
  bill_nm: string;
  curr_cmit_nm: string;
  motn_dd: string;
  process_stat: string | null;
  process_dd: string | null;
}

const PARTY_COLORS: Record<string, string> = {
  더불어민주당: "bg-blue-50 text-blue-700 border-blue-200",
  국민의힘: "bg-red-50 text-red-700 border-red-200",
  조국혁신당: "bg-sky-50 text-sky-700 border-sky-200",
  개혁신당: "bg-orange-50 text-orange-700 border-orange-200",
  진보당: "bg-purple-50 text-purple-700 border-purple-200",
  기본소득당: "bg-teal-50 text-teal-700 border-teal-200",
  사회민주당: "bg-yellow-50 text-yellow-800 border-yellow-200",
  무소속: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function AssembDetailDrawer({
  assemb,
  onClose,
  onOpenCompareWith,
}: AssembDetailDrawerProps) {
  const [fullMember, setFullMember] = useState<BillRankingRow | null>(null);
  const [recentBills, setRecentBills] = useState<RecentBillItem[]>([]);
  const [isLoadingBills, setIsLoadingBills] = useState(false);
  const [, setStampCounts] = useState({
    praise: 0,
    cheer: 0,
    watch: 0,
    critic: 0,
  });
  const [userStamp, setUserStamp] = useState<string | null>(null);

  // ESC 키로 닫기 & 스크롤 잠금
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (assemb) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [assemb, onClose]);

  // 의원 선택 시 전체 정보 및 최근 법안 목록 조회 (페르소나/랭킹 진입 데이터 불일치 원천 차단)
  useEffect(() => {
    if (!assemb || !assemb.assemb_id) {
      setFullMember(null);
      setRecentBills([]);
      return;
    }

    // 만약 전달받은 assemb 객체에 score 등 상세 지표가 누락되어 있다면 API로 온전한 데이터 조회
    if ("score" in assemb && assemb.score !== undefined) {
      setFullMember(assemb as BillRankingRow);
    } else {
      fetch(`/api/members/${assemb.assemb_id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && data.member) {
            setFullMember(data.member as BillRankingRow);
          } else {
            setFullMember(assemb as BillRankingRow);
          }
        })
        .catch(() => setFullMember(assemb as BillRankingRow));
    }

    setIsLoadingBills(true);
    fetch(`/api/bills?assemb_id=${assemb.assemb_id}&limit=5`)
      .then((res) => (res.ok ? res.json() : { bills: [] }))
      .then((data) => setRecentBills(data.bills || []))
      .catch((err) => console.error("법안 로드 실패:", err))
      .finally(() => setIsLoadingBills(false));

    // 로컬 스탬프 기록 복원
    const savedStamp = localStorage.getItem(`stamp_${assemb.assemb_id}`);
    setUserStamp(savedStamp);
  }, [assemb]);

  if (!assemb || !fullMember) return null;

  const isDeferred = fullMember.is_deferred === 1;
  const motnCnt = Number(fullMember.ttl_motn_cnt) || 0;
  const aprvCnt = Number(fullMember.aprv_cnt) || 0;
  const pureCnt = Number(fullMember.pure_aprv_cnt) || 0;
  const altCnt = Number(fullMember.alt_aprv_cnt) || 0;

  // 육각 상태도 정규화 점수 환산
  const normalizedPace = Math.min(100, Math.round((Number(fullMember.monthly_pace || 0) / 3.5) * 100));
  const normalizedAprvCnt = Math.min(100, Math.round((Number(fullMember.aprv_cnt || 0) / 5) * 100));
  const normalizedAprvRate = Math.min(100, Math.round(Number(fullMember.aprv_rate || 0) * 3));
  const normalizedCmtRate = Math.min(100, Math.round(Number(fullMember.cmt_present_rate || 0)));
  const avgDays = Number(fullMember.avg_cmt_days) || 120;
  const normalizedSpeed = Math.min(100, Math.max(15, Math.round(100 - (avgDays / 180) * 80)));
  const normalizedExpertise = Math.min(100, Math.round(Number(fullMember.own_cmit_motn_rate || 0)));

  // 감정 스탬프 누르기
  const handleStamp = async (type: "praise" | "cheer" | "watch" | "critic") => {
    if (userStamp) return;
    setUserStamp(type);
    localStorage.setItem(`stamp_${fullMember.assemb_id}`, type);
    setStampCounts((prev) => ({ ...prev, [type]: prev[type] + 1 }));

    try {
      await fetch("/api/stamps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assemb_id: fullMember.assemb_id, stamp_type: type }),
      });
    } catch (err) {
      console.error("스탬프 등록 실패:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 1. 배경 어두운 딤 (클릭 시 닫힘) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* 2. 우측 슬라이드 인 드로어 본체 */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 dark:bg-slate-900">
        
        {/* 드로어 상단 고정 헤더 */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900">
              제22대 국회
            </span>
            <span className="text-xs text-slate-400">의정활동 상세 성적표</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 드로어 스크롤 본문 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* A. 의원 프로필 카드 */}
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3.5 dark:bg-slate-800/50 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight dark:text-slate-100">
                    {fullMember.assemb_nm}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                      PARTY_COLORS[fullMember.pltprt_nm] || "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {fullMember.pltprt_nm}
                  </span>
                  {isDeferred && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      임기 100일 미만 유예
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium dark:text-slate-400">
                  {fullMember.rgn_nm || "비례대표"} · {fullMember.cmit_nm || "상임위 미배정"}
                </p>
              </div>

              {/* 종합 순위 및 점수 박스 */}
              <div className="text-right shrink-0 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-xs dark:bg-slate-900 dark:border-slate-700">
                <span className="text-xs text-slate-400 block font-sans font-semibold mb-0.5">
                  종합 평가
                </span>
                <strong className="text-xl sm:text-2xl font-black font-mono text-indigo-600 block leading-none dark:text-indigo-400">
                  {isDeferred || fullMember.score === null
                    ? "유예"
                    : `${Number(fullMember.score).toFixed(1)}점`}
                </strong>
                <span className="text-xs font-mono font-bold text-slate-500 block mt-1 dark:text-slate-400">
                  {fullMember.rnkg ? `전체 ${fullMember.rnkg}위` : "-"}
                </span>
              </div>
            </div>

            {/* 1:1 맞비교 대결 진입 버튼 */}
            {onOpenCompareWith && (
              <button
                onClick={() => onOpenCompareWith(fullMember)}
                className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Swords className="w-4 h-4 text-amber-300" />
                <span>다른 국회의원과 1:1 맞비교하기</span>
              </button>
            )}
          </div>

          {/* B. 육각 상태도 시각화 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center">
            <div className="flex items-center gap-1.5 self-start pb-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                6대 입법 역량 육각 상태도
              </h3>
            </div>
            <HexagonRadarChart
              metrics={{
                pace: normalizedPace,
                aprv_cnt: normalizedAprvCnt,
                aprv_rate: normalizedAprvRate,
                cmt_present: normalizedCmtRate,
                speed: normalizedSpeed,
                expertise: normalizedExpertise,
              }}
            />
          </div>

          {/* C. 6대 핵심 입법 지표 그리드 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-1.5 dark:text-slate-100">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>핵심 입법 성과 지표</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">가결 45 · 상정 35 · 발의 20</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 dark:bg-slate-900 dark:border-slate-800">
                <span className="text-xs text-slate-500 font-medium block">대표발의</span>
                <strong className="text-base sm:text-lg font-black font-mono text-slate-900 block dark:text-slate-100">
                  {motnCnt}건
                </strong>
                <span className="text-xs text-slate-400 font-mono block">
                  월 {Number(fullMember.monthly_pace || 0).toFixed(1)}건
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 dark:bg-slate-900 dark:border-slate-800">
                <span className="text-xs text-indigo-600 font-medium block">상임위 심사착수</span>
                <strong className="text-base sm:text-lg font-black font-mono text-indigo-700 block dark:text-indigo-400">
                  {Number(fullMember.cmt_present_rate) || 0}%
                </strong>
                <span className="text-xs text-slate-400 font-mono block">
                  총 {Number(fullMember.cmt_present_cnt) || 0}건
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 dark:bg-slate-900 dark:border-slate-800">
                <span className="text-xs text-emerald-700 font-bold block">본회의 실질가결</span>
                <strong className="text-base sm:text-lg font-black font-mono text-emerald-600 block dark:text-emerald-400">
                  {aprvCnt}건
                </strong>
                <span className="text-xs text-slate-500 font-mono block dark:text-slate-400">
                  원{pureCnt} · 대{altCnt}
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 dark:bg-slate-900 dark:border-slate-800">
                <span className="text-xs text-slate-500 font-medium block">실질가결률</span>
                <strong className="text-base sm:text-lg font-black font-mono text-slate-800 block dark:text-slate-200">
                  {Number(fullMember.aprv_rate) || 0}%
                </strong>
                <span className="text-xs text-slate-400 block font-mono">가결/발의</span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 dark:bg-slate-900 dark:border-slate-800">
                <span className="text-xs text-slate-500 font-medium block">소속위 집중도</span>
                <strong className="text-base sm:text-lg font-black font-mono text-blue-700 block dark:text-blue-400">
                  {Number(fullMember.own_cmit_motn_rate) || 0}%
                </strong>
                <span className="text-xs text-slate-400 font-mono block">
                  총 {Number(fullMember.own_cmit_motn_cnt) || 0}건
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 dark:bg-slate-900 dark:border-slate-800">
                <span className="text-xs text-slate-500 font-medium block">상정 소요일</span>
                <strong className="text-base sm:text-lg font-black font-mono text-slate-800 block dark:text-slate-200">
                  {Number(fullMember.avg_cmt_days) > 0 ? `${Number(fullMember.avg_cmt_days)}일` : "-"}
                </strong>
                <span className="text-xs text-slate-400 block font-mono">발의 후 상정까지</span>
              </div>
            </div>
          </div>

          {/* D. 최근 대표발의 법안 목록 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-1.5 dark:text-slate-100">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>최근 대표발의 법안</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">최신순</span>
            </div>

            <div className="space-y-2">
              {isLoadingBills ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  대표발의 법안을 불러오는 중...
                </div>
              ) : recentBills.length > 0 ? (
                recentBills.map((bill) => {
                  const isAprv =
                    bill.process_stat?.includes("가결") ||
                    bill.process_stat?.includes("반영폐기");

                  return (
                    <div
                      key={bill.bill_id}
                      className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 hover:border-indigo-200 transition-colors space-y-1 dark:bg-slate-800/40 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-500 font-sans dark:text-slate-400">
                          {bill.curr_cmit_nm || "상임위 미배정"}
                        </span>
                        <span
                          className={
                            isAprv
                              ? "text-emerald-700 font-bold dark:text-emerald-400"
                              : "text-slate-400"
                          }
                        >
                          {bill.process_stat
                            ? bill.process_stat.includes("반영폐기")
                              ? "대안반영 (병합 가결)"
                              : bill.process_stat
                            : `발의 (${bill.motn_dd})`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-xs sm:text-sm text-slate-800 truncate dark:text-slate-200">
                          {bill.bill_nm}
                        </p>
                        <a
                          href={`http://likms.assembly.go.kr/bill/billDetail.do?billId=${bill.bill_id}&ageFrom=22&ageTo=22`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-indigo-600 p-1 shrink-0"
                          title="의안 원문"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl dark:bg-slate-800/40">
                  등록된 대표발의 법안 내역이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* E. 시민 감정 스탬프 */}
          <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 space-y-3 dark:bg-slate-800/40 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                의원님께 감정 스탬프로 마음 전하기
              </span>
              <span className="text-[11px] text-slate-400 font-mono">1인 1회</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleStamp("praise")}
                disabled={Boolean(userStamp)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  userStamp === "praise"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                }`}
              >
                <ThumbsUp className="w-4 h-4 mb-1 text-emerald-600" />
                <span>칭찬해요</span>
              </button>

              <button
                onClick={() => handleStamp("cheer")}
                disabled={Boolean(userStamp)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  userStamp === "cheer"
                    ? "bg-pink-600 text-white border-pink-600 shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-pink-50 hover:border-pink-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                }`}
              >
                <Heart className="w-4 h-4 mb-1 text-pink-600" />
                <span>응원해요</span>
              </button>

              <button
                onClick={() => handleStamp("watch")}
                disabled={Boolean(userStamp)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  userStamp === "watch"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                }`}
              >
                <Eye className="w-4 h-4 mb-1 text-indigo-600" />
                <span>지켜봐요</span>
              </button>

              <button
                onClick={() => handleStamp("critic")}
                disabled={Boolean(userStamp)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  userStamp === "critic"
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-rose-50 hover:border-rose-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                }`}
              >
                <AlertTriangle className="w-4 h-4 mb-1 text-rose-600" />
                <span>분발해요</span>
              </button>
            </div>
          </div>

          {/* F. 우리 동네 의원실 한마디 */}
          <DistrictFeedbackSection
            assembId={fullMember.assemb_id}
            assembNm={fullMember.assemb_nm}
            rgnNm={fullMember.rgn_nm}
          />

        </div>
      </div>
    </div>
  );
}