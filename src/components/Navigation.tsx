"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Trophy,
  Zap,
  Layers,
  Vote,
  ArrowUpToLine,
  ArrowDownToLine,
} from "lucide-react";

interface NavItem {
  name: string;
  shortName: string;
  href: string;
  icon: typeof Home;
  badge: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "홈", shortName: "홈", href: "/", icon: Home, badge: "종합" },
  { name: "의원 랭킹", shortName: "랭킹", href: "/rankings", icon: Trophy, badge: "300인" },
  { name: "가결 속보", shortName: "속보", href: "/live", icon: Zap, badge: "실시간" },
  { name: "상임위 분석", shortName: "상임위", href: "/committees", icon: Layers, badge: "17개위" },
  { name: "오늘의 투표", shortName: "투표", href: "/poll/archive", icon: Vote, badge: "1초투표" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [navPosition, setNavPosition] = useState<"top" | "bottom">("top");
  const [isMounted, setIsMounted] = useState(false);

  // 로컬스토리지에서 저장된 메뉴 위치 복원 (기본값: top)
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("user_nav_position") as "top" | "bottom" | null;
    if (saved === "top" || saved === "bottom") {
      setNavPosition(saved);
    }
  }, []);

  // 모바일에서 하단 모드일 때만 콘텐츠 가림 방지 paddingBottom 동적 적용
  useEffect(() => {
    if (!isMounted) return;

    const applyBodyPadding = () => {
      if (window.innerWidth < 640 && navPosition === "bottom") {
        document.body.style.paddingBottom = "4rem";
      } else {
        document.body.style.paddingBottom = "0px";
      }
    };

    applyBodyPadding();
    window.addEventListener("resize", applyBodyPadding);
    return () => {
      document.body.style.paddingBottom = "0px";
      window.removeEventListener("resize", applyBodyPadding);
    };
  }, [navPosition, isMounted]);

  // 상/하단 위치 토글
  const togglePosition = () => {
    const next = navPosition === "top" ? "bottom" : "top";
    setNavPosition(next);
    localStorage.setItem("user_nav_position", next);
  };

  // 모바일 5대 탭 렌더러 (하단 탭바 스타일)
  const renderMobileTabs = () => (
    <div className="grid grid-cols-5 h-14 items-center px-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
              isActive
                ? "text-indigo-600 font-black dark:text-indigo-400"
                : "text-slate-400 hover:text-slate-600 font-semibold"
            }`}
          >
            <div className="relative">
              <Icon className={`w-4 h-4 transition-transform ${isActive ? "scale-110" : ""}`} />
              {isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
              {item.shortName}
            </span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* 1. 상단 메인 헤더 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs dark:bg-slate-950/95 dark:border-slate-800 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          
          {/* 로고 & 액션 바 */}
          <div className="h-12 sm:h-14 flex items-center justify-between border-b border-slate-100/80 dark:border-slate-800/80">
            {/* 로고 */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-1.5 bg-indigo-600 group-hover:bg-indigo-700 rounded-lg text-white shadow-xs transition-colors">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 text-sm sm:text-base tracking-tight dark:text-slate-100">
                  국회 입법활동 모니터
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-300">
                  제22대
                </span>
              </div>
            </Link>

            {/* 우측 도구: 모바일 위치 전환 버튼 & LIVE 뱃지 */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
                열린국회정보 Open API 기반 팩트체크
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono dark:bg-emerald-950/70 dark:border-emerald-900 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>

              {/* 모바일 전용 메뉴 위치 전환 스위치 (sm:hidden) */}
              <button
                onClick={togglePosition}
                className="sm:hidden inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80 transition-all active:scale-95 cursor-pointer dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                title={navPosition === "bottom" ? "메뉴를 상단으로 고정" : "메뉴를 하단으로 고정"}
              >
                {navPosition === "bottom" ? (
                  <>
                    <ArrowUpToLine className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>상단 고정</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>하단 고정</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2-A. 데스크톱 내비게이션 바 (sm:flex 항상 상단 유지) */}
          <nav className="hidden sm:flex sm:items-center gap-1.5 py-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span className="whitespace-nowrap tracking-tight">{item.name}</span>
                  <span
                    className={`px-1 py-0.2 rounded text-[9px] font-mono ${
                      isActive
                        ? "bg-indigo-700/60 text-indigo-100"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                    }`}
                  >
                    {item.badge}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* 2-B. 모바일 네비게이션: [상단 고정] 모드일 때만 상단 헤더 바로 아래 렌더링 */}
          {navPosition === "top" && (
            <nav className="sm:hidden border-t border-slate-100/80 dark:border-slate-800">
              {renderMobileTabs()}
            </nav>
          )}

        </div>
      </header>

      {/* 2-C. 모바일 네비게이션: [하단 고정] 모드일 때 화면 하단에 플로팅 렌더링 */}
      {navPosition === "bottom" && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] shadow-lg transition-all animate-in slide-in-from-bottom duration-200">
          {renderMobileTabs()}
        </nav>
      )}
    </>
  );
}