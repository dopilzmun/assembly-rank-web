import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "국회의원 입법활동 지표 모니터";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 70px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #090d16 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* 상단 뱃지 영역 */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              padding: "8px 18px",
              background: "#4f46e5",
              borderRadius: "9999px",
              fontSize: "20px",
              fontWeight: "bold",
              letterSpacing: "1px",
            }}
          >
            제22대 국회
          </div>
          <div
            style={{
              padding: "8px 18px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "9999px",
              fontSize: "18px",
              color: "#cbd5e1",
            }}
          >
            열린국회정보 Open API 기반 실시간 모니터
          </div>
        </div>

        {/* 중앙 메인 타이틀 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-1px",
              color: "#ffffff",
            }}
          >
            국회의원 입법활동 지표 모니터
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              lineHeight: 1.4,
            }}
          >
            대표발의 건수 · 상임위 심사 상정률 · 본회의 실질가결 성과 6대 핵심 지표 분석
          </div>
        </div>

        {/* 하단 3대 특징 블록 */}
        <div style={{ display: "flex", gap: "20px" }}>
          <div
            style={{
              flex: 1,
              padding: "20px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ fontSize: "16px", color: "#818cf8", fontWeight: "bold" }}>
              ⚡ 팩트 기반 데이터
            </div>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#e2e8f0" }}>
              국회의원 300인 전수 집계
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: "20px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ fontSize: "16px", color: "#38bdf8", fontWeight: "bold" }}>
              ⚖️ 공정 평가 체계
            </div>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#e2e8f0" }}>
              대안반영폐기 실질가결 반영
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: "20px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ fontSize: "16px", color: "#34d399", fontWeight: "bold" }}>
              ⚔️ 비교 & 병목 분석
            </div>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#e2e8f0" }}>
              1:1 스탯 배틀 & 상임위 진단
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}