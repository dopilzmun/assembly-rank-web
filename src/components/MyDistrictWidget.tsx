"use client";

import { useEffect, useState } from "react";
import { BillRankingRow } from "@/types/ranking";
import AssembDetailDrawer from "@/components/AssembDetailDrawer";
import {
  MapPin,
  Navigation,
  MessageSquare,
  ChevronRight,
  UserCheck,
  Search,
  X,
} from "lucide-react";

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

  // 수동 지역구 선택 모달 상태
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const savedDistrict = localStorage.getItem("user_district");
    if (savedDistrict) {
      setDistrict(savedDistrict);
      matchMember(savedDistrict);
    }
  }, [allMembers]);

  const matchMember = (rgnName: string) => {
    // 1. 정확 매칭
    let matched = allMembers.find((m) => m.rgn_nm === rgnName);
    // 2. 부분 매칭
    if (!matched) {
      matched = allMembers.find(
        (m) => m.rgn_nm && (m.rgn_nm.includes(rgnName) || rgnName.includes(m.rgn_nm))
      );
    }
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

  // 1초 GPS 인증
  const handleVerifyLocation = () => {
    if (!navigator.geolocation) {
      alert("브라우저가 위치 정보를 지원하지 않습니다. 아래 [직접 선택]을 이용해 주세요.");
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
          if (res.ok && (data.district || data.rgn_nm)) {
            const targetDistrict = data.district || data.rgn_nm;
            setDistrict(targetDistrict);
            localStorage.setItem("user_district", targetDistrict);
            matchMember(targetDistrict);
          } else {
            alert(
              "현재 위치의 지역구를 특정하지 못했습니다. [지역구 직접 선택] 버튼으로 거주 동네를 선택해 주세요."
            );
            setIsSearchModalOpen(true);
          }
        } catch (err) {
          console.error("위치 인증 실패:", err);
          alert("위치 서버 통신 중 오류가 발생했습니다. 직접 선택을 이용해 주세요.");
        } finally {
          setIsVerifying(false);
        }
      },
      () => {
        alert("위치 권한이 차단되어 있습니다. [지역구 직접 선택]으로 설정해 주세요.");
        setIsVerifying(false);
        setIsSearchModalOpen(true);
      },
      { timeout: 10000 }
    );
  };

  // 수동 지역구 선택
  const handleSelectMember = (selected: BillRankingRow) => {
    if (selected.rgn_nm) {
      setDistrict(selected.rgn_nm);
      localStorage.setItem("user_district", selected.rgn_nm);
      setMember(selected);
      fetchLatestFeedback(selected.assemb_id);
    }
    setIsSearchModalOpen(false);
  };

  // 검색어 필터링
  const filteredMembers = allMembers
    .filter((m) => m.rgn_nm && m.rgn_nm !== "비례대표")
    .filter(
      (m) =>
        m.rgn_nm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.assemb_nm.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 8);

  return (
    <div className="h-full flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all">
      
      {/* 1. 헤더 영역 */}
      <div>
        <div className="flex items-center justify-between pb-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
            <MapPin className="h-3.5 w-3.5" />
            <span>우리 동네 국회의원 & 주민 한마디</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              직접 선택
            </button>
            <span className="text-slate-300 text-xs">|</span>
            <button
              onClick={handleVerifyLocation}
              disabled={isVerifying}
              className="group inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
            >
              <Navigation className={`h-3 w-3 ${isVerifying ? "animate-spin text-emerald-600" : ""}`} />
              <span>{isVerifying ? "인증 중..." : district ? "GPS 재인증" : "1초 GPS 인증"}</span>
            </button>
          </div>
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
                GPS 1초 인증 또는 [직접 선택]으로 거주 지역구를 설정하세요.
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
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleVerifyLocation}
              disabled={isVerifying}
              className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-emerald-500 dark:hover:text-white"
            >
              <Navigation className={`h-4 w-4 ${isVerifying ? "animate-spin" : ""}`} />
              <span>{isVerifying ? "인증 중..." : "1초 GPS 인증"}</span>
            </button>
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              <Search className="h-4 w-4 text-slate-500" />
              <span>지역구 직접 검색</span>
            </button>
          </div>
        )}
      </div>

      {/* 수동 지역구 검색/선택 모달 */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl space-y-4 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>내 지역구 직접 선택</span>
              </h3>
              <button
                onClick={() => setIsSearchModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 검색창 */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="지역구명 또는 국회의원 이름 (예: 종로, 분당, 홍길동)"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                autoFocus
              />
            </div>

            {/* 검색 결과 리스트 */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m) => (
                  <button
                    key={m.assemb_id}
                    onClick={() => handleSelectMember(m)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200 transition-colors text-left cursor-pointer dark:hover:bg-slate-800"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {m.assemb_nm}
                        </strong>
                        <span className="text-[11px] font-semibold text-slate-500">
                          ({m.pltprt_nm})
                        </span>
                      </div>
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        {m.rgn_nm}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 모달 연동: 의정활동 상세 드로어 */}
      <AssembDetailDrawer
        assemb={member}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}