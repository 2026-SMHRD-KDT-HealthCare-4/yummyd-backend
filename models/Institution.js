const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Institution', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    login_id: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    inst_name: { type: DataTypes.STRING, allowNull: false },
    subscription_status: { 
      type: DataTypes.ENUM('free', 'pro', 'enterprise'), 
      defaultValue: 'free' 
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'Institutions'
  });
};
