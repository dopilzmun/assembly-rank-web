import { ImageResponse } from "next/og";

// 빌드 시점에 정적 PNG 파일로 완전 생성하여 크롤러 응답 지연을 방지합니다.
export const dynamic = "force-static";
export const alt = "국회의원 입법활동 지표 모니터";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // 한글 Pretendard Bold 폰트 로드
  const fontData = await fetch(
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/web/static/woff/Pretendard-Bold.woff"
  ).then((res) => res.arrayBuffer());

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
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #090d16 100%)",
          color: "#ffffff",
          fontFamily: '"Pretendard", sans-serif',
        }}
      >
        {/* 상단 뱃지 영역 */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 20px",
              background: "#4f46e5",
              borderRadius: "9999px",
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            제22대 국회
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 20px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "9999px",
              fontSize: "18px",
              color: "#cbd5e1",
            }}
          >
            열린국회정보 Open API 기반 실시간 모니터
          </div>
        </div>

        {/* 중앙 메인 타이틀 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              fontSize: "54px",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-1px",
              color: "#ffffff",
            }}
          >
            국회의원 입법활동 지표 모니터
          </div>
          <div
            style={{
              fontSize: "23px",
              color: "#94a3b8",
              lineHeight: 1.4,
            }}
          >
            대표발의 건수 · 소관위 상정률 · 본회의 실질가결 성과 6대 지표 전수 분석
          </div>
        </div>

        {/* 하단 3대 특징 블록 */}
        <div style={{ display: "flex", gap: "20px" }}>
          <div
            style={{
              flex: 1,
              padding: "20px 24px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ fontSize: "16px", color: "#818cf8", fontWeight: 700 }}>
              ⚡ 팩트 기반 데이터
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#e2e8f0" }}>
              국회의원 300인 전수 모니터
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: "20px 24px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ fontSize: "16px", color: "#38bdf8", fontWeight: 700 }}>
              ⚖️ 공정 평가 체계
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#e2e8f0" }}>
              대안반영폐기 실질가결 반영
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: "20px 24px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ fontSize: "16px", color: "#34d399", fontWeight: 700 }}>
              ⚔️ 1:1 맞비교 분석
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#e2e8f0" }}>
              육각형 스탯 배틀 & 상임위 진단
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Pretendard",
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}