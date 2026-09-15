"use client";

import { useEffect, useState } from "react";
import { BillRankingRow } from "@/types/ranking";
import AssembDetailDrawer from "@/components/AssembDetailDrawer";
import { MapPin, Navigation, MessageSquare, ChevronRight, UserCheck } from "lucide-react";

interface MyDistrictWidgetProps {
  allMembers: BillRankingRow[];
}

interface LatestFeedback {
  ncknm: string;
  fdbc_cnts: string;
  rgstdt: string;
}

const PARTY_COLORS: Record<string, string> = {
  더불어민주당: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300",
  국민의힘: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300",
  조국혁신당: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300",
  개혁신당: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300",
  진보당: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300",
  기본소득당: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300",
  사회민주당: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300",
  무소속: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300",
};

export default function MyDistrictWidget({ allMembers }: MyDistrictWidgetProps) {
  const [district, setDistrict] = useState<string | null>(null);
  const [member, setMember] = useState<BillRankingRow | null>(null);
  const [latestFeedback, setLatestFeedback] = useState<LatestFeedback | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const savedDistrict = localStorage.getItem("user_district");
    if (savedDistrict) {
      setDistrict(savedDistrict);
      matchMember(savedDistrict);
    }
  }, [allMembers]);

  const matchMember = (rgnName: string) => {
    const matched = allMembers.find((m) => m.rgn_nm && m.rgn_nm.includes(rgnName));
    if (matched) {
      setMember(matched);
      fetchLatestFeedback(matched.assemb_id);
    }
  };

  const fetchLatestFeedback = async (assembId: string) => {
    try {
      const res = await fetch(`/api/feedback?assemb_id=${assembId}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.feedbacks && data.feedbacks.length > 0) {
          setLatestFeedback(data.feedbacks[0]);
        }
      }
    } catch (err) {
      console.error("한마디 로드 실패:", err);
    }
  };

  const handleVerifyLocation = () => {
    if (!navigator.geolocation) {
      alert("브라우저가 위치 정보를 지원하지 않습니다.");
      return;
    }

    setIsVerifying(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/district/verify-location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          });

          const data = await res.json();
          if (data && data.district) {
            setDistrict(data.district);
            localStorage.setItem("user_district", data.district);
            matchMember(data.district);
          } else {
            alert("지역구를 찾을 수 없습니다. 다시 시도해 주세요.");
          }
        } catch (err) {
          console.error("위치 인증 실패:", err);
        } finally {
          setIsVerifying(false);
        }
      },
      () => {
        alert("위치 권한 허용이 필요합니다.");
        setIsVerifying(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="h-full flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all">
      
      {/* 1. 헤더 영역 */}
      <div>
        <div className="flex items-center justify-between pb-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
            <MapPin className="h-3.5 w-3.5" />
            <span>우리 동네 국회의원 & 주민 한마디</span>
          </div>

          <button
            onClick={handleVerifyLocation}
            disabled={isVerifying}
            className="group inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
          >
            <Navigation className={`h-3 w-3 ${isVerifying ? "animate-spin" : ""}`} />
            <span>{isVerifying ? "인증 중..." : district ? "재인증" : "1초 GPS 인증"}</span>
          </button>
        </div>

        {/* 2. 본문 내용 */}
        {member ? (
          <div className="mt-2 space-y-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {member.assemb_nm}
              </h3>
              <span className={`rounded-md px-2 py-0.5 text-xs font-bold border ${PARTY_COLORS[member.pltprt_nm] || "bg-slate-100 text-slate-600"}`}>
                {member.pltprt_nm}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {member.rgn_nm}
              </span>
            </div>

            {/* 최신 주민 한마디 말풍선 */}
            {latestFeedback ? (
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <UserCheck className="h-3 w-3 text-emerald-600" />
                    {latestFeedback.ncknm} (동네 인증 주민)
                  </span>
                  <span>{latestFeedback.rgstdt.slice(5, 10)}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed">
                  "{latestFeedback.fdbc_cnts}"
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs text-slate-400 dark:bg-slate-800/60 dark:border-slate-800">
                아직 등록된 동네 주민 한마디가 없습니다. 첫 한마디를 남겨보세요!
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                내 동네 국회의원을 확인해 보세요
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                GPS 1초 인증을 누르면 거주 지역구 의원의 실시간 성적표가 연결됩니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. 하단 액션 버튼 */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        {member ? (
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 font-bold text-xs sm:text-sm border border-emerald-200/80 transition-all cursor-pointer dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
          >
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              <span>동네 의원 상세 성적표 및 한마디 쓰기</span>
            </div>
            <ChevronRight className="h-4 w-4 text-emerald-600" />
          </button>
        ) : (
          <button
            onClick={handleVerifyLocation}
            disabled={isVerifying}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-emerald-500 dark:hover:text-white"
          >
            <Navigation className={`h-4 w-4 ${isVerifying ? "animate-spin" : ""}`} />
            <span>{isVerifying ? "동네 인증 중..." : "지금 바로 1초 동네 인증하기"}</span>
          </button>
        )}
      </div>

      {/* 모달 연동: 의정활동 상세 드로어 */}
      <AssembDetailDrawer
        assemb={member}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}