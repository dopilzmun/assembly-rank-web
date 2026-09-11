import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, target_district } = await req.json();

    if (!lat || !lng || !target_district) {
      return NextResponse.json({ message: "위치 정보와 지역구가 필요합니다." }, { status: 400 });
    }

    // OpenStreetMap 무료 역지오코딩 호출 (0원, API Key 불필요)
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ko`;
    const res = await fetch(osmUrl, {
      headers: { "User-Agent": "AssemblyRankWeb/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json({ verified: false, message: "위치 확인 서비스 응답 실패" }, { status: 502 });
    }

    const data = await res.json();
    const displayName = (data.display_name || "").replace(/\s+/g, "");
    
    // 사용자가 입력한 지역구 키워드 (예: '용인시병' -> '용인', '수지' / '종로구' -> '종로')
    const cleanTarget = target_district.replace(/(갑|을|병|정|무|지역구)$/, "").trim();
    const isMatched = displayName.includes(cleanTarget);

    if (isMatched) {
      // 30일 유효기간 타임스탬프 반환
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      return NextResponse.json({
        verified: true,
        district: target_district,
        detected_address: data.display_name,
        expires_at: expiresAt,
      });
    } else {
      return NextResponse.json({
        verified: false,
        message: `현재 위치(${data.display_name.slice(0, 25)}...)가 선택하신 '${target_district}'와 일치하지 않습니다.`,
      });
    }
  } catch (error) {
    console.error("Location verification error:", error);
    return NextResponse.json({ verified: false, message: "위치 검증 중 오류 발생" }, { status: 500 });
  }
}