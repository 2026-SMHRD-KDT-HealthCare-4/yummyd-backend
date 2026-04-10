const { sequelize } = require('./models');

async function cleanupAndEnforceFK() {
  console.log('--- [DBA] 데이터 정합성(Referential Integrity) 복구 시작 ---');
  try {
    // 1. 제약 조건 일시 해제
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    // 2. 유령 데이터(Orphaned Rows) 식별 및 삭제
    console.log('부모(Reflections) 없는 자식(Analyses) 데이터 조회 중...');
    const [orphans] = await sequelize.query(`
      SELECT id, ReflectionId FROM Analyses 
      WHERE ReflectionId NOT IN (SELECT id FROM Reflections)
    `);
    
    if (orphans.length > 0) {
      console.log(`⚠️ 유령 데이터 ${orphans.length}건 발견. 삭제를 진행합니다.`);
      await sequelize.query(`
        DELETE FROM Analyses 
        WHERE ReflectionId NOT IN (SELECT id FROM Reflections)
      `);
      console.log('✅ 유령 데이터 삭제 완료.');
    } else {
      console.log('✅ 삭제할 유령 데이터가 없습니다.');
    }

    // 3. 외래 키 제약 조건 수동 생성 (명시적 강제 수립)
    console.log('외래 키 제약 조건(Analyses_ibfk_1) 수동 생성 중...');
    try {
      await sequelize.query(`
        ALTER TABLE \`Analyses\` 
        ADD CONSTRAINT \`Analyses_ibfk_1\` 
        FOREIGN KEY (\`ReflectionId\`) REFERENCES \`Reflections\` (\`id\`) 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log('✅ 외래 키 제약 조건 생성 성공.');
    } catch (fkError) {
      if (fkError.message.includes('already exists')) {
        console.log('ℹ️ 이미 제약 조건이 존재합니다. 생략합니다.');
      } else {
        throw fkError;
      }
    }

    // 4. 제약 조건 다시 활성화
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    console.log('🚀 DB 데이터 정합성 복구 작업이 최종 완료되었습니다.');
  } catch (error) {
    console.error('❌ 복구 작업 중 치명적 오류 발생:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

cleanupAndEnforceFK();
