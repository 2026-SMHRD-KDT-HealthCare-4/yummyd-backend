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

// --- 관계 설정 ---

// 1. Institution - Class (1:N)
Institution.hasMany(Class, { foreignKey: 'institution_id', as: 'classes' });
Class.belongsTo(Institution, { foreignKey: 'institution_id', as: 'institution' });

// 2. Class - User (1:N)
Class.hasMany(User, { foreignKey: 'class_id', as: 'students' });
User.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });

// 3. User - Reflection (1:N)
User.hasMany(Reflection, { foreignKey: 'user_id', as: 'reflections' });
Reflection.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 4. User - Collection (1:N)
User.hasMany(Collection, { foreignKey: 'user_id', as: 'collections' });
Collection.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 5. User - RiskMetric (1:N)
User.hasMany(RiskMetric, { foreignKey: 'user_id', as: 'RiskMetrics' });
RiskMetric.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 6. User - Intervention (1:N)
User.hasMany(Intervention, { foreignKey: 'user_id' });
Intervention.belongsTo(User, { foreignKey: 'user_id' });

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
