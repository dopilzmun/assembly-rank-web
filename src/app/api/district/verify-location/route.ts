import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

interface MemberDistrictRow extends RowDataPacket {
  rgn_nm: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lat = body.latitude || body.lat;
    const lon = body.longitude || body.lon || body.lng;

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // 1. OpenStreetMap Nominatim 호출 (User-Agent 헤더 필수: 누락 시 403 차단됨)
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
    const geoRes = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "AssemblyRankWeb/1.0 (contact@assemblyrank.kr)",
        "Accept-Language": "ko,en;q=0.9",
      },
      next: { revalidate: 0 },
    });

    if (!geoRes.ok) {
      console.error("Nominatim geocoding failed with status:", geoRes.status);
      return NextResponse.json(
        { error: "위치 지오코딩 서비스 응답 실패" },
        { status: 502 }
      );
    }

    const geoData = await geoRes.json();
    const addr = geoData.address || {};

    // 한국 행정구역 명칭 추출
    // borough: 서울 구(예: 종로구, 강남구)
    // city_district: 성남시 분당구, 수원시 영통구 등 일반구
    // county: 군(예: 양평군)
    const borough = addr.borough || addr.city_district || addr.suburb || addr.county || "";
    const city = addr.city || addr.province || addr.state || "";

    // 2. 데이터베이스(assemb_mastr)에서 해당 지역구 탐색
    let matchedDistrict: string | null = null;

    if (borough) {
      const cleanBorough = borough.replace(/구$/, ""); // '종로구' -> '종로'
      const [rows] = await pool.query<MemberDistrictRow[]>(
        `SELECT DISTINCT rgn_nm 
         FROM assemb_mastr 
         WHERE age = 22 
           AND (rgn_nm LIKE CONCAT('%', ?, '%') OR rgn_nm LIKE CONCAT('%', ?, '%'))
         LIMIT 1;`,
        [borough, cleanBorough]
      );

      if (rows && rows.length > 0) {
        matchedDistrict = rows[0].rgn_nm;
      }
    }

    // 자치구 탐색 실패 시 시 단위 탐색 (예: 제주시, 세종시)
    if (!matchedDistrict && city) {
      const cleanCity = city.replace(/(시|특별시|광역시|특별자치시)$/, "");
      const [cityRows] = await pool.query<MemberDistrictRow[]>(
        `SELECT DISTINCT rgn_nm 
         FROM assemb_mastr 
         WHERE age = 22 AND rgn_nm LIKE CONCAT('%', ?, '%')
         LIMIT 1;`,
        [cleanCity]
      );
      if (cityRows && cityRows.length > 0) {
        matchedDistrict = cityRows[0].rgn_nm;
      }
    }

    if (!matchedDistrict) {
      return NextResponse.json({
        district: null,
        message: "해당 위치와 일치하는 제22대 국회 지역구를 찾지 못했습니다.",
      });
    }

    return NextResponse.json({
      success: true,
      district: matchedDistrict,
      rgn_nm: matchedDistrict,
      detected_address: `${city} ${borough}`.trim(),
    });
  } catch (error) {
    console.error("Failed to verify location:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}