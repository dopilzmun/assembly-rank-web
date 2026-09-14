import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, target_district } = await req.json();

    if (!lat || !lng) {
      return NextResponse.json({ message: "위도와 경도 정보가 필요합니다." }, { status: 400 });
    }

    // OpenStreetMap 무료 역지오코딩
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ko`;
    const res = await fetch(osmUrl, {
      headers: { "User-Agent": "AssemblyRankWeb/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json({ verified: false, message: "위치 서비스 응답에 실패했습니다." }, { status: 502 });
    }

    const data = await res.json();
    const displayName = (data.display_name || "").replace(/\s+/g, "");
    const addr = data.address || {};

    // 주요 행정구역 키워드 추출 (시, 구, 군)
    const localKeywords: string[] = [
      addr.borough,
      addr.city_district,
      addr.district,
      addr.suburb,
      addr.county,
      addr.city,
    ]
      .filter(Boolean)
      .map((k: string) => k.replace(/(시|구|군)$/, ""));

    let isMatched = false;
    let detectedDistrict = target_district || "";

    if (target_district) {
      // 1. 사용자가 이미 '용인시병' 등을 지정한 경우: 선거구 접미사(갑/을/병/정/무) 제거 후 교차 검증
      const cleanTarget = target_district
        .replace(/(갑|을|병|정|무|지역구)$/, "")
        .replace(/(시|구|군)$/, "")
        .trim();
      
      // 주소에 해당 시/구/군 키워드가 들어있거나, localKeywords 중 일치하는 항목이 있으면 통과
      isMatched = displayName.includes(cleanTarget) || localKeywords.some((kw) => cleanTarget.includes(kw) || kw.includes(cleanTarget));
      detectedDistrict = target_district;
    } else {
      // 2. GPS로 최초 자동 추출하는 경우
      const baseDistrict = addr.borough || addr.city_district || addr.county || addr.city || "";
      detectedDistrict = baseDistrict.replace(/(시|구|군)$/, "");
      isMatched = Boolean(detectedDistrict);
    }

    if (isMatched) {
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      return NextResponse.json({
        verified: true,
        district: detectedDistrict,
        local_keywords: localKeywords,
        detected_address: data.display_name,
        expires_at: expiresAt,
      });
    } else {
      return NextResponse.json({
        verified: false,
        message: `현재 위치(${data.display_name.slice(0, 25)}...)가 '${target_district}'와 일치하지 않습니다.`,
      });
    }
  } catch (error) {
    console.error("Location verification error:", error);
    return NextResponse.json({ verified: false, message: "위치 검증 중 오류가 발생했습니다." }, { status: 500 });
  }
}