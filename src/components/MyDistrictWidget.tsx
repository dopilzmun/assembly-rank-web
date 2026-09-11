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
} from "lucide-react";

interface MyDistrictWidgetProps {
  allMembers: BillRankingRow[];
  onSelectMember?: (member: BillRankingRow) => void;
}

export default function MyDistrictWidget({ allMembers, onSelectMember }: MyDistrictWidgetProps) {
  const [district, setDistrict] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [selectedMember, setSelectedMember] = useState<BillRankingRow | null>(null);

  // GPS 동네 인증 상태
  const [isVerified, setIsVerified] = useState(false);
  const [remainingDays, setRemainingDays] = useState<number>(30);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const router = useRouter();

  // 1. 초기 캐시 데이터 로드
  useEffect(() => {
    const savedDistrict = localStorage.getItem("my_district");
    if (savedDistrict) {
      setDistrict(savedDistrict);
      setInputVal(savedDistrict);
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

  // 2. 지역구 매칭 로직
  const matchedMembers = district
    ? allMembers.filter((m) => m.rgn_nm && m.rgn_nm.includes(district))
    : [];

  // 3. GPS 1초 동네 인증 실행
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
            // 후보 키워드 중 allMembers와 매칭되는 최적 지역구 탐색
            let targetMatch = district;
            if (data.local_keywords && data.local_keywords.length > 0) {
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

            // 로컬스토리지 저장 (피드백 보드와 100% 동기화)
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

  // 수동 저장 처리
  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const clean = inputVal.trim();
    setDistrict(clean);
    localStorage.setItem("my_district", clean);
    setIsEditing(false);
    setIsVerified(false); // 수동 입력 시 GPS 인증은 해제
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between space-y-4 h-full">
        
        {/* 1. 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  우리 동네 국회의원 의정활동
                </h3>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> 인증 주민 (D-{remainingDays})
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {district ? `등록 지역: ${district}` : "내 지역구 등록 및 주민 인증"}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsEditing((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <Settings2 className="w-4 h-4" />
            <span>{district ? "직접 변경" : "직접 입력"}</span>
          </button>
        </div>

        {/* 2. 본문 영역 */}
        <div className="flex-1 flex flex-col justify-center space-y-3">
          
          {/* GPS 1초 동네 인증 배너 */}
          {!isVerified ? (
            <div className="bg-gradient-to-r from-indigo-50/90 via-blue-50/60 to-slate-50 p-3 rounded-xl border border-indigo-100/80 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-indigo-950 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>GPS 1초 동네 인증</span>
                </div>
                <span className="text-[11px] text-indigo-500 font-medium">30일간 자격 유지</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-600 leading-tight">
                  현재 위치로 동네를 자동 감지하고 <strong>초록 인증 배지</strong>를 받으세요.
                </p>
                <button
                  onClick={handleGpsAuth}
                  disabled={isGpsLoading}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-lg text-xs shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-1"
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
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>'{district}'</strong> 정식 인증 주민입니다. 의원실 한마디에 인증 배지가 부여됩니다.
                </span>
              </div>
              <button
                onClick={handleGpsAuth}
                disabled={isGpsLoading}
                className="text-emerald-700 hover:underline font-bold text-[11px] shrink-0 cursor-pointer"
              >
                {isGpsLoading ? "확인 중..." : "위치 갱신"}
              </button>
            </div>
          )}

          {/* 상태 안내 토스트 */}
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

          {/* 직접 입력 폼 */}
          {(isEditing || !district) && (
            <form onSubmit={handleSaveManual} className="space-y-1.5 animate-in fade-in duration-150">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="지역명 검색 (예: 종로, 분당, 수지, 해운대, 전주)"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  저장
                </button>
              </div>
              <p className="text-[11px] text-slate-400 pl-1">
                * 직접 입력 시 '일반 유권자'로 설정됩니다.
              </p>
            </form>
          )}

          {/* 매칭된 의원 목록 */}
          {district && (
            <div className="space-y-2">
              {matchedMembers.length > 0 ? (
                matchedMembers.map((m) => (
                  <div
                    key={m.assemb_id}
                    onClick={() => handleMemberClick(m)}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/90 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-7 text-center font-mono font-bold text-indigo-600 text-sm shrink-0">
                        {m.rnkg ? `${m.rnkg}위` : "-"}
                      </span>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {m.assemb_nm}
                          </strong>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white border border-slate-200 text-slate-700">
                            {m.pltprt_nm}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 block truncate mt-0.5 max-w-[190px] sm:max-w-[260px]">
                          {m.rgn_nm} · {m.cmit_nm || "상임위 미배정"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono text-right pl-2">
                      <div>
                        <span className="text-sm font-black text-indigo-700 block">
                          {m.score ? `${Number(m.score).toFixed(1)}점` : "유예"}
                        </span>
                        <span className="text-xs text-emerald-700 font-bold block">
                          실질가결 {m.aprv_cnt}건
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs sm:text-sm text-slate-400 bg-slate-50 rounded-xl">
                  '{district}'에 매칭되는 지역구 의원이 없습니다. 지역명을 확인해주세요 (예: 마포, 해운대, 수원).
                </div>
              )}
            </div>
          )}

        </div>

        {/* 3. 하단 안내 바 */}
        <div className="shrink-0 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>* 의원 카드를 터치하면 상세 성적표가 열립니다.</span>
          <Link
            href="/rankings"
            className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-700 font-medium"
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