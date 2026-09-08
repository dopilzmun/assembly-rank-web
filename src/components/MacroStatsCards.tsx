import { MacroOverviewStats, PartyOverviewStats } from "@/types/stats";
import { FileText, CheckCircle2, Clock, Users, TrendingUp, TrendingDown } from "lucide-react";

interface MacroStatsCardsProps {
  overview: MacroOverviewStats;
  parties: PartyOverviewStats[];
}

const PARTY_BADGES: Record<string, { text: string; bg: string; border: string }> = {
  더불어민주당: { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  국민의힘: { text: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  조국혁신당: { text: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200" },
  개혁신당: { text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  진보당: { text: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  기본소득당: { text: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" },
  사회민주당: { text: "text-yellow-800", bg: "bg-yellow-50", border: "border-yellow-200" },
  무소속: { text: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200" },
};

export default function MacroStatsCards({ overview, parties }: MacroStatsCardsProps) {
  const avgBillsPerMember =
    overview.total_assemb_cnt > 0
      ? Math.round(overview.total_motn_cnt / overview.total_assemb_cnt)
      : 0;

  return (
    <div className="space-y-4">
      {/* 1. 국회 4대 총괄 지표 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 총 대표발의 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">총 대표발의</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {overview.total_motn_cnt.toLocaleString()}
              <span className="text-sm font-normal text-slate-500 ml-1">건</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              의원 1인당 평균 <strong className="text-slate-700 font-mono">{avgBillsPerMember}</strong>건
            </div>
          </div>
        </div>

        {/* 상임위 상정률 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">상임위 상정률</span>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-indigo-600 font-mono">
              {overview.overall_cmt_present_rate}
              <span className="text-sm font-normal text-slate-500 ml-1">%</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              정식 심사 착수 <strong className="text-slate-700 font-mono">{overview.total_cmt_present_cnt.toLocaleString()}</strong>건
            </div>
          </div>
        </div>

        {/* 본회의 가결률 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">본회의 가결률</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600 font-mono">
              {overview.overall_aprv_rate}
              <span className="text-sm font-normal text-slate-500 ml-1">%</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              최종 의결 통과 <strong className="text-emerald-700 font-mono">{overview.total_aprv_cnt.toLocaleString()}</strong>건
            </div>
          </div>
        </div>

        {/* 분석 대상 의원 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">분석 대상 의원</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {overview.total_assemb_cnt}
              <span className="text-sm font-normal text-slate-500 ml-1">명</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              22대 국회 현직 국회의원 전원
            </div>
          </div>
        </div>
      </div>

      {/* 2. 정당별 입법 파이프라인 비교 (2열 다단 그리드 레이아웃) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
        
        {/* 상단 헤더 및 범례 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                정당별 입법 파이프라인 실적 비교
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                국회 평균 가결률: {overview.overall_aprv_rate}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              각 당의 전체 대표발의 법안 중 본회의 가결 및 상임위 심사 단계별 비중입니다.
            </p>
          </div>

          {/* 범례 표시 */}
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-slate-700">가결</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
              <span className="text-slate-700">심사중</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
              <span className="text-slate-400">미상정 방치</span>
            </div>
          </div>
        </div>

        {/* 2열 카드 그리드 배치 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parties.map((party) => {
            const badge = PARTY_BADGES[party.pltprt_nm] || {
              text: "text-slate-700",
              bg: "bg-slate-100",
              border: "border-slate-200",
            };

            const aprvPct = party.aprv_rate;
            const reviewPct = Math.max(0, Math.round((party.cmt_present_rate - party.aprv_rate) * 10) / 10);
            const shelvedPct = Math.max(0, Math.round((100 - party.cmt_present_rate) * 10) / 10);
            const shelvedCnt = Math.max(0, party.total_motn_cnt - party.cmt_present_cnt);

            // 국회 평균 대비 편차
            const diffFromAvg = Math.round((party.aprv_rate - overview.overall_aprv_rate) * 10) / 10;
            const isAboveAvg = diffFromAvg >= 0;

            return (
              <div
                key={party.pltprt_nm}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all space-y-3"
              >
                {/* 상단: 정당 정보 및 성과 배지 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                      {party.pltprt_nm}
                    </span>
                    <span className="text-xs text-slate-500">
                      {party.assemb_cnt}명 · 발의 {party.total_motn_cnt.toLocaleString()}건
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        isAboveAvg
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                      title={`국회 평균(${overview.overall_aprv_rate}%) 대비 편차`}
                    >
                      {isAboveAvg ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {isAboveAvg ? `+${diffFromAvg}%p` : `${diffFromAvg}%p`}
                    </span>

                    <span className="text-sm font-extrabold text-slate-900">
                      {party.aprv_rate}%
                    </span>
                  </div>
                </div>

                {/* 중단: 컴팩트 누적 파이프라인 바 */}
                <div className="w-full bg-slate-200/80 rounded-md h-3 flex overflow-hidden">
                  {aprvPct > 0 && (
                    <div
                      style={{ width: `${aprvPct}%` }}
                      title={`가결: ${aprvPct}% (${party.aprv_cnt}건)`}
                      className="bg-emerald-500 h-full"
                    />
                  )}
                  {reviewPct > 0 && (
                    <div
                      style={{ width: `${reviewPct}%` }}
                      title={`심사중: ${reviewPct}%`}
                      className="bg-indigo-500 h-full"
                    />
                  )}
                  {shelvedPct > 0 && (
                    <div
                      style={{ width: `${shelvedPct}%` }}
                      title={`미상정 방치: ${shelvedPct}% (${shelvedCnt.toLocaleString()}건)`}
                      className="bg-slate-200 h-full"
                    />
                  )}
                </div>

                {/* 하단: 단계별 실측 건수 및 퍼센트 3열 요약 */}
                <div className="grid grid-cols-3 gap-1 text-[11px] font-mono pt-0.5">
                  <div className="bg-white px-2 py-1 rounded border border-slate-100 flex flex-col">
                    <span className="text-slate-400 text-[10px]">본회의 가결</span>
                    <strong className="text-emerald-600">
                      {party.aprv_cnt}건 ({aprvPct}%)
                    </strong>
                  </div>
                  <div className="bg-white px-2 py-1 rounded border border-slate-100 flex flex-col">
                    <span className="text-slate-400 text-[10px]">상임위 심사</span>
                    <strong className="text-indigo-600">
                      {party.cmt_present_cnt}건 ({party.cmt_present_rate}%)
                    </strong>
                  </div>
                  <div className="bg-white px-2 py-1 rounded border border-slate-100 flex flex-col">
                    <span className="text-slate-400 text-[10px]">미상정 방치</span>
                    <strong className="text-slate-500">
                      {shelvedCnt.toLocaleString()}건 ({shelvedPct}%)
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}