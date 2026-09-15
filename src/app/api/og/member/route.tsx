import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const PARTY_THEMES: Record<string, { bg: string; text: string }> = {
  더불어민주당: { bg: "#1d4ed8", text: "#ffffff" },
  국민의힘: { bg: "#dc2626", text: "#ffffff" },
  조국혁신당: { bg: "#0284c7", text: "#ffffff" },
  개혁신당: { bg: "#ea580c", text: "#ffffff" },
  진보당: { bg: "#7e22ce", text: "#ffffff" },
  기본소득당: { bg: "#0d9488", text: "#ffffff" },
  사회민주당: { bg: "#ca8a04", text: "#ffffff" },
  무소속: { bg: "#475569", text: "#ffffff" },
};

export async function GET(req: NextRequest) {
  try {
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

    // Google Fonts에서 Noto Sans KR 볼드 폰트 동적 로드 (한글 깨짐 및 500 에러 방지)
    const fontData = await fetch(
      new URL("https://fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Bold.otf")
    ).then((res) => res.arrayBuffer());

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "50px 60px",
            backgroundColor: "#090d16",
            fontFamily: '"Noto Sans KR", sans-serif',
            color: "#ffffff",
          }}
        >
          {/* 상단 헤더 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#4f46e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: 900,
                }}
              >
                R
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "20px", fontWeight: 800 }}>국회의원 입법활동 모니터</span>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>제22대 국회 입법 팩트체크 리포트</span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                padding: "6px 14px",
                borderRadius: "999px",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                fontSize: "13px",
                color: "#cbd5e1",
              }}
            >
              공식 의정 성적표
            </div>
          </div>

          {/* 중단 메인 정보 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    backgroundColor: theme.bg,
                    color: theme.text,
                    fontSize: "15px",
                    fontWeight: 800,
                  }}
                >
                  {party}
                </span>
                <span style={{ fontSize: "16px", color: "#94a3b8" }}>{region}</span>
              </div>

              <span style={{ fontSize: "48px", fontWeight: 900 }}>{name} 의원</span>
            </div>

            {/* 종합 점수 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px 32px",
                borderRadius: "20px",
                backgroundColor: "rgba(79, 70, 229, 0.15)",
                border: "2px solid rgba(99, 102, 241, 0.4)",
              }}
            >
              <span style={{ fontSize: "13px", color: "#a5b4fc", fontWeight: 700 }}>
                종합 평가 (전국 {rank}위)
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "4px" }}>
                <span style={{ fontSize: "56px", fontWeight: 900, color: "#818cf8" }}>{score}</span>
                <span style={{ fontSize: "20px", color: "#c7d2fe" }}>점</span>
              </div>
            </div>
          </div>

          {/* 하단 3대 지표 */}
          <div
            style={{
              display: "flex",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              padding: "18px 24px",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <span style={{ fontSize: "13px", color: "#34d399", fontWeight: 700 }}>본회의 실질가결</span>
              <span style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff", marginTop: "2px" }}>
                {aprvCnt}건
              </span>
              <span style={{ fontSize: "11px", color: "#64748b" }}>원안가결 + 대안반영</span>
            </div>

            <div style={{ width: "1px", backgroundColor: "rgba(255, 255, 255, 0.1)", margin: "0 16px" }} />

            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <span style={{ fontSize: "13px", color: "#818cf8", fontWeight: 700 }}>상임위 상정률</span>
              <span style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff", marginTop: "2px" }}>
                {presentRate}%
              </span>
              <span style={{ fontSize: "11px", color: "#64748b" }}>첫 심사착수 비율</span>
            </div>

            <div style={{ width: "1px", backgroundColor: "rgba(255, 255, 255, 0.1)", margin: "0 16px" }} />

            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <span style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 700 }}>대표발의 건수</span>
              <span style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff", marginTop: "2px" }}>
                {motnCnt}건
              </span>
              <span style={{ fontSize: "11px", color: "#64748b" }}>제22대 국회 누적</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Noto Sans KR",
            data: fontData,
            style: "normal",
          },
        ],
      }
    );
  } catch (error) {
    console.error("OG Image generation failed:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}