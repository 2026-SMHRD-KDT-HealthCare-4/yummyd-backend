const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db');

const sequelize = new Sequelize(
  dbConfig.DB,
  dbConfig.USER,
  dbConfig.PASSWORD,
  {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool
  }
);

const Institution = require('./Institution')(sequelize);
const Class = require('./Class')(sequelize);
const User = require('./User')(sequelize);
const Reflection = require('./Reflection')(sequelize);
const RiskMetric = require('./RiskMetric')(sequelize);
const Intervention = require('./Intervention')(sequelize);
const Collection = require('./Collection')(sequelize);

// 관계 설정 (constraints: false → 공유 DB FK 타입 충돌 방지)
const noFK = { constraints: false };

User.hasMany(Reflection, noFK);
Reflection.belongsTo(User, noFK);

User.hasMany(Collection, noFK);
Collection.belongsTo(User, noFK);

// Reflection.hasOne(EmotionLog, noFK);
// EmotionLog.belongsTo(Reflection, noFK);

User.hasMany(RiskMetric, noFK);
RiskMetric.belongsTo(User, noFK);

User.hasMany(Intervention, noFK);
Intervention.belongsTo(User, noFK);

// 기관-그룹-수강생 관계 추가
User.hasMany(Class, { as: 'ManagedGroups', foreignKey: 'institution_id', ...noFK });
Class.belongsTo(User, { as: 'Institution', foreignKey: 'institution_id', ...noFK });

Class.hasMany(User, { as: 'Students', foreignKey: 'group_id', ...noFK });
User.belongsTo(Class, { as: 'StudentGroup', foreignKey: 'group_id', ...noFK });

// User.hasMany(Group, { as: 'ManagedGroups', foreignKey: 'institution_id', ...noFK });
// Group.belongsTo(User, { as: 'Institution', foreignKey: 'institution_id', ...noFK });

// Group.hasMany(User, { as: 'Students', foreignKey: 'group_id', ...noFK });
// User.belongsTo(Group, { as: 'StudentGroup', foreignKey: 'group_id', ...noFK });

module.exports = {
  sequelize,
  Institution,
  Class,
  User,
  Reflection,
  RiskMetric,
  Intervention,
  Collection
};
