const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('RiskMetric', {
    daily_ers: { type: DataTypes.DECIMAL(6, 4) },
    cumulative_cer: { type: DataTypes.DECIMAL(6, 4) },
    dropout_prob: { type: DataTypes.DECIMAL(5, 4) },
    is_alert: { type: DataTypes.BOOLEAN, defaultValue: false }
  });
};
