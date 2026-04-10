const { sequelize } = require('./models');

async function analyzeTable(tableName) {
  console.log(`--- [${tableName}] 상세 분석 ---`);
  try {
    const [columns] = await sequelize.query(`SHOW COLUMNS FROM \`${tableName}\``);
    console.table(columns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default
    })));
  } catch (error) {
    console.error(`❌ ${tableName} 분석 에러:`, error.message);
  }
}

async function main() {
  await analyzeTable('Reflections');
  await analyzeTable('Analyses');
  await analyzeTable('Users');
  await sequelize.close();
  process.exit();
}

main();
