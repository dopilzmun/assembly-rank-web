import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  return handleRevalidate(request);
}

export async function GET(request: NextRequest) {
  return handleRevalidate(request);
}

async function handleRevalidate(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.REVALIDATE_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json(
      { message: "인증 실패: 유효하지 않은 비밀 키입니다." },
      { status: 401 }
    );
  }

  try {
    revalidatePath("/", "page");
    revalidatePath("/rankings", "page");
    revalidatePath("/live", "page");
    revalidatePath("/committees", "page");

    return NextResponse.json({
      revalidated: true,
      paths: ["/", "/rankings", "/live", "/committees"],
      now: new Date().toISOString(),
      message: "모든 페이지 캐시가 성공적으로 갱신되었습니다.",
    });
  } catch (error) {
    console.error("캐시 재검증 실패:", error);
    return NextResponse.json(
      { message: "캐시 재검증 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}