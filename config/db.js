require('dotenv').config();

const dbConfig = {
  HOST: process.env.DB_HOST || '127.0.0.1',
  PORT: parseInt(process.env.DB_PORT || '3307', 10),
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASS,
  DB: process.env.DB_NAME,
  dialect: 'mysql',
  // [10년 차 아키텍트의 조언] 
  // 외부 원격 DB 연결 시 네트워크 지연을 방지하기 위해 
  // dialectOptions과 pool 설정을 세밀하게 조정함.
  dialectOptions: {
    connectTimeout: 60000, // 연결 타임아웃을 60초로 확장 (ETIMEDOUT 방지)
  },
  pool: {
    max: 10,       // 동시 접속자 대응을 위해 확장
    min: 0,
    acquire: 60000, // 연결 확보 대기 시간 확장
    idle: 10000
  },
  logging: false
};

// 필수 설정값 검증 (Fail-fast strategy)
if (!dbConfig.USER || !dbConfig.PASSWORD || !dbConfig.DB) {
  console.error(' [CRITICAL] Missing required Database Environment Variables! ');
  process.exit(1);
}

module.exports = dbConfig;
