"use client";

import { useEffect } from "react";
import { BillRankingRow } from "@/types/ranking";
import RadarChart from "@/components/RadarChart";
import { X, Swords, Award, FileText, CheckCircle2, Clock, Layers, Sparkles } from "lucide-react";

interface CompareModalProps {
  memberA: BillRankingRow;
  memberB: BillRankingRow;
  allMembers: BillRankingRow[];
  onSelectMemberA: (member: BillRankingRow) => void;
  onSelectMemberB: (member: BillRankingRow) => void;
  onClose: () => void;
}

export function calculateRadarStats(member: BillRankingRow) {
  const motnScore = Math.min(100, Math.round(((Number(member.ttl_motn_cnt) || 0) / 30) * 100));
  const paceScore = Math.min(100, Math.round(((Number(member.monthly_pace) || 0) / 3.0) * 100));
  const cmitRate = Math.min(100, Math.round(Number(member.own_cmit_motn_rate) || 0));
  const presentRate = Math.min(100, Math.round(Number(member.cmt_present_rate) || 0));
  const avgDays = Number(member.avg_cmt_days) || 0;
  let speedScore = 0;
  if (avgDays > 0) {
    if (avgDays <= 60) speedScore = 100;
    else if (avgDays >= 180) speedScore = 20;
    else speedScore = Math.round(100 - ((avgDays - 60) / 120) * 80);
  }
  const aprvScore = Math.min(100, Math.round(((Number(member.aprv_cnt) || 0) / 5) * 100));

  return {
    "발의 규모": motnScore,
    "발의 페이스": paceScore,
    "상임위 집중": cmitRate,
    "상정 추진력": presentRate,
    "심사 신속도": speedScore,
    "실질 가결": aprvScore,
  };
}

export default function CompareModal({
  memberA,
  memberB,
  allMembers,
  onSelectMemberA,
  onSelectMemberB,
  onClose,
}: CompareModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const statsA = calculateRadarStats(memberA);
  const statsB = calculateRadarStats(memberB);

  const scoreA = Number(memberA.score) || 0;
  const scoreB = Number(memberB.score) || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* 모달 상단 헤더 */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
              <Swords className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                1:1 입법 역량 맞비교 분석
              </h3>
              <p className="text-xs text-indigo-200/80">두 의원의 6대 핵심 역량 스탯과 의정 지표를 비교합니다.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 바디 영역 (모바일: 세로 스택, PC: 2열 나란히) */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* 중앙 육각형 레이더 겹침 차트 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center">
            <div className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> 역량 밸런스 중첩 오버레이
            </div>
            <RadarChart
              size={240}
              data1={{
                label: memberA.assemb_nm,
                color: "#4f46e5",
                fillColor: "rgba(79, 70, 229, 0.25)",
                stats: statsA,
              }}
              data2={{
                label: memberB.assemb_nm,
                color: "#e11d48",
                fillColor: "rgba(225, 29, 72, 0.25)",
                stats: statsB,
              }}
            />
            <div className="flex items-center gap-6 mt-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-indigo-600">
                <span className="w-3 h-3 rounded-full bg-indigo-600" /> {memberA.assemb_nm}
              </span>
              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="w-3 h-3 rounded-full bg-rose-600" /> {memberB.assemb_nm}
              </span>
            </div>
          </div>

          {/* 두 의원 지표 상세 대결 그리드 (모바일 세로 분할) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Member A */}
            <div className="p-4 rounded-xl border-2 border-indigo-100 bg-indigo-50/20 space-y-3">
              <div className="flex items-center justify-between">
                <select
                  value={memberA.assemb_id}
                  onChange={(e) => {
                    const found = allMembers.find((m) => m.assemb_id === e.target.value);
                    if (found) onSelectMemberA(found);
                  }}
                  className="font-bold text-sm bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                >
                  {allMembers.map((m) => (
                    <option key={m.assemb_id} value={m.assemb_id}>
                      {m.assemb_nm} ({m.pltprt_nm})
                    </option>
                  ))}
                </select>

                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-indigo-600 text-white font-mono">
                  {scoreA > 0 ? `${scoreA.toFixed(1)}점` : "유예"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-indigo-100">
                  <span className="text-slate-500">종합 순위</span>
                  <strong className="font-mono text-slate-800">{memberA.rnkg ? `${memberA.rnkg}위` : "-"}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-indigo-100">
                  <span className="text-slate-500">대표발의 (월 페이스)</span>
                  <strong className="font-mono text-slate-800">{memberA.ttl_motn_cnt}건 (월 {Number(memberA.monthly_pace).toFixed(1)})</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-indigo-100">
                  <span className="text-slate-500">상임위 집중도</span>
                  <strong className="font-mono text-blue-700">{memberA.own_cmit_motn_rate}% ({memberA.own_cmit_motn_cnt}건)</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-indigo-100">
                  <span className="text-slate-500">상정률 / 착수일</span>
                  <strong className="font-mono text-slate-800">{memberA.cmt_present_rate}% / {memberA.avg_cmt_days || "-"}일</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">본회의 실질가결</span>
                  <strong className="font-mono text-emerald-700">{memberA.aprv_cnt}건 (원{memberA.pure_aprv_cnt || 0}·대{memberA.alt_aprv_cnt || 0})</strong>
                </div>
              </div>
            </div>

            {/* Member B */}
            <div className="p-4 rounded-xl border-2 border-rose-100 bg-rose-50/20 space-y-3">
              <div className="flex items-center justify-between">
                <select
                  value={memberB.assemb_id}
                  onChange={(e) => {
                    const found = allMembers.find((m) => m.assemb_id === e.target.value);
                    if (found) onSelectMemberB(found);
                  }}
                  className="font-bold text-sm bg-white border border-rose-200 rounded-lg px-2.5 py-1.5 text-rose-950 focus:ring-2 focus:ring-rose-500"
                >
                  {allMembers.map((m) => (
                    <option key={m.assemb_id} value={m.assemb_id}>
                      {m.assemb_nm} ({m.pltprt_nm})
                    </option>
                  ))}
                </select>

                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-600 text-white font-mono">
                  {scoreB > 0 ? `${scoreB.toFixed(1)}점` : "유예"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-rose-100">
                  <span className="text-slate-500">종합 순위</span>
                  <strong className="font-mono text-slate-800">{memberB.rnkg ? `${memberB.rnkg}위` : "-"}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-rose-100">
                  <span className="text-slate-500">대표발의 (월 페이스)</span>
                  <strong className="font-mono text-slate-800">{memberB.ttl_motn_cnt}건 (월 {Number(memberB.monthly_pace).toFixed(1)})</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-rose-100">
                  <span className="text-slate-500">상임위 집중도</span>
                  <strong className="font-mono text-blue-700">{memberB.own_cmit_motn_rate}% ({memberB.own_cmit_motn_cnt}건)</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-rose-100">
                  <span className="text-slate-500">상정률 / 착수일</span>
                  <strong className="font-mono text-slate-800">{memberB.cmt_present_rate}% / {memberB.avg_cmt_days || "-"}일</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">본회의 실질가결</span>
                  <strong className="font-mono text-emerald-700">{memberB.aprv_cnt}건 (원{memberB.pure_aprv_cnt || 0}·대{memberB.alt_aprv_cnt || 0})</strong>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 모달 푸터 */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}