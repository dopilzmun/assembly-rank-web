import mysql, { Pool } from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: Pool | undefined;
}

// 서버리스 컨테이너 웜 스타트(Warm Start) 시 커넥션 풀 재활용
const pool: Pool =
  global._mysqlPool ||
  mysql.createPool({
    host: process.env.TIDB_HOST,
    port: Number(process.env.TIDB_PORT) || 4000,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    // [TiDB Cloud 필수 보안 설정]
    ssl: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: true,
    },
    waitForConnections: true,
    // [서버리스 커넥션 최적화] 다중 컨테이너 복제 시 동시 접속 제한 방어
    connectionLimit: 2,
    maxIdle: 2,
    idleTimeout: 30000, // 30초 유휴 시 커넥션 정리
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

// 프로덕션 서버리스 및 로컬 개발 환경 모두에서 전역 풀 인스턴스 보존
global._mysqlPool = pool;

export default pool;