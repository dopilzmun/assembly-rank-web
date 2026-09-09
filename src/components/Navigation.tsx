"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Zap, Layers, Sparkles } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "홈",
      href: "/",
      icon: Home,
      badge: "종합",
    },
    {
      name: "의원 랭킹",
      href: "/rankings",
      icon: Trophy,
      badge: "300인",
    },
    {
      name: "라이브 피드",
      href: "/live",
      icon: Zap,
      badge: "실시간",
    },
    {
      name: "상임위 분석",
      href: "/committees",
      icon: Layers,
      badge: "17개위",
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* 상단 1열: 서비스 로고 및 대 국회 표기 */}
        <div className="h-12 sm:h-14 flex items-center justify-between border-b border-slate-100/80">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-1.5 bg-indigo-600 group-hover:bg-indigo-700 rounded-lg text-white shadow-sm transition-colors">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 text-sm sm:text-base tracking-tight">
                국회 입법활동 모니터
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                제22대
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <span className="hidden sm:inline">열린국회정보 Open API 기반 팩트체크</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>
        </div>

        {/* 상단 2열: 4대 탭 내비게이션 바 (모바일 가로 4분할 밀착 배치) */}
        <nav className="grid grid-cols-4 sm:flex sm:items-center gap-1 py-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span className="whitespace-nowrap tracking-tight">{item.name}</span>
                <span
                  className={`hidden sm:inline-block px-1 py-0.2 rounded text-[9px] font-mono ${
                    isActive ? "bg-indigo-700/60 text-indigo-100" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </nav>

      </div>
    </header>
  );
}