const { Reflection, Analyses, User, sequelize } = require('./models');

async function test() {
  console.log('--- 최종 검증 시작 ---');
  try {
    console.log('[1/2] getBoard 쿼리 테스트...');
    const board = await Reflection.findAll({ limit: 1, order: [['createdAt', 'DESC']] });
    console.log('✅ getBoard 쿼리 성공:', board.length, '건 조회됨');

    console.log('[2/2] getHistory 쿼리 테스트...');
    // 유효한 유저 ID가 없을 수 있으므로 where 조건 없이 include 테스트
    const history = await Reflection.findAll({
      limit: 1,
      include: [{ model: Analyses, as: 'Analysis' }],
      order: [['createdAt', 'DESC']]
    });
    console.log('✅ getHistory 쿼리 성공:', history.length, '건 조회됨');
  } catch (error) {
    console.error('❌ 에러 발생!');
    console.error('에러 메시지:', error.message);
    if (error.sql) console.error('실행된 SQL:', error.sql);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

test();
