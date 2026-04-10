const { sequelize } = require('./models');

async function checkTable() {
  console.log('--- Reflections 테이블 컬럼 조사 ---');
  try {
    const [results] = await sequelize.query('SHOW COLUMNS FROM Reflections');
    console.log('실제 컬럼 목록:');
    results.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
  } catch (error) {
    console.error('❌ 테이블 조회 에러:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

checkTable();
