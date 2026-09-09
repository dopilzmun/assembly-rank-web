"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Zap, Layers, MessageSquare } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "의원 랭킹",
      href: "/",
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
    <>
      {/* 1. [PC 화면] 상단 고정 글로벌 내비게이션 바 (GNB) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* 서비스 로고 */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-indigo-600 group-hover:bg-indigo-700 rounded-xl text-white shadow-sm transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base tracking-tight">
                  국회 입법활동 모니터
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  제22대 국회
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                열린국회정보 Open API 기반 팩트체크
              </span>
            </div>
          </Link>

          {/* 중앙 라우트 메뉴 */}
          <nav className="flex items-center gap-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isActive ? "bg-indigo-200/60 text-indigo-900" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.badge}
                  </span>
                </Link>
              );
            })}

            {/* 향후 커뮤니티 플레이스홀더 */}
            <span
              title="오픈 준비 중입니다"
              className="flex items-center gap-1.5 px-3 py-2 text-slate-300 text-xs font-semibold cursor-not-allowed select-none"
            >
              <MessageSquare className="w-4 h-4" />
              <span>커뮤니티</span>
              <span className="text-[9px] px-1 bg-slate-100 text-slate-400 rounded">Soon</span>
            </span>
          </nav>

        </div>
      </header>

      {/* 2. [모바일 화면] 하단 탭바 (Bottom Navigation) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around py-2 px-2 md:hidden shadow-xl safe-area-bottom">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
                isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                {item.href === "/live" && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                )}
              </div>
              <span className={`text-[11px] tracking-tight ${isActive ? "font-bold text-indigo-700" : "font-medium"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}