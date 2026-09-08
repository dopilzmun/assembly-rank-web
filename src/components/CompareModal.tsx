"use client";

import { useEffect } from "react";
import { BillRankingRow } from "@/types/ranking";
import RadarChart from "@/components/RadarChart";
import { X, Swords, Trophy, Clock } from "lucide-react";

interface CompareModalProps {
  memberA: BillRankingRow | null;
  memberB: BillRankingRow | null;
  allMembers: BillRankingRow[];
  onSelectMemberA: (m: BillRankingRow) => void;
  onSelectMemberB: (m: BillRankingRow) => void;
  onClose: () => void;
}

// 6대 스탯 환산 헬퍼 함수
export function calculateRadarStats(row: BillRankingRow): number[] {
  const motnCnt = Number(row.ttl_motn_cnt) || 0;
  const ownRate = Number(row.own_cmit_motn_rate) || 0;
  const presentRate = Number(row.cmt_present_rate) || 0;
  const avgDays = Number(row.avg_cmt_days) || 0;
  const aprvCnt = Number(row.aprv_cnt) || 0;
  const aprvRate = Number(row.aprv_rate) || 0;

  // 1. 발의 규모 (30건 기준 100점)
  const volume = Math.min(100, Math.round((motnCnt / 30) * 100));
  // 2. 소속위 집중 (0~100)
  const focus = Math.min(100, Math.round(ownRate));
  // 3. 심사 상정률 (0~100)
  const advance = Math.min(100, Math.round(presentRate));
  // 4. 심사 신속도 (소요일수가 짧을수록 높음, 60일 이내 100점, 180일 초과 시 10점)
  let speed = 0;
  if (avgDays > 0) {
    speed = Math.max(10, Math.min(100, Math.round(100 - ((avgDays - 30) / 150) * 90)));
  }
  // 5. 가결수 (5건 기준 100점)
  const passCnt = Math.min(100, Math.round((aprvCnt / 5) * 100));
  // 6. 가결률 (10% 기준 100점)
  const passRate = Math.min(100, Math.round((aprvRate / 10) * 100));

  return [volume, focus, advance, speed, passCnt, passRate];
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

  if (!memberA || !memberB) return null;

  const statsA = calculateRadarStats(memberA);
  const statsB = calculateRadarStats(memberB);

  // 비교 지표 리스트 정의
  const comparisonRows = [
    {
      label: "종합 입법점수",
      valA: `${Number(memberA.score ?? 0).toFixed(1)}점`,
      valB: `${Number(memberB.score ?? 0).toFixed(1)}점`,
      rawA: Number(memberA.score ?? 0),
      rawB: Number(memberB.score ?? 0),
      higherWins: true,
    },
    {
      label: "대표발의 건수",
      valA: `${Number(memberA.ttl_motn_cnt)}건 (월 ${Number(memberA.monthly_pace || 0).toFixed(1)}건)`,
      valB: `${Number(memberB.ttl_motn_cnt)}건 (월 ${Number(memberB.monthly_pace || 0).toFixed(1)}건)`,
      rawA: Number(memberA.ttl_motn_cnt),
      rawB: Number(memberB.ttl_motn_cnt),
      higherWins: true,
    },
    {
      label: "소속 상임위 집중도",
      valA: `${Number(memberA.own_cmit_motn_rate)}% (${Number(memberA.own_cmit_motn_cnt)}건)`,
      valB: `${Number(memberB.own_cmit_motn_rate)}% (${Number(memberB.own_cmit_motn_cnt)}건)`,
      rawA: Number(memberA.own_cmit_motn_rate),
      rawB: Number(memberB.own_cmit_motn_rate),
      higherWins: true,
    },
    {
      label: "상임위 상정률",
      valA: `${Number(memberA.cmt_present_rate)}% (${Number(memberA.cmt_present_cnt)}건)`,
      valB: `${Number(memberB.cmt_present_rate)}% (${Number(memberB.cmt_present_cnt)}건)`,
      rawA: Number(memberA.cmt_present_rate),
      rawB: Number(memberB.cmt_present_rate),
      higherWins: true,
    },
    {
      label: "심사착수 소요일 (낮을수록 우수)",
      valA: Number(memberA.avg_cmt_days) > 0 ? `${Number(memberA.avg_cmt_days)}일` : "실적 없음",
      valB: Number(memberB.avg_cmt_days) > 0 ? `${Number(memberB.avg_cmt_days)}일` : "실적 없음",
      rawA: Number(memberA.avg_cmt_days) > 0 ? Number(memberA.avg_cmt_days) : 9999,
      rawB: Number(memberB.avg_cmt_days) > 0 ? Number(memberB.avg_cmt_days) : 9999,
      higherWins: false,
    },
    {
      label: "본회의 가결 실적",
      valA: `${Number(memberA.aprv_cnt)}건 (${Number(memberA.aprv_rate || 0)}%)`,
      valB: `${Number(memberB.aprv_cnt)}건 (${Number(memberB.aprv_rate || 0)}%)`,
      rawA: Number(memberA.aprv_cnt),
      rawB: Number(memberB.aprv_cnt),
      higherWins: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* 모달 상단 헤더 */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">1:1 입법 지표 맞비교</h3>
              <p className="text-xs text-slate-500">두 국회의원의 6대 핵심 지표 및 입법 역량 직접 대조</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* 의원 선택 및 프로필 헤더 카드 */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* 의원 A 카드 */}
            <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/40 space-y-2">
              <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">의원 1</div>
              <select
                value={memberA.assemb_id}
                onChange={(e) => {
                  const found = allMembers.find((m) => m.assemb_id === e.target.value);
                  if (found) onSelectMemberA(found);
                }}
                className="w-full text-sm font-bold bg-white border border-indigo-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {allMembers.map((m) => (
                  <option key={m.assemb_id} value={m.assemb_id}>
                    {m.assemb_nm} ({m.pltprt_nm} / {m.rgn_nm || "비례"})
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-medium">{memberA.cmit_nm || "상임위 미배정"}</span>
                <span className="font-black text-indigo-700 text-sm font-mono">
                  {Number(memberA.score ?? 0).toFixed(1)}점
                </span>
              </div>
            </div>

            {/* 의원 B 카드 */}
            <div className="p-4 rounded-xl border-2 border-rose-200 bg-rose-50/40 space-y-2">
              <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">의원 2</div>
              <select
                value={memberB.assemb_id}
                onChange={(e) => {
                  const found = allMembers.find((m) => m.assemb_id === e.target.value);
                  if (found) onSelectMemberB(found);
                }}
                className="w-full text-sm font-bold bg-white border border-rose-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {allMembers.map((m) => (
                  <option key={m.assemb_id} value={m.assemb_id}>
                    {m.assemb_nm} ({m.pltprt_nm} / {m.rgn_nm || "비례"})
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-medium">{memberB.cmit_nm || "상임위 미배정"}</span>
                <span className="font-black text-rose-700 text-sm font-mono">
                  {Number(memberB.score ?? 0).toFixed(1)}점
                </span>
              </div>
            </div>
          </div>

          {/* 중앙 육각형 레이더 차트 (오버레이 비교) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center">
            <h4 className="text-xs font-bold text-slate-600 mb-2">6대 입법 역량 레이더 스탯 오버레이</h4>
            <RadarChart
              size={290}
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
          </div>

          {/* 지표별 1:1 대조 표 (승리 뱃지 표기) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-600 px-1">지표별 상세 대조</h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs bg-white">
              {comparisonRows.map((row, idx) => {
                const isAWinner = row.higherWins ? row.rawA > row.rawB : row.rawA < row.rawB;
                const isBWinner = row.higherWins ? row.rawB > row.rawA : row.rawB < row.rawA;

                return (
                  <div key={idx} className="grid grid-cols-12 items-center p-3 hover:bg-slate-50/70 transition-colors">
                    {/* 의원 A 수치 */}
                    <div className="col-span-5 flex items-center gap-1.5 justify-start font-mono">
                      {isAWinner && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                          <Trophy className="w-2.5 h-2.5" /> 우세
                        </span>
                      )}
                      <span className={isAWinner ? "font-bold text-indigo-900" : "text-slate-600"}>
                        {row.valA}
                      </span>
                    </div>

                    {/* 지표명 */}
                    <div className="col-span-2 text-center font-semibold text-slate-400 text-[11px]">
                      {row.label}
                    </div>

                    {/* 의원 B 수치 */}
                    <div className="col-span-5 flex items-center gap-1.5 justify-end font-mono">
                      <span className={isBWinner ? "font-bold text-rose-900" : "text-slate-600"}>
                        {row.valB}
                      </span>
                      {isBWinner && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                          <Trophy className="w-2.5 h-2.5" /> 우세
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}