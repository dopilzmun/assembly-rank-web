import { Metadata } from "next";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import LivePipelineDashboard, { PipelineFeedItem } from "@/components/LivePipelineDashboard";
import { BillRankingRow } from "@/types/ranking";

export const revalidate = 3600; // 1시간 주기 갱신
const CURRENT_AGE = 22;

export const metadata: Metadata = {
  title: `실시간 입법 파이프라인 피드 | 제${CURRENT_AGE}대 국회`,
  description: `제${CURRENT_AGE}대 국회의 신규 발의, 상임위 상정, 본회의 실질가결 법안 흐름을 실시간으로 추적합니다.`,
};

export default async function LivePage() {
  const connection = await pool.getConnection();
  try {
    // 1. 최근 14일간 레이더 지표 집계 (발의, 상정, 가결)
    const [metricRows] = await connection.query<RowDataPacket[]>(
      `SELECT
        COUNT(CASE WHEN motn_dd >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY) THEN 1 END) AS new_motn_cnt,
        COUNT(CASE WHEN cmt_present_dd >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY) THEN 1 END) AS new_present_cnt,
        COUNT(CASE WHEN process_dd >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY) 
                    AND (process_stat LIKE '%가결%' OR process_stat LIKE '%반영폐기%') THEN 1 END) AS new_passed_cnt
      FROM bill_tr
      WHERE age = ?;`,
      [CURRENT_AGE]
    );

    const m = metricRows[0] || {};
    const radarMetrics = {
      newMotnCnt: Number(m.new_motn_cnt) || 0,
      newPresentCnt: Number(m.new_present_cnt) || 0,
      newPassedCnt: Number(m.new_passed_cnt) || 0,
    };

    // 2. 최근 14일간 최다 발의 의원 (Movers) TOP 3
    const [moverRows] = await connection.query<RowDataPacket[]>(
      `SELECT 
        m.assemb_id,
        m.assemb_nm,
        m.pltprt_nm,
        COUNT(*) AS cnt
      FROM bill_tr b
      JOIN assemb_mastr m ON b.repve_assemb_id = m.assemb_id AND b.age = m.age
      WHERE b.age = ? AND b.motn_dd >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
      GROUP BY m.assemb_id, m.assemb_nm, m.pltprt_nm
      ORDER BY cnt DESC, m.assemb_nm ASC
      LIMIT 3;`,
      [CURRENT_AGE]
    );

    const topMovers = moverRows.map((r) => ({
      assemb_id: r.assemb_id,
      assemb_nm: r.assemb_nm,
      pltprt_nm: r.pltprt_nm,
      cnt: Number(r.cnt),
    }));

    // 3. [핵심] 이벤트별 최신 25건 조회 (가결: process_dd 기준, 상정: cmt_present_dd 기준, 발의: motn_dd 기준)
    
    // 3-A. 가결 피드 (의결일 최신순)
    const [passedRows] = await connection.query<RowDataPacket[]>(
      `SELECT 
        b.bill_id,
        b.bill_nm,
        b.curr_cmit_nm,
        DATE_FORMAT(b.process_dd, '%m-%d') AS event_date,
        DATE_FORMAT(b.process_dd, '%Y-%m-%d') AS raw_date,
        'passed' AS event_type,
        CASE 
          WHEN b.process_stat LIKE '%반영폐기%' THEN '본회의 대안반영'
          ELSE '본회의 가결'
        END AS status_text,
        m.assemb_id,
        m.assemb_nm,
        m.pltprt_nm
      FROM bill_tr b
      JOIN assemb_mastr m ON b.repve_assemb_id = m.assemb_id AND b.age = m.age
      WHERE b.age = ? 
        AND (b.process_stat LIKE '%가결%' OR b.process_stat LIKE '%반영폐기%')
        AND b.process_dd IS NOT NULL
      ORDER BY b.process_dd DESC, b.bill_id DESC
      LIMIT 25;`,
      [CURRENT_AGE]
    );

    // 3-B. 상정 피드 (상임위 상정일 최신순)
    const [presentRows] = await connection.query<RowDataPacket[]>(
      `SELECT 
        b.bill_id,
        b.bill_nm,
        b.curr_cmit_nm,
        DATE_FORMAT(b.cmt_present_dd, '%m-%d') AS event_date,
        DATE_FORMAT(b.cmt_present_dd, '%Y-%m-%d') AS raw_date,
        'present' AS event_type,
        CONCAT(COALESCE(b.curr_cmit_nm, '상임위'), ' 상정') AS status_text,
        m.assemb_id,
        m.assemb_nm,
        m.pltprt_nm
      FROM bill_tr b
      JOIN assemb_mastr m ON b.repve_assemb_id = m.assemb_id AND b.age = m.age
      WHERE b.age = ? AND b.cmt_present_dd IS NOT NULL
      ORDER BY b.cmt_present_dd DESC, b.bill_id DESC
      LIMIT 25;`,
      [CURRENT_AGE]
    );

    // 3-C. 발의 피드 (발의일 최신순)
    const [motnRows] = await connection.query<RowDataPacket[]>(
      `SELECT 
        b.bill_id,
        b.bill_nm,
        b.curr_cmit_nm,
        DATE_FORMAT(b.motn_dd, '%m-%d') AS event_date,
        DATE_FORMAT(b.motn_dd, '%Y-%m-%d') AS raw_date,
        'motn' AS event_type,
        COALESCE(b.curr_cmit_nm, '상임위 회부') AS status_text,
        m.assemb_id,
        m.assemb_nm,
        m.pltprt_nm
      FROM bill_tr b
      JOIN assemb_mastr m ON b.repve_assemb_id = m.assemb_id AND b.age = m.age
      WHERE b.age = ?
      ORDER BY b.motn_dd DESC, b.bill_id DESC
      LIMIT 25;`,
      [CURRENT_AGE]
    );

    // 3-D. 전체 피드: 세 카테고리를 이벤트 발생일(raw_date) 기준으로 병합 정렬하여 최신 25건 추출
    const motnList = motnRows as PipelineFeedItem[];
    const presentList = presentRows as PipelineFeedItem[];
    const passedList = passedRows as PipelineFeedItem[];

    const combinedAll = [...passedList, ...presentList, ...motnList]
      .sort((a, b) => (b.raw_date || "").localeCompare(a.raw_date || ""))
      .slice(0, 25);

    // 4. 의원 성적표 Drawer 연동용 전체 의원 뷰 조회
    const [allMemberRows] = await connection.query<RowDataPacket[]>(
      `SELECT 
        assemb_id, age, assemb_nm, pltprt_nm, rgn_nm, cmit_nm,
        DATE_FORMAT(term_start_dd, '%Y-%m-%d') AS term_start_dd,
        is_deferred, monthly_pace, ttl_motn_cnt, pure_aprv_cnt, alt_aprv_cnt,
        aprv_cnt, dss_cnt, aprv_rate, cmt_present_cnt, cmt_present_rate,
        avg_cmt_days, own_cmit_motn_cnt, own_cmit_motn_rate, score, rnkg
      FROM vw_bill_efct_rnkg_01
      WHERE age = ?;`,
      [CURRENT_AGE]
    );

    return (
      <main className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <LivePipelineDashboard
            radarMetrics={radarMetrics}
            topMovers={topMovers}
            feeds={{
              all: combinedAll,
              motn: motnList,
              present: presentList,
              passed: passedList,
            }}
            allMembers={allMemberRows as BillRankingRow[]}
          />
        </div>
      </main>
    );
  } catch (error) {
    console.error("Failed to load live pipeline feed:", error);
    return (
      <main className="py-12 px-4 text-center text-slate-500">
        데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
      </main>
    );
  } finally {
    connection.release();
  }
}