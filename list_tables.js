const { sequelize } = require('./models');

async function listTables() {
  console.log('--- 전체 테이블 목록 조사 ---');
  try {
    const [results] = await sequelize.query('SHOW TABLES');
    console.log('실제 테이블 목록:');
    results.forEach(row => console.log(`- ${Object.values(row)[0]}`));
  } catch (error) {
    console.error('❌ 테이블 목록 조회 에러:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

listTables();
