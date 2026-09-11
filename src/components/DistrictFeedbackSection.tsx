"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  ShieldCheck,
  MapPin,
  Send,
  Trash2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface FeedbackItem {
  feedback_id: number;
  assemb_id: string;
  district_nm: string;
  nickname: string;
  category: "praise" | "suggest" | "question" | "critic";
  content: string;
  is_verified: number;
  like_cnt: number;
  created_at: string;
}

interface DistrictFeedbackSectionProps {
  assembId: string;
  assembNm: string;
  rgnNm: string | null;
}

const CATEGORY_META = {
  praise: { label: "응원", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  suggest: { label: "건의", color: "bg-blue-50 text-blue-700 border-blue-200" },
  question: { label: "질문", color: "bg-amber-50 text-amber-700 border-amber-200" },
  critic: { label: "분발", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default function DistrictFeedbackSection({ assembId, assembNm, rgnNm }: DistrictFeedbackSectionProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // 동네 인증 상태 관리 (localStorage 30일 보존)
  const [isGpsVerified, setIsGpsVerified] = useState(false);
  const [verifiedDistrict, setVerifiedDistrict] = useState<string>("");
  const [isVerifyingGps, setIsVerifyingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // 작성 폼 상태
  const [nickname, setNickname] = useState("");
  const [category, setCategory] = useState<"praise" | "suggest" | "question" | "critic">("praise");
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);

  // 삭제 모달 상태
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [delPassword, setDelPassword] = useState("");

  // 1. 초기 인증 상태 체크
  useEffect(() => {
    const cached = localStorage.getItem("district_gps_verified");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.expires_at > Date.now()) {
          setIsGpsVerified(true);
          setVerifiedDistrict(parsed.district);
        } else {
          localStorage.removeItem("district_gps_verified");
        }
      } catch (e) {
        localStorage.removeItem("district_gps_verified");
      }
    }
  }, []);

  // 2. 피드백 목록 로드
  const loadFeedbacks = () => {
    setIsLoading(true);
    fetch(`/api/feedback?assemb_id=${assembId}&verified_only=${verifiedOnly}`)
      .then((res) => res.json())
      .then((data) => setFeedbacks(data.feedbacks || []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadFeedbacks();
  }, [assembId, verifiedOnly]);

  // 3. 브라우저 GPS 동네 인증 실행
  const handleVerifyGps = () => {
    if (!navigator.geolocation) {
      setGpsError("브라우저가 위치 정보를 지원하지 않습니다.");
      return;
    }

    const targetDistrict = rgnNm || "해당 지역구";
    setIsVerifyingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/district/verify-location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              target_district: targetDistrict,
            }),
          });
          const data = await res.json();
          if (data.verified) {
            setIsGpsVerified(true);
            setVerifiedDistrict(targetDistrict);
            localStorage.setItem(
              "district_gps_verified",
              JSON.stringify({ district: targetDistrict, expires_at: data.expires_at })
            );
          } else {
            setGpsError(data.message || "지역구 위치가 일치하지 않습니다.");
          }
        } catch (e) {
          setGpsError("위치 인증 처리 중 오류가 발생했습니다.");
        } finally {
          setIsVerifyingGps(false);
        }
      },
      (err) => {
        setIsVerifyingGps(false);
        setGpsError("위치 권한을 허용해 주셔야 30일 동네 인증이 가능합니다.");
      },
      { timeout: 10000 }
    );
  };

  // 4. 피드백 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !content.trim() || !password.trim()) {
      setWriteError("닉네임, 내용, 4자리 비밀번호를 모두 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setWriteError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assemb_id: assembId,
          district_nm: isGpsVerified ? verifiedDistrict : rgnNm || "관외/일반",
          nickname,
          category,
          content,
          password,
          is_verified: isGpsVerified,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setContent("");
        setPassword("");
        loadFeedbacks();
      } else {
        setWriteError(data.message || "작성에 실패했습니다.");
      }
    } catch (err) {
      setWriteError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. 피드백 삭제
  const handleDelete = async (feedbackId: number) => {
    if (!delPassword) return;
    try {
      const res = await fetch("/api/feedback", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback_id: feedbackId, password: delPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeletingId(null);
        setDelPassword("");
        loadFeedbacks();
      } else {
        alert(data.message || "삭제에 실패했습니다.");
      }
    } catch (err) {
      alert("삭제 요청 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-200">
      
      {/* 1. 헤더 및 투트랙 토글 스위치 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">
              {assembNm} 의원실 유권자 한마디
            </h4>
            <span className="text-[11px] text-slate-400">
              실제 지역 유권자의 생생한 정책 제안 및 피드백
            </span>
          </div>
        </div>

        {/* [🟢 인증 주민 글만 보기] 토글 */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setVerifiedOnly(true)}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              verifiedOnly
                ? "bg-white text-emerald-700 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🟢 인증 주민만
          </button>
          <button
            onClick={() => setVerifiedOnly(false)}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              !verifiedOnly
                ? "bg-white text-indigo-700 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            전체 보기
          </button>
        </div>
      </div>

      {/* 2. GPS 1초 동네 인증 배너 */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
        {isGpsVerified ? (
          <div className="flex items-center gap-2 text-emerald-700 font-bold truncate">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="truncate">🟢 '{verifiedDistrict}' 주민 인증 완료 (30일 유효)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-600 truncate">
            <MapPin className="w-4 h-4 shrink-0 text-indigo-500" />
            <span className="truncate">현재 위치로 1초 동네 인증 시 <strong>초록 인증 배지</strong>가 부여됩니다.</span>
          </div>
        )}

        {!isGpsVerified && (
          <button
            onClick={handleVerifyGps}
            disabled={isVerifyingGps}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shrink-0 transition-colors shadow-xs cursor-pointer text-xs"
          >
            {isVerifyingGps ? "확인 중..." : "동네 인증"}
          </button>
        )}
      </div>
      {gpsError && <p className="text-xs text-rose-600 pl-1">{gpsError}</p>}

      {/* 3. 피드백 작성 폼 (150자 제한 + 4대 태그) */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">분류:</span>
          {(["praise", "suggest", "question", "critic"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                category === cat
                  ? CATEGORY_META[cat].color + " ring-1 ring-offset-1"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {CATEGORY_META[cat].label}
            </button>
          ))}
        </div>

        <textarea
          rows={2}
          maxLength={150}
          placeholder="의원님께 전하고 싶은 법안 의견이나 지역 현안을 150자 이내로 남겨주세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full text-xs sm:text-sm p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-normal"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="닉네임 (2~8자)"
              maxLength={8}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-28 px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
            />
            <input
              type="password"
              placeholder="삭제용 4자리"
              maxLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-slate-400 font-mono text-[11px]">{content.length}/150</span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>등록</span>
            </button>
          </div>
        </div>
        {writeError && <p className="text-xs text-rose-600">{writeError}</p>}
      </form>

      {/* 4. 피드 목록 */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">의견을 불러오는 중...</div>
        ) : feedbacks.length > 0 ? (
          feedbacks.map((f) => {
            const meta = CATEGORY_META[f.category];
            const isVerified = f.is_verified === 1;

            return (
              <div
                key={f.feedback_id}
                className={`p-3 rounded-xl border transition-all ${
                  isVerified
                    ? "bg-emerald-50/20 border-emerald-200/80"
                    : "bg-white border-slate-100"
                }`}
              >
                <div className="flex items-center justify-between text-xs pb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${meta.color}`}>
                      {meta.label}
                    </span>
                    <strong className="font-bold text-slate-900">{f.nickname}</strong>
                    
                    {isVerified ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="w-3 h-3" /> 인증 주민
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[10px] text-slate-400 bg-slate-100">
                        일반
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                    <span>{f.created_at}</span>
                    <button
                      onClick={() => setDeletingId(f.feedback_id)}
                      className="hover:text-rose-600 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed break-keep font-normal">
                  {f.content}
                </p>

                {/* 삭제용 비밀번호 인라인 팝오버 */}
                {deletingId === f.feedback_id && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 text-xs">
                    <input
                      type="password"
                      placeholder="등록한 4자리 비밀번호"
                      maxLength={4}
                      value={delPassword}
                      onChange={(e) => setDelPassword(e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded text-xs w-36"
                    />
                    <button
                      onClick={() => handleDelete(f.feedback_id)}
                      className="px-2 py-1 bg-rose-600 text-white rounded font-bold text-xs"
                    >
                      삭제 확인
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(null);
                        setDelPassword("");
                      }}
                      className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                    >
                      취소
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl">
            {verifiedOnly
              ? "아직 등록된 인증 주민 한마디가 없습니다. 첫 인증 주민으로 의견을 남겨보세요!"
              : "등록된 의견이 없습니다. 첫 한마디를 남겨보세요!"}
          </div>
        )}
      </div>

    </div>
  );
}