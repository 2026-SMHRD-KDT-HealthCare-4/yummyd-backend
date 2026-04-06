const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Intervention', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    trigger_reason: { type: DataTypes.STRING },
    is_resolved: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'Interventions'
  });
};
