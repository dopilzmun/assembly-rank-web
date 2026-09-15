import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import MobileBottomNav from "@/components/MobileBottomNav";

export const metadata: Metadata = {
  title: "국회의원 입법활동 지표 모니터 | 제22대 국회",
  description:
    "열린국회정보 Open API 기반 제22대 국회의원 법안 발의·상정·실질가결 지표 및 6대 역량 분석 모니터",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
        {/* 상단 글로벌 헤더 */}
        <Navigation />

        {/* 메인 콘텐츠 (모바일에서는 하단 탭바 높이만큼 pb-16 확보, 데스크톱은 sm:pb-0) */}
        <div className="flex-1 pb-16 sm:pb-0">
          {children}
        </div>

        {/* 모바일 전용 하단 플로팅 탭바 (sm:hidden) */}
        <MobileBottomNav />
      </body>
    </html>
  );
}