import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

interface LifeChangeRow extends RowDataPacket {
  chng_seq: number;
  bill_id: string;
  age: number;
  chng_nm: string;
  ctgr_se: string;
  tgt_cnts: string;
  bfor_cnts: string;
  aftr_cnts: string;
  opertn_dd: string | null;
  opertn_se: string | null;
  symp_cnt: number;
  expyn: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ctgrParam = searchParams.get("ctgr_se");

    // 1. 테이블 보장
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bill_lvlhd_chng_mastr (
        chng_seq INT AUTO_INCREMENT PRIMARY KEY,
        bill_id VARCHAR(50) NOT NULL,
        age INT DEFAULT 22,
        chng_nm VARCHAR(255) NOT NULL,
        ctgr_se VARCHAR(50) NOT NULL,
        tgt_cnts VARCHAR(100) NOT NULL,
        bfor_cnts TEXT NOT NULL,
        aftr_cnts TEXT NOT NULL,
        opertn_dd DATE DEFAULT NULL,
        opertn_se VARCHAR(50) DEFAULT NULL,
        symp_cnt INT DEFAULT 0,
        expyn TINYINT(1) DEFAULT 1,
        rgstdt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ctgr_exp (ctgr_se, expyn)
      );
    `);

    // 2. 초기 데이터 수량이 부족할 경우 6대 분야별 대표 실질가결 법안 자동 시딩
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM bill_lvlhd_chng_mastr WHERE expyn = 1;`
    );
    if (countRows[0].cnt < 6) {
      await pool.query(`
        INSERT INTO bill_lvlhd_chng_mastr 
          (bill_id, age, chng_nm, ctgr_se, tgt_cnts, bfor_cnts, aftr_cnts, opertn_dd, opertn_se, symp_cnt, expyn)
        VALUES
          ('2200111', 22, '육아휴직 기간 1년 6개월 확대 및 배우자 출산휴가 확대법', '육아/교육', '만 8세 이하 자녀 부모', '부모 각각 최대 1년만 육아휴직 가능', '부모 모두 사용 시 각각 1년 6개월(총 3년)로 연장, 배우자 출산휴가 20일 확대', '2025-02-23', '공포후시행', 42, 1),
          ('2200222', 22, '청년 일경험 지원 및 채용 갑질 방지 공정채용법', '청년/취업', '청년 구직자 및 취업준비생', '채용 불합격 사유 고지 의무 없음', '불합격자 요청 시 채용 탈락 사유 피드백 제공 의무화 및 직무 무관 개인정보 수집 엄벌', '2025-07-01', '공포후6개월', 29, 1),
          ('2200333', 22, '전세사기 피해자 주택 우선매수권 및 금융지원 보강법', '주거/부동산', '전세사기 피해 임차인', '피해주택 경매 낙찰 시 보증금 전액 손실 위험', 'LH가 피해주택 우선매수 후 공공임대 장기 거주권 보장 및 경매차익 피해자 지급', '2024-11-11', '즉시시행', 67, 1),
          ('2200444', 22, '직장인 야간·휴일 카카오톡 업무지시 연결차단권법', '직장/노동', '전국 임금근로자', '퇴근 후 SNS·메신저를 통한 상시 업무지시 거부 불가', '퇴근 후 정당한 사유 없는 업무 연락 거부권 보장 및 반복 지시 시 근로감독 대상 지정', '2025-09-01', '공포후1년', 85, 1),
          ('2200555', 22, '골목상권 배달앱 불공정 수수료 상한 및 영세 자영업자 보호법', '소상공인', '음식점 및 배달 자영업자', '배달 플랫폼 입점업체에 일방적 중개 수수료 인상', '매출 구간별 차등 수수료율 상한제 도입 및 일방적 계약변경 금지', '2025-04-01', '공포후시행', 53, 1),
          ('2200666', 22, '기초연금 수급 기준 완화 및 중증질환 간병비 건보 적용법', '복지/시니어', '65세 이상 어르신 및 환자 가족', '사적 간병비 전액 환자 부담으로 간병 파산 발생', '간병서비스 단계적 건강보험 급여화 및 공공 요양병원 전면 확대', '2025-06-01', '공포후시행', 38, 1);
      `);
    }

    // 3. 유연한 카테고리 매칭 쿼리 구성
    let sql = `
      SELECT 
        chng_seq, bill_id, age, chng_nm, ctgr_se, tgt_cnts, bfor_cnts, aftr_cnts,
        DATE_FORMAT(opertn_dd, '%Y-%m-%d') AS opertn_dd,
        opertn_se, symp_cnt
      FROM bill_lvlhd_chng_mastr
      WHERE expyn = 1
    `;
    const params: any[] = [];

    if (ctgrParam && ctgrParam !== "ALL") {
      // 키워드 분리 매칭 (예: '직장/노동' -> '직장' 또는 '노동' 포함 여부)
      const keywords = ctgrParam.split(/[/·\s]+/).filter(Boolean);
      if (keywords.length > 0) {
        const likeClauses = keywords.map(() => `ctgr_se LIKE CONCAT('%', ?, '%')`).join(" OR ");
        sql += ` AND (${likeClauses})`;
        params.push(...keywords);
      }
    }

    sql += ` ORDER BY symp_cnt DESC, chng_seq DESC LIMIT 20;`;

    const [rows] = await pool.query<LifeChangeRow[]>(sql, params);
    return NextResponse.json({ changes: rows });
  } catch (error) {
    console.error("Failed to fetch life changes:", error);
    return NextResponse.json({ changes: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chngSeq = body.chng_seq;
    if (!chngSeq) {
      return NextResponse.json({ error: "chng_seq is required" }, { status: 400 });
    }

    await pool.query<ResultSetHeader>(
      `UPDATE bill_lvlhd_chng_mastr SET symp_cnt = symp_cnt + 1 WHERE chng_seq = ?`,
      [chngSeq]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to like life change:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}