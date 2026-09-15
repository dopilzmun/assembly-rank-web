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
  BarChart3,
  MessageSquare,
  ChevronRight,
  Info,
} from "lucide-react";

interface AssembDetailDrawerProps {
  assemb: BillRankingRow | null;
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

type TabType = "overview" | "bills" | "community";

const PARTY_COLORS: Record<string, string> = {
  더불어민주당: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
  국민의힘: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900",
  조국혁신당: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900",
  개혁신당: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-900",
  진보당: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900",
  기본소득당: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900",
  사회민주당: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-900",
  무소속: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

export default function AssembDetailDrawer({
  assemb,
  onClose,
  onOpenCompareWith,
}: AssembDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [recentBills, setRecentBills] = useState<RecentBillItem[]>([]);
  const [isLoadingBills, setIsLoadingBills] = useState(false);
  const [, setStampCounts] = useState({
    praise: 0,
    cheer: 0,
    watch: 0,
    critic: 0,
  });
  const [userStamp, setUserStamp] = useState<string | null>(null);

  // ESC 키로 닫기 & 배경 스크롤 잠금
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

  // 의원 변경 시 상태 초기화 및 법안 조회
  useEffect(() => {
    if (!assemb) {
      setRecentBills([]);
      setActiveTab("overview");
      return;
    }

    setIsLoadingBills(true);
    fetch(`/api/assemblies/${assemb.assemb_id}/bills?limit=5`)
      .then((res) => (res.ok ? res.json() : { bills: [] }))
      .then((data) => setRecentBills(data.bills || []))
      .catch((err) => console.error("법안 로드 실패:", err))
      .finally(() => setIsLoadingBills(false));

    // 로컬 스탬프 기록 복원
    const savedStamp = localStorage.getItem(`stamp_${assemb.assemb_id}`);
    setUserStamp(savedStamp);
  }, [assemb]);

  if (!assemb) return null;

  const isDeferred = assemb.is_deferred === 1;
  const motnCnt = Number(assemb.ttl_motn_cnt) || 0;
  const aprvCnt = Number(assemb.aprv_cnt) || 0;
  const pureCnt = Number(assemb.pure_aprv_cnt) || 0;
  const altCnt = Number(assemb.alt_aprv_cnt) || 0;

  // 육각 상태도 정규화 점수 환산
  const normalizedPace = Math.min(100, Math.round((Number(assemb.monthly_pace || 0) / 3.5) * 100));
  const normalizedAprvCnt = Math.min(100, Math.round((Number(assemb.aprv_cnt || 0) / 5) * 100));
  const normalizedAprvRate = Math.min(100, Math.round(Number(assemb.aprv_rate || 0) * 3));
  const normalizedCmtRate = Math.min(100, Math.round(Number(assemb.cmt_present_rate || 0)));
  const avgDays = Number(assemb.avg_cmt_days) || 120;
  const normalizedSpeed = Math.min(100, Math.max(15, Math.round(100 - (avgDays / 180) * 80)));
  const normalizedExpertise = Math.min(100, Math.round(Number(assemb.own_cmit_motn_rate || 0)));

  // 감정 스탬프 누르기
  const handleStamp = async (type: "praise" | "cheer" | "watch" | "critic") => {
    if (userStamp) return;
    setUserStamp(type);
    localStorage.setItem(`stamp_${assemb.assemb_id}`, type);
    setStampCounts((prev) => ({ ...prev, [type]: prev[type] + 1 }));

    try {
      await fetch(`/api/assemblies/${assemb.assemb_id}/stamp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stamp_type: type }),
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
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* 2. 우측 슬라이드 인 드로어 본체 */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 dark:bg-slate-900">
        
        {/* 드로어 상단 고정 헤더 */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900">
              제22대 국회
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              의정활동 상세 성적표
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="닫기 (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 상단 프로필 카드 (고정 뷰) */}
        <div className="p-4 sm:p-5 bg-slate-50/90 border-b border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-800 shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight dark:text-slate-100">
                  {assemb.assemb_nm}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-bold border ${
                    PARTY_COLORS[assemb.pltprt_nm] || "bg-gray-50 text-gray-700 border-gray-200"
                  }`}
                >
                  {assemb.pltprt_nm}
                </span>
                {isDeferred && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    임기 유예
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium dark:text-slate-400">
                {assemb.rgn_nm || "비례대표"} · {assemb.cmit_nm || "상임위 미배정"}
              </p>
            </div>

            {/* 종합 순위 및 점수 박스 */}
            <div className="text-right shrink-0 bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-700 min-w-[84px]">
              <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">
                종합 평가
              </span>
              <strong className="text-lg sm:text-xl font-black font-mono text-indigo-600 block leading-none dark:text-indigo-400">
                {isDeferred || assemb.score === null
                  ? "유예"
                  : `${Number(assemb.score).toFixed(1)}점`}
              </strong>
              <span className="text-[10px] font-mono font-bold text-slate-500 block mt-1 dark:text-slate-400">
                {assemb.rnkg ? `전체 ${assemb.rnkg}위` : "-"}
              </span>
            </div>
          </div>

          {/* 1:1 맞비교 대결 진입 버튼 */}
          {onOpenCompareWith && (
            <button
              onClick={() => onOpenCompareWith(assemb)}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Swords className="w-3.5 h-3.5 text-amber-300" />
              <span>다른 국회의원과 1:1 맞비교하기</span>
            </button>
          )}
        </div>

        {/* 3대 네비게이션 서브 탭 바 (모바일 친화적 탭 UI) */}
        <div className="flex border-b border-slate-200 bg-white shrink-0 px-2 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-3 px-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>입법 역량·지표</span>
          </button>

          <button
            onClick={() => setActiveTab("bills")}
            className={`flex-1 py-3 px-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "bills"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>대표발의 법안</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {recentBills.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("community")}
            className={`flex-1 py-3 px-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "community"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>시민 민심·한마디</span>
          </button>
        </div>

        {/* 드로어 스크롤 본문 (선택된 탭에 따라 컨텐츠 렌더링) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* =========================================================
              탭 1. 입법 역량·지표 (Overview)
              ========================================================= */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 육각 상태도 시각화 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center">
                <div className="flex items-center justify-between w-full pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      6대 입법 역량 육각 상태도
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">100점 만점 기준</span>
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

              {/* 6대 핵심 입법 성과 지표 그리드 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5 dark:text-slate-100">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span>핵심 입법 성과 6대 세부 지표</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">가결45·상정35·발의20</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 shadow-xs space-y-1 dark:bg-slate-800/40 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 font-medium block">대표발의</span>
                    <strong className="text-base font-black font-mono text-slate-900 block dark:text-slate-100">
                      {motnCnt}건
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      월 {Number(assemb.monthly_pace || 0).toFixed(1)}건
                    </span>
                  </div>

                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 shadow-xs space-y-1 dark:bg-indigo-950/30 dark:border-indigo-900">
                    <span className="text-[11px] text-indigo-600 font-semibold block">상임위 심사착수</span>
                    <strong className="text-base font-black font-mono text-indigo-700 block dark:text-indigo-400">
                      {Number(assemb.cmt_present_rate) || 0}%
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      총 {Number(assemb.cmt_present_cnt) || 0}건
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 shadow-xs space-y-1 dark:bg-emerald-950/30 dark:border-emerald-900">
                    <span className="text-[11px] text-emerald-700 font-bold block">본회의 실질가결</span>
                    <strong className="text-base font-black font-mono text-emerald-600 block dark:text-emerald-400">
                      {aprvCnt}건
                    </strong>
                    <span className="text-[10px] text-slate-500 font-mono block dark:text-slate-400">
                      원{pureCnt} · 대{altCnt}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 shadow-xs space-y-1 dark:bg-slate-800/40 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 font-medium block">실질가결률</span>
                    <strong className="text-base font-black font-mono text-slate-800 block dark:text-slate-200">
                      {Number(assemb.aprv_rate) || 0}%
                    </strong>
                    <span className="text-[10px] text-slate-400 block font-mono">가결/발의</span>
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 shadow-xs space-y-1 dark:bg-slate-800/40 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 font-medium block">소속위 집중도</span>
                    <strong className="text-base font-black font-mono text-blue-700 block dark:text-blue-400">
                      {Number(assemb.own_cmit_motn_rate) || 0}%
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      총 {Number(assemb.own_cmit_motn_cnt) || 0}건
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 shadow-xs space-y-1 dark:bg-slate-800/40 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 font-medium block">상정 소요일</span>
                    <strong className="text-base font-black font-mono text-slate-800 block dark:text-slate-200">
                      {Number(assemb.avg_cmt_days) > 0 ? `${Number(assemb.avg_cmt_days)}일` : "-"}
                    </strong>
                    <span className="text-[10px] text-slate-400 block font-mono">발의 후 상정까지</span>
                  </div>
                </div>
              </div>

              {/* 산식 요약 알림 배너 */}
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs text-slate-500 dark:bg-slate-800/40 dark:border-slate-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  본 점수는 단순 발의량 위주의 왜곡을 방지하기 위해 <strong>본회의 실질가결(45점) + 상임위 심사착수(35점) + 발의규모(20점)</strong>의 엄격한 가중치로 종합 산출되었습니다.
                </p>
              </div>
            </div>
          )}

          {/* =========================================================
              탭 2. 대표발의 법안 목록 (Bills)
              ========================================================= */}
          {activeTab === "bills" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>최근 대표발의 법안 (최신순 5건)</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">제22대 국회 공식</span>
              </div>

              <div className="space-y-2.5">
                {isLoadingBills ? (
                  <div className="py-12 text-center text-xs text-slate-400">
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
                        className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 hover:border-indigo-200 transition-colors space-y-2 dark:bg-slate-800/40 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-500 font-sans font-semibold dark:text-slate-400">
                            {bill.curr_cmit_nm || "소관위 미배정"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isAprv
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {bill.process_stat
                              ? bill.process_stat.includes("반영폐기")
                                ? "대안반영 가결"
                                : bill.process_stat
                              : `발의 (${bill.motn_dd})`}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold text-xs sm:text-sm text-slate-800 leading-snug dark:text-slate-200">
                            {bill.bill_nm}
                          </p>
                          <a
                            href={`https://likms.assembly.go.kr/bill/billDetail.do?billId=${bill.bill_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-indigo-600 p-1 shrink-0 rounded-lg hover:bg-white transition-all dark:hover:bg-slate-800"
                            title="의안 원문 확인"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                          <span>발의일: {bill.motn_dd}</span>
                          {bill.process_dd && <span>처리일: {bill.process_dd}</span>}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-xl dark:bg-slate-800/40">
                    등록된 대표발의 법안 내역이 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              탭 3. 시민 민심·한마디 (Community)
              ========================================================= */}
          {activeTab === "community" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 시민 감정 스탬프 (칭찬, 응원, 감시, 분발) */}
              <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 space-y-3 dark:bg-slate-800/40 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    의원님께 감정 스탬프로 마음 전하기
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">1인 1회 참여</span>
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

              {/* 우리 동네 의원실 한마디 게시판 */}
              <DistrictFeedbackSection
                assembId={assemb.assemb_id}
                assembNm={assemb.assemb_nm}
                rgnNm={assemb.rgn_nm}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}