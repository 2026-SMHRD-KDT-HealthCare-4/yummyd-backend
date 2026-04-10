const { sequelize } = require('./models');

async function forceCreate() {
  console.log('--- [DEBUG] 테이블 강제 생성 테스트 ---');
  try {
    // 가장 기초적인 테이블 하나를 생성 시도
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`Debug_Test\` (
        \`id\` INT PRIMARY KEY AUTO_INCREMENT,
        \`test_val\` VARCHAR(10)
      ) ENGINE=InnoDB;
    `);
    console.log('✅ 테이블 생성 성공! (권한 문제 없음)');
    
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('현재 테이블 목록:', tables);
  } catch (error) {
    console.error('❌ 테이블 생성 실패!');
    console.error('에러 코드:', error.original ? error.original.code : 'Unknown');
    console.error('에러 메시지:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

forceCreate();
