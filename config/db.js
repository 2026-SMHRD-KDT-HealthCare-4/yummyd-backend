require('dotenv').config();

const dbConfig = {
  HOST: process.env.DB_HOST || '127.0.0.1',
  PORT: process.env.DB_PORT || 3306,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASS,
  DB: process.env.DB_NAME,
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
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
