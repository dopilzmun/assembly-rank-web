import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const PARTY_THEMES: Record<string, { bg: string; text: string; accent: string }> = {
  더불어민주당: { bg: "#1d4ed8", text: "#eff6ff", accent: "#60a5fa" },
  국민의힘: { bg: "#dc2626", text: "#fef2f2", accent: "#f87171" },
  조국혁신당: { bg: "#0284c7", text: "#f0f9ff", accent: "#38bdf8" },
  개혁신당: { bg: "#ea580c", text: "#fff7ed", accent: "#fb923c" },
  진보당: { bg: "#7e22ce", text: "#faf5ff", accent: "#c084fc" },
  기본소득당: { bg: "#0d9488", text: "#f0fdfa", accent: "#2dd4bf" },
  사회민주당: { bg: "#ca8a04", text: "#fefce8", accent: "#facc15" },
  무소속: { bg: "#475569", text: "#f8fafc", accent: "#94a3b8" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const name = searchParams.get("name") || "국회의원";
  const party = searchParams.get("party") || "무소속";
  const region = searchParams.get("region") || "대한민국 국회";
  const score = searchParams.get("score") || "-";
  const rank = searchParams.get("rank") || "-";
  const aprvCnt = searchParams.get("aprv") || "0";
  const motnCnt = searchParams.get("motn") || "0";
  const presentRate = searchParams.get("present") || "0";

  const theme = PARTY_THEMES[party] || PARTY_THEMES["무소속"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 70px",
          backgroundColor: "#0b0f19",
          backgroundImage: "radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15), transparent 40%), radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.15), transparent 40%)",
          fontFamily: "sans-serif",
          color: "#ffffff",
        }}
      >
        {/* 상단: 서비스 로고 및 브랜딩 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                backgroundColor: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "22px",
              }}
            >
              🏛️
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "-0.5px" }}>
                국회의원 입법활동 모니터
              </span>
              <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                제22대 국회 공식 입법 팩트체크 리포트
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              borderRadius: "999px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              fontSize: "14px",
              fontWeight: 700,
              color: "#cbd5e1",
            }}
          >
            <span>공식 성적표</span>
          </div>
        </div>

        {/* 중단: 의원 프로필 & 종합 점수 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  padding: "6px 16px",
                  borderRadius: "8px",
                  backgroundColor: theme.bg,
                  color: theme.text,
                  fontSize: "16px",
                  fontWeight: 800,
                }}
              >
                {party}
              </span>
              <span style={{ fontSize: "18px", color: "#94a3b8", fontWeight: 600 }}>
                {region}
              </span>
            </div>

            <span style={{ fontSize: "52px", fontWeight: 900, letterSpacing: "-1px" }}>
              {name} 의원
            </span>
          </div>

          {/* 종합 점수 & 순위 뱃지 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px 36px",
              borderRadius: "24px",
              backgroundColor: "rgba(79, 70, 229, 0.15)",
              border: "2px solid rgba(99, 102, 241, 0.4)",
            }}
          >
            <span style={{ fontSize: "14px", color: "#a5b4fc", fontWeight: 700 }}>
              종합 평가 (전국 {rank}위)
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "4px" }}>
              <span style={{ fontSize: "64px", fontWeight: 900, color: "#818cf8", fontFamily: "monospace" }}>
                {score}
              </span>
              <span style={{ fontSize: "24px", fontWeight: 700, color: "#c7d2fe" }}>점</span>
            </div>
          </div>
        </div>

        {/* 하단: 3대 핵심 성적 지표 그리드 */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            padding: "20px 24px",
            borderRadius: "20px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span style={{ fontSize: "14px", color: "#34d399", fontWeight: 700 }}>본회의 실질가결</span>
            <span style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", fontFamily: "monospace", marginTop: "4px" }}>
              {aprvCnt}건 통과
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>원안가결 + 대안반영</span>
          </div>

          <div style={{ width: "1px", backgroundColor: "rgba(255, 255, 255, 0.1)" }} />

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span style={{ fontSize: "14px", color: "#818cf8", fontWeight: 700 }}>상임위 상정률</span>
            <span style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", fontFamily: "monospace", marginTop: "4px" }}>
              {presentRate}%
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>첫 소관위 심사착수 비율</span>
          </div>

          <div style={{ width: "1px", backgroundColor: "rgba(255, 255, 255, 0.1)" }} />

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: 700 }}>대표발의 건수</span>
            <span style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", fontFamily: "monospace", marginTop: "4px" }}>
              {motnCnt}건
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>제22대 국회 누적 발의</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}