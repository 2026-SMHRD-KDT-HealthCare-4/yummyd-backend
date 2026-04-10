const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db');

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  dialect: dbConfig.dialect,
  dialectOptions: dbConfig.dialectOptions,
  pool: dbConfig.pool,
  logging: false, // 10년 차 아키텍트의 조언: 운영 환경에선 쿼리 로깅을 끄는 것이 성능에 유리함
  timezone: '+09:00' // 한국 시간 설정
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// 모델 로드
db.Institution = require('./Institution')(sequelize);
db.Class = require('./Class')(sequelize);
db.User = require('./User')(sequelize);
db.Reflection = require('./Reflection')(sequelize);
db.Analyses = require('./Analyses')(sequelize);
db.Collection = require('./Collection')(sequelize);
db.CollectionUsers = require('./CollectionUsers')(sequelize);

// --- 관계 설정 (Associations) ---

// 1. Institution - Classes (1:N)
db.Institution.hasMany(db.Class, { foreignKey: 'institution_id', onDelete: 'CASCADE' });
db.Class.belongsTo(db.Institution, { foreignKey: 'institution_id' });

// 2. Institution - Users (1:N)
db.Institution.hasMany(db.User, { foreignKey: 'institution_id', onDelete: 'SET NULL' });
db.User.belongsTo(db.Institution, { foreignKey: 'institution_id' });

// 3. Class - Users (1:N)
db.Class.hasMany(db.User, { foreignKey: 'class_id', onDelete: 'SET NULL' });
db.User.belongsTo(db.Class, { foreignKey: 'class_id' });

// 4. User - Reflections (1:N)
db.User.hasMany(db.Reflection, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.Reflection.belongsTo(db.User, { foreignKey: 'userId' });

// 5. Reflection - Analyses (1:1 or 1:N)
db.Reflection.hasOne(db.Analyses, { foreignKey: 'ReflectionId', as: 'Analysis', onDelete: 'CASCADE' });
db.Analyses.belongsTo(db.Reflection, { foreignKey: 'ReflectionId' });

// 6. User - Analyses (1:N)
db.User.hasMany(db.Analyses, { foreignKey: 'UserId', onDelete: 'CASCADE' });
db.Analyses.belongsTo(db.User, { foreignKey: 'UserId' });

// 7. Collection - Users (M:N via CollectionUsers)
db.Collection.hasMany(db.CollectionUsers, { foreignKey: 'collection_id' });
db.CollectionUsers.belongsTo(db.Collection, { foreignKey: 'collection_id' });
db.User.hasMany(db.CollectionUsers, { foreignKey: 'user_id' });
db.CollectionUsers.belongsTo(db.User, { foreignKey: 'user_id' });

module.exports = db;
