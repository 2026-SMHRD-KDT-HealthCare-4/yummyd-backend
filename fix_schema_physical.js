const { sequelize } = require('./models');

async function fixPhysicalSchema() {
  console.log('--- [DBA] 물리 스키마 정합성 교정 시작 ---');
  try {
    // 1. 외래 키 제약 조건 일시 해제 (타입 변경을 위해)
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    // 2. Reflections.id를 INT로 변경 (Analyses.ReflectionId와 일치시킴)
    console.log('Reflections.id 타입을 INT로 변환 중...');
    await sequelize.query('ALTER TABLE `Reflections` MODIFY `id` INT AUTO_INCREMENT;');
    
    // 3. 다시 제약 조건 활성화
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    console.log('✅ 물리적 타입 일치 작업 완료 (INT <-> INT)');
  } catch (error) {
    console.error('❌ 스키마 교정 실패:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

fixPhysicalSchema();
