import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, target_district } = await req.json();

    if (!lat || !lng) {
      return NextResponse.json({ message: "위도와 경도 정보가 필요합니다." }, { status: 400 });
    }

    // OpenStreetMap 무료 역지오코딩 (대한민국 행정구역명 파싱)
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ko`;
    const res = await fetch(osmUrl, {
      headers: { "User-Agent": "AssemblyRankWeb/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json({ verified: false, message: "위치 서비스 응답에 실패했습니다." }, { status: 502 });
    }

    const data = await res.json();
    const displayName = data.display_name || "";
    const addr = data.address || {};

    // 주요 행정구역 키워드 추출 (예: 수지구, 분당구, 해운대구, 종로구, 양평군 등)
    const localKeywords: string[] = [
      addr.borough,
      addr.city_district,
      addr.district,
      addr.suburb,
      addr.county,
      addr.city,
    ]
      .filter(Boolean)
      .map((k: string) => k.replace(/(시|구|군)$/, "")); // 접미사 제거하여 매칭 확률 극대화

    let isMatched = false;
    let detectedDistrict = "";

    if (target_district) {
      // 1. 기존 선택된 지역구와 현재 위치의 일치 여부 검증
      const cleanTarget = target_district.replace(/(갑|을|병|정|무|지역구)$/, "").trim();
      isMatched = displayName.replace(/\s+/g, "").includes(cleanTarget);
      detectedDistrict = target_district;
    } else {
      // 2. GPS만으로 내 동네 자동 추출 (홈 위젯 원클릭 인증)
      detectedDistrict = addr.borough || addr.city_district || addr.county || addr.city || "";
      isMatched = Boolean(detectedDistrict);
    }

    if (isMatched) {
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30일 유효
      return NextResponse.json({
        verified: true,
        district: detectedDistrict,
        local_keywords: localKeywords,
        detected_address: displayName,
        expires_at: expiresAt,
      });
    } else {
      return NextResponse.json({
        verified: false,
        message: `현재 위치(${displayName.slice(0, 25)}...)가 선택하신 '${target_district}'와 일치하지 않습니다.`,
      });
    }
  } catch (error) {
    console.error("Location verification error:", error);
    return NextResponse.json({ verified: false, message: "위치 검증 중 오류가 발생했습니다." }, { status: 500 });
  }
}