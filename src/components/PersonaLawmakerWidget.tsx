"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { UserCheck, Award, Heart, CheckCircle2, ChevronRight, Briefcase, Baby, Home, Car, CreditCard, ShieldCheck } from "lucide-react";

interface PersonaBill {
  bill_id: string;
  bill_nm: string;
  process_stat: string;
  process_dd: string | null;
  chng_seq: number | null;
  chng_nm: string | null;
  tgt_cnts: string | null;
  bfor_cnts: string | null;
  aftr_cnts: string | null;
  opertn_dd: string | null;
  opertn_se: string | null;
  symp_cnt: number;
}

interface PersonaMember {
  assemb_id: string;
  assemb_nm: string;
  pltprt_nm: string;
  ctgr_se: string;
  aprv_cnt: number;
  pure_aprv_cnt: number;
  alt_aprv_cnt: number;
  aprv_scor: number;
  symp_cnt: number;
  rnkg: number;
  bills: PersonaBill[];
}

const PERSONAS = [
  { code: "WORK", label: "직장인/청년", desc: "야근 축소, 퇴직급여, 청년 일자리 대변", icon: Briefcase },
  { code: "CARE", label: "육아/학부모", desc: "육아휴직 확대, 늘봄학교, 통학안전 대변", icon: Baby },
  { code: "HOUSE", label: "주거/세입자", desc: "전세사기 방지, 원룸 관리비, 청약 대변", icon: Home },
  { code: "TRAF", label: "운전자/교통", desc: "음주운전 처벌, 도로안전, 주차난 해소", icon: Car },
  { code: "FIN", label: "금융/소비자", desc: "모바일쿠폰 연장, 금리부담, 사기예방", icon: CreditCard },
  { code: "LIFE", label: "생활/복지", desc: "시민 생활 편익 및 기초복지 증진", icon: ShieldCheck },
];

export default function PersonaLawmakerWidget() {
  const [selectedPersona, setSelectedPersona] = useState("WORK");
  const [members, setMembers] = useState<PersonaMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const fetchPersonaData = async (code: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/district/persona?ctgr_se=${code}`);
      const data = await res.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error(error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonaData(selectedPersona);
  }, [selectedPersona]);

  const activePersonaObj = PERSONAS.find((p) => p.code === selectedPersona);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            <UserCheck className="h-3.5 w-3.5" />
            페르소나별 입법 성적표
          </div>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            내 라이프스타일을 챙겨주는 의원은 누구일까요?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            단독 가결(100%)과 대안반영(70%)을 공정하게 가중 집계하여, 내 삶에 직결된 법안을 실질적으로 통과시킨 의원 순위입니다.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {PERSONAS.map((p) => {
          const Icon = p.icon;
          const isSelected = selectedPersona === p.code;
          return (
            <button
              key={p.code}
              onClick={() => {
                startTransition(() => {
                  setSelectedPersona(p.code);
                });
              }}
              className={`flex flex-col items-center justify-center rounded-xl p-3 text-center transition-all ${
                isSelected
                  ? "border-2 border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-200"
                  : "border border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className={`h-5 w-5 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
              <span className="mt-1.5 text-xs font-bold">{p.label}</span>
            </button>
          );
        })}
      </div>

      {activePersonaObj && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-100/70 px-3.5 py-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">[{activePersonaObj.label}]</span>
          <span>{activePersonaObj.desc}</span>
        </div>
      )}

      <div className="mt-5">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">의원별 생활 입법 성적을 분석하는 중...</div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            해당 페르소나 분야에서 본회의 가결 법안을 보유한 의원이 아직 등록되지 않았습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m) => (
              <div
                key={m.assemb_id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-800/60"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        m.rnkg === 1
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          : m.rnkg === 2
                          ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                          : m.rnkg === 3
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <Award className="h-3.5 w-3.5" />
                      {m.rnkg}위
                    </span>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-200 font-semibold" title={`단독가결 ${m.pure_aprv_cnt}건 + 대안반영 ${m.alt_aprv_cnt}건 (가중치 점수: ${m.aprv_scor}점)`}>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        실질가결 {m.aprv_cnt}건
                      </span>
                      {m.symp_cnt > 0 && (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                          <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                          {m.symp_cnt}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <strong className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                        {m.assemb_nm}
                      </strong>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {m.pltprt_nm}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      단독 {m.pure_aprv_cnt} · 대안 {m.alt_aprv_cnt}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-700/60">
                    <span className="text-[11px] font-bold text-slate-500 block dark:text-slate-400">
                      대표 입법 성과 (최대 3건)
                    </span>
                    {m.bills.map((b) => (
                      <div
                        key={b.bill_id}
                        className="rounded-lg bg-slate-50 p-2.5 text-xs dark:bg-slate-800/90 border border-slate-100 dark:border-slate-700/40"
                      >
                        <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {b.chng_nm || b.bill_nm}
                        </p>
                        <p className="mt-1 text-[11px] text-blue-700 dark:text-blue-300 line-clamp-2">
                          {b.aftr_cnts ? `👉 ${b.aftr_cnts}` : `✅ 본회의 ${b.process_stat} (${b.process_dd || "의결"})`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 하단 의원 상세 성적표 직접 이동 링크 */}
                <Link
                  href={`/rankings/${m.assemb_id}`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-slate-100 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-700/70 dark:text-slate-200 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300"
                >
                  <span>의원 전체 성적표 보기</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}