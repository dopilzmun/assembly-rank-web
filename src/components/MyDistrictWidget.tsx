"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BillRankingRow } from "@/types/ranking";
import AssembDetailDrawer from "@/components/AssembDetailDrawer";
import {
  MapPin,
  Settings2,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RotateCw,
  Search,
  MessageSquareQuote,
} from "lucide-react";

interface MyDistrictWidgetProps {
  allMembers: BillRankingRow[];
  onSelectMember?: (member: BillRankingRow) => void;
}

// 상단 인터페이스 정의
interface FeedbackSummary {
  fdbk_sn: number;
  nck_nm: string;
  fdbk_se: "praise" | "suggest" | "question" | "critic";
  fdbk_cn: string;
  vrfc_yn: number;
  reg_dt: string;
  // 호환용
  feedback_id?: number;
  nickname?: string;
  category?: "praise" | "suggest" | "question" | "critic";
  content?: string;
  is_verified?: number;
  created_at?: string;
}

const CATEGORY_META = {
  praise: { label: "응원", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  suggest: { label: "건의", color: "bg-blue-50 text-blue-700 border-blue-200" },
  question: { label: "질문", color: "bg-amber-50 text-amber-700 border-amber-200" },
  critic: { label: "분발", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default function MyDistrictWidget({ allMembers, onSelectMember }: MyDistrictWidgetProps) {
  const [district, setDistrict] = useState<string>("");
  const [selectedAssembId, setSelectedAssembId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [selectedMember, setSelectedMember] = useState<BillRankingRow | null>(null);

  // GPS 동네 인증 상태
  const [isVerified, setIsVerified] = useState(false);
  const [remainingDays, setRemainingDays] = useState<number>(30);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 최신 한마디 피드 상태
  const [latestFeedback, setLatestFeedback] = useState<FeedbackSummary | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  const router = useRouter();

  // 1. 초기 캐시 데이터 로드
  useEffect(() => {
    const savedDistrict = localStorage.getItem("my_district");
    const savedAssembId = localStorage.getItem("my_selected_assemb_id");

    if (savedDistrict) {
      setDistrict(savedDistrict);
      setInputVal(savedDistrict);
    }
    if (savedAssembId) {
      setSelectedAssembId(savedAssembId);
    }

    const cachedAuth = localStorage.getItem("district_gps_verified");
    if (cachedAuth) {
      try {
        const parsed = JSON.parse(cachedAuth);
        if (parsed.expires_at > Date.now()) {
          setIsVerified(true);
          const days = Math.max(1, Math.ceil((parsed.expires_at - Date.now()) / (1000 * 60 * 60 * 24)));
          setRemainingDays(days);
          if (!savedDistrict && parsed.district) {
            setDistrict(parsed.district);
            setInputVal(parsed.district);
          }
        } else {
          localStorage.removeItem("district_gps_verified");
        }
      } catch (e) {
        localStorage.removeItem("district_gps_verified");
      }
    }
  }, []);

  // 2. 지역구 매칭 로직 (시/군/구 키워드로 매칭되는 모든 의원 탐색)
  const baseKeyword = district.replace(/(갑|을|병|정|무|지역구)$/, "").trim();
  const matchedMembers = district
    ? allMembers.filter((m) => m.rgn_nm && (m.rgn_nm.includes(district) || (baseKeyword && m.rgn_nm.includes(baseKeyword))))
    : [];

  // 현재 화면에 집중 노출할 단독 의원 결정
  const activeMember =
    matchedMembers.find((m) => m.assemb_id === selectedAssembId) ||
    matchedMembers.find((m) => m.rgn_nm?.includes(district)) ||
    matchedMembers[0] ||
    null;

  // 3. 선택된 의원의 최신 피드백 1건 비동기 조회
  useEffect(() => {
    if (!activeMember) {
      setLatestFeedback(null);
      return;
    }

    setIsLoadingFeedback(true);
    fetch(`/api/feedback?assemb_id=${activeMember.assemb_id}&verified_only=false`)
      .then((res) => (res.ok ? res.json() : { feedbacks: [] }))
      .then((data) => {
        if (data.feedbacks && data.feedbacks.length > 0) {
          setLatestFeedback(data.feedbacks[0]);
        } else {
          setLatestFeedback(null);
        }
      })
      .catch((err) => console.error("최신 피드 로드 실패:", err))
      .finally(() => setIsLoadingFeedback(false));
  }, [activeMember?.assemb_id]);

  // 4. GPS 1초 동네 인증 실행
  const handleGpsAuth = () => {
    if (!navigator.geolocation) {
      setStatusMsg({ type: "error", text: "브라우저가 위치 정보를 지원하지 않습니다." });
      return;
    }

    setIsGpsLoading(true);
    setStatusMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/district/verify-location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              target_district: district || undefined,
            }),
          });

          const data = await res.json();
          if (data.verified) {
            let targetMatch = district;
            if (!targetMatch && data.local_keywords && data.local_keywords.length > 0) {
              for (const kw of data.local_keywords) {
                const found = allMembers.find((m) => m.rgn_nm?.includes(kw));
                if (found) {
                  targetMatch = kw;
                  break;
                }
              }
            }
            if (!targetMatch) targetMatch = data.district;

            setDistrict(targetMatch);
            setInputVal(targetMatch);
            setIsVerified(true);
            setRemainingDays(30);
            setIsEditing(false);

            localStorage.setItem("my_district", targetMatch);
            localStorage.setItem(
              "district_gps_verified",
              JSON.stringify({ district: targetMatch, expires_at: data.expires_at })
            );

            setStatusMsg({
              type: "success",
              text: `'${targetMatch}' 주민 인증 완료! 30일간 인증 배지가 유지됩니다.`,
            });
          } else {
            setStatusMsg({ type: "error", text: data.message || "위치 인증에 실패했습니다." });
          }
        } catch (e) {
          setStatusMsg({ type: "error", text: "위치 인증 처리 중 오류가 발생했습니다." });
        } finally {
          setIsGpsLoading(false);
        }
      },
      () => {
        setIsGpsLoading(false);
        setStatusMsg({ type: "error", text: "위치 권한을 허용해 주셔야 1초 동네 인증이 가능합니다." });
      },
      { timeout: 10000 }
    );
  };

  // 세부 선거구(갑, 을, 병, 정) 칩 선택 처리
  const handleSelectSubDistrict = (m: BillRankingRow) => {
    setSelectedAssembId(m.assemb_id);
    localStorage.setItem("my_selected_assemb_id", m.assemb_id);

    // 상세 선거구명(예: '용인시병')을 district로 갱신 (GPS 인증 상태 유지)
    if (m.rgn_nm) {
      const cleanRgn = m.rgn_nm.replace(/^(경기|서울|인천|부산|대구|광주|대전|울산|세종|강원|충북|충남|전북|전남|경북|경남|제주)\s*/, "");
      setDistrict(cleanRgn);
      setInputVal(cleanRgn);
      localStorage.setItem("my_district", cleanRgn);

      // 인증 캐시의 district 이름도 갱신하여 일치 보장
      const cached = localStorage.getItem("district_gps_verified");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          parsed.district = cleanRgn;
          localStorage.setItem("district_gps_verified", JSON.stringify(parsed));
        } catch (e) {}
      }
    }
  };

  // 수동 직접 입력 처리
  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const clean = inputVal.trim();
    setDistrict(clean);
    localStorage.setItem("my_district", clean);
    setIsEditing(false);

    // 기존 GPS 인증 도시와 일치하면 인증을 유지, 아예 다른 도시일 경우만 해제
    const cached = localStorage.getItem("district_gps_verified");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const prevBase = (parsed.district || "").replace(/(갑|을|병|정|무|시|구|군)$/, "");
        if (clean.includes(prevBase)) {
          parsed.district = clean;
          localStorage.setItem("district_gps_verified", JSON.stringify(parsed));
          setIsVerified(true);
          return;
        }
      } catch (e) {}
    }

    setIsVerified(false);
    localStorage.removeItem("district_gps_verified");
  };

  const handleMemberClick = (member: BillRankingRow) => {
    if (onSelectMember) {
      onSelectMember(member);
    } else {
      setSelectedMember(member);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between space-y-3.5 h-full">
        
        {/* ================= 1. 모바일 줄바꿈 방지 헤더 ================= */}
        <div className="border-b border-slate-100 pb-3 shrink-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 whitespace-nowrap truncate">
                우리 동네 국회의원 의정활동
              </h3>
            </div>

            <button
              onClick={() => setIsEditing((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer shrink-0 whitespace-nowrap pl-1"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{district ? "직접 변경" : "직접 입력"}</span>
            </button>
          </div>

          {/* 서브 라인: 등록 지역명 + 인증 배지 (절대 잘리지 않는 배치) */}
          <div className="flex items-center gap-2 pl-9 flex-wrap text-xs">
            <span className="text-slate-500 font-medium whitespace-nowrap">
              {district ? `등록: ${district}` : "지역구 미등록"}
            </span>
            {isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shrink-0">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>인증 주민 (D-{remainingDays})</span>
              </span>
            )}
          </div>
        </div>

        {/* ================= 2. 본문 영역 ================= */}
        <div className="flex-1 flex flex-col justify-center space-y-3">
          
          {/* GPS 1초 동네 인증 배너 */}
          {!isVerified ? (
            <div className="bg-gradient-to-r from-indigo-50/90 via-blue-50/60 to-slate-50 p-3 rounded-xl border border-indigo-100/80 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-indigo-950 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="whitespace-nowrap">GPS 1초 동네 인증</span>
                </div>
                <span className="text-[11px] text-indigo-500 font-medium whitespace-nowrap">30일간 자격 유지</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-600 leading-tight">
                  현재 위치로 동네를 감지하고 <strong>초록 인증 배지</strong>를 받으세요.
                </p>
                <button
                  onClick={handleGpsAuth}
                  disabled={isGpsLoading}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-lg text-xs shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-1 whitespace-nowrap"
                >
                  {isGpsLoading ? (
                    <>
                      <RotateCw className="w-3 h-3 animate-spin" />
                      <span>확인 중...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>1초 인증</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-900 gap-2">
              <div className="flex items-center gap-2 truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">
                  <strong>'{district}'</strong> 정식 인증 주민입니다. (의원실 피드에 배지 적용)
                </span>
              </div>
              <button
                onClick={handleGpsAuth}
                disabled={isGpsLoading}
                className="text-emerald-700 hover:underline font-bold text-[11px] shrink-0 cursor-pointer whitespace-nowrap"
              >
                {isGpsLoading ? "확인 중..." : "위치 갱신"}
              </button>
            </div>
          )}

          {/* 상태 메시지 토스트 */}
          {statusMsg && (
            <p
              className={`text-xs px-2.5 py-1 rounded-lg ${
                statusMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-600 border border-rose-200"
              }`}
            >
              {statusMsg.text}
            </p>
          )}

          {/* 직접 입력 검색 폼 */}
          {(isEditing || !district) && (
            <form onSubmit={handleSaveManual} className="space-y-1.5 animate-in fade-in duration-150">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="지역명 검색 (예: 용인시병, 종로, 분당, 해운대)"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  저장
                </button>
              </div>
              <p className="text-[11px] text-slate-400 pl-1">
                * 상세 지역구(예: 용인시병, 분당갑)를 직접 입력하셔도 GPS 인증이 유지됩니다.
              </p>
            </form>
          )}

          {/* 매칭된 의원 영역 */}
          {district && (
            <div className="space-y-2.5">
              {matchedMembers.length > 0 ? (
                <>
                  {/* 복수 선거구(갑, 을, 병, 정) 서브 칩 탭 */}
                  {matchedMembers.length > 1 && (
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">
                        * '{baseKeyword || district}' 내 세부 지역구를 선택하세요:
                      </span>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                        {matchedMembers.map((m) => {
                          const isCurrent = activeMember?.assemb_id === m.assemb_id;
                          const shortRgn = (m.rgn_nm || "").replace(/^.*?\s/, "");

                          return (
                            <button
                              key={m.assemb_id}
                              type="button"
                              onClick={() => handleSelectSubDistrict(m)}
                              className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                                isCurrent
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                              }`}
                            >
                              {shortRgn} ({m.assemb_nm})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 선택된 의원 성적표 카드 */}
                  {activeMember && (
                    <div
                      onClick={() => handleMemberClick(activeMember)}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/90 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-7 text-center font-mono font-bold text-indigo-600 text-sm shrink-0">
                          {activeMember.rnkg ? `${activeMember.rnkg}위` : "-"}
                        </span>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
                              {activeMember.assemb_nm}
                            </strong>
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white border border-slate-200 text-slate-700 whitespace-nowrap">
                              {activeMember.pltprt_nm}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 block truncate mt-0.5 max-w-[190px] sm:max-w-[260px]">
                            {activeMember.rgn_nm} · {activeMember.cmit_nm || "상임위 미배정"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 font-mono text-right pl-2">
                        <div>
                          <span className="text-sm font-black text-indigo-700 block whitespace-nowrap">
                            {activeMember.score ? `${Number(activeMember.score).toFixed(1)}점` : "유예"}
                          </span>
                          <span className="text-xs text-emerald-700 font-bold block whitespace-nowrap">
                            실질가결 {activeMember.aprv_cnt}건
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  )}

                  {/* 최신 동네 한마디 말풍선 미니 피드 */}
                  {activeMember && (
                    <div className="pt-0.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 px-0.5">
                        <span className="font-bold text-slate-700 flex items-center gap-1 whitespace-nowrap">
                          <MessageSquareQuote className="w-3.5 h-3.5 text-indigo-600" />
                          <span>'{activeMember.assemb_nm}' 의원실 주민 한마디</span>
                        </span>
                        <span className="text-slate-400 text-[10px] whitespace-nowrap">터치 시 피드로 이동</span>
                      </div>

                      {isLoadingFeedback ? (
                        <div className="bg-slate-50/70 rounded-xl p-2.5 text-center text-xs text-slate-400">
                          한마디를 불러오는 중...
                        </div>
                      ) : latestFeedback ? (
                        <div
                          onClick={() => handleMemberClick(activeMember)}
                          className="bg-indigo-50/40 hover:bg-indigo-50/80 border border-indigo-100/90 rounded-xl p-2.5 transition-all cursor-pointer group space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${CATEGORY_META[latestFeedback.category].color}`}>
                                {CATEGORY_META[latestFeedback.category].label}
                              </span>
                              <span className="font-bold text-slate-800 text-[11px] whitespace-nowrap">{latestFeedback.nickname}</span>
                              {latestFeedback.is_verified === 1 ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap">
                                  <ShieldCheck className="w-2.5 h-2.5" /> 인증 주민
                                </span>
                              ) : (
                                <span className="px-1 text-[10px] text-slate-400 whitespace-nowrap">일반</span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">{latestFeedback.created_at}</span>
                          </div>

                          <p className="text-xs text-slate-700 leading-snug break-keep line-clamp-2 font-normal group-hover:text-indigo-950 transition-colors">
                            "{latestFeedback.content}"
                          </p>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleMemberClick(activeMember)}
                          className="bg-slate-50/80 hover:bg-indigo-50/50 border border-dashed border-slate-200 rounded-xl p-2.5 text-center text-xs text-slate-400 transition-colors cursor-pointer group"
                        >
                          <span>아직 등록된 한마디가 없습니다. </span>
                          <strong className="text-indigo-600 font-bold group-hover:underline">첫 의견을 남겨보세요! ✨</strong>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center text-xs sm:text-sm text-slate-400 bg-slate-50 rounded-xl">
                  '{district}'에 매칭되는 지역구 의원이 없습니다. 지역명을 확인해주세요 (예: 용인시병, 마포, 해운대).
                </div>
              )}
            </div>
          )}

        </div>

        {/* ================= 3. 하단 안내 바 ================= */}
        <div className="shrink-0 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span className="whitespace-nowrap">* 의원 카드를 터치하면 상세 성적표 열람</span>
          <Link
            href="/rankings"
            className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
          >
            <span>전체 순위</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>

      <AssembDetailDrawer
        assemb={selectedMember}
        onClose={() => setSelectedMember(null)}
        onOpenCompareWith={(m) => {
          setSelectedMember(null);
          router.push(`/rankings?member=${m.assemb_id}`);
        }}
      />
    </>
  );
}