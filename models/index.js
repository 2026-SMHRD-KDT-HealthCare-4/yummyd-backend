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
const Analyses = require('./Analyses')(sequelize);
const Collection = require('./Collection')(sequelize);

// 관계 설정 (constraints: false → 공유 DB FK 타입 충돌 방지)
const noFK = { constraints: false };

User.hasMany(Reflection, noFK);
Reflection.belongsTo(User, noFK);

Reflection.hasOne(Analyses, noFK);
Analyses.belongsTo(Reflection, noFK);

User.hasMany(Analyses, noFK);
Analyses.belongsTo(User, noFK);

User.hasMany(Collection, noFK);
Collection.belongsTo(User, noFK);


// Institutions → Classes → Users 계층 관계
Institution.hasMany(Class, { foreignKey: 'institution_id', ...noFK });
Class.belongsTo(Institution, { foreignKey: 'institution_id', ...noFK });

Class.hasMany(User, { as: 'Students', foreignKey: 'class_id', ...noFK });
User.belongsTo(Class, { as: 'StudentClass', foreignKey: 'class_id', ...noFK });


module.exports = {
  sequelize,
  Institution,
  Class,
  User,
  Reflection,
  Analyses,
  Collection
};
