const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Institution', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    login_id: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    inst_name: { type: DataTypes.STRING(100), allowNull: false },
    subscription_status: { 
      type: DataTypes.ENUM('free', 'pro', 'enterprise'), 
      defaultValue: 'free' 
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'createdAt'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updatedAt'
    }
  }, {
    tableName: 'Institutions',
    timestamps: true,
    underscored: false
  });
};
