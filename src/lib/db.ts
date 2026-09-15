import mysql, { Pool } from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var mysqlPool: Pool | undefined;
}

// 서버리스 컨테이너 웜 스타트(Warm Start) 시 커넥션 풀 재활용
const pool: Pool =
  global.mysqlPool ||
  mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "assembly_rank",
    waitForConnections: true,
    // [서버리스 최적화] 컨테이너 복제 시 DB 커넥션 고갈 방지를 위해 1~2개로 제한
    connectionLimit: 2,
    maxIdle: 2,
    idleTimeout: 30000, // 30초 이상 미사용 시 커넥션 반환
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

// 개발 및 프로덕션 서버리스 환경 공통으로 풀 인스턴스 보존
global.mysqlPool = pool;

export default pool;