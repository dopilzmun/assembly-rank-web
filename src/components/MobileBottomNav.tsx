"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Trophy,
  Zap,
  Clock,
  Vote,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: typeof Home;
}

const NAV_ITEMS: NavItem[] = [
  { label: "홈", href: "/", icon: Home },
  { label: "300인 랭킹", href: "/rankings", icon: Trophy },
  { label: "가결 속보", href: "/live", icon: Zap },
  { label: "상임위 병목", href: "/committees", icon: Clock },
  { label: "쟁점 투표", href: "/poll/archive", icon: Vote },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] shadow-lg transition-all">
      <div className="flex items-center justify-around h-14 px-2">
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
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-black"
                  : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-medium"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}