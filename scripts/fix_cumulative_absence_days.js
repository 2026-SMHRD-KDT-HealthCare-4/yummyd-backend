/**
 * 소급 수정 스크립트: cumulative_absence_days
 * - 기존: 첫 회고 제출일 기준 + UTC 날짜 오류
 * - 수정: 회원가입일(수강 시작일) 기준 + 로컬 날짜 기준
 *
 * 실행: node scripts/fix_cumulative_absence_days.js
 */

const { sequelize, User, Reflection } = require('../models');

const toLocalDateStr = (d) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const fix = async () => {
  await sequelize.authenticate();
  console.log('✅ DB 연결 성공');

  const users = await User.findAll({
    where: { role: 'student' },
    attributes: ['id', 'createdAt']
  });

  console.log(`👤 대상 학생 수: ${users.length}명`);

  let totalUpdated = 0;

  for (const user of users) {
    const reflections = await Reflection.findAll({
      where: { userId: user.id },
      order: [['createdAt', 'ASC']]
    });

    if (reflections.length === 0) continue;

    // 전체 날짜 목록 (순서대로)
    const allDateStrs = reflections.map(r => toLocalDateStr(r.createdAt));

    const firstDate = new Date(reflections[0].createdAt);
    firstDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < reflections.length; i++) {
      const reflection = reflections[i];
      const refDateStr = allDateStrs[i];

      // 이 회고 제출 시점까지 작성된 고유 날짜 집합
      const writtenDays = new Set(allDateStrs.slice(0, i + 1));

      // 첫 회고 제출일~이 회고 날짜 사이 미작성 일수 계산
      let absenceDays = 0;
      const cursor = new Date(firstDate);
      while (toLocalDateStr(cursor) <= refDateStr) {
        if (!writtenDays.has(toLocalDateStr(cursor))) absenceDays++;
        cursor.setDate(cursor.getDate() + 1);
      }

      await reflection.update({ cumulativeAbsenceDays: absenceDays });
      totalUpdated++;
    }

    console.log(`  ✔ User ${user.id}: ${reflections.length}개 레코드 업데이트`);
  }

  console.log(`\n✅ 완료 — 총 ${totalUpdated}개 레코드 수정`);
  process.exit(0);
};

fix().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
