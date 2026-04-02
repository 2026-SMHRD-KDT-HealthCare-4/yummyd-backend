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

const User = require('./User')(sequelize);
const Group = require('./Group')(sequelize);
const Reflection = require('./Reflection')(sequelize);
const EmotionLog = require('./EmotionLog')(sequelize);
const RiskMetric = require('./RiskMetric')(sequelize);
const Intervention = require('./Intervention')(sequelize);
const Collection = require('./Collection')(sequelize);

// 관계 설정
User.hasMany(Reflection);
Reflection.belongsTo(User);

User.hasMany(Collection);
Collection.belongsTo(User);

Reflection.hasOne(EmotionLog);
EmotionLog.belongsTo(Reflection);


User.hasMany(RiskMetric);
RiskMetric.belongsTo(User);

User.hasMany(Intervention);
Intervention.belongsTo(User);

// 기관-그룹-수강생 관계 추가
User.hasMany(Group, { as: 'ManagedGroups', foreignKey: 'institution_id' });
Group.belongsTo(User, { as: 'Institution', foreignKey: 'institution_id' });

Group.hasMany(User, { as: 'Students', foreignKey: 'group_id' });
User.belongsTo(Group, { as: 'StudentGroup', foreignKey: 'group_id' });

module.exports = {
  sequelize,
  User,
  Group,
  Reflection,
  EmotionLog,
  RiskMetric,
  Intervention,
  Collection
};
