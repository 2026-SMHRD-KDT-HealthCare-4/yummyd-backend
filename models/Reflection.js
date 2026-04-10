const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Reflection', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id' // 실제 DB 컬럼명
    },
    origin_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    gpt_summary: { type: DataTypes.TEXT },
    rep_emotion: { type: DataTypes.STRING(20) },
    sentiment_score: { type: DataTypes.DECIMAL(5, 4) },
    daily_risk: { type: DataTypes.DECIMAL(5, 2) },
    keywords: { type: DataTypes.JSON },
    happy_prob:       { type: DataTypes.DECIMAL(5, 4) },
    sad_prob:         { type: DataTypes.DECIMAL(5, 4) },
    angry_prob:       { type: DataTypes.DECIMAL(5, 4) },
    heartache_prob:   { type: DataTypes.DECIMAL(5, 4) },
    anxious_prob:     { type: DataTypes.DECIMAL(5, 4) },
    embarrassed_prob: { type: DataTypes.DECIMAL(5, 4) },
    cumulative_days: { type: DataTypes.INTEGER, defaultValue: 0 },
    cumulative_absence_days: { type: DataTypes.INTEGER, defaultValue: 0 },
    image_data: { type: DataTypes.TEXT('long') },
    is_private: { type: DataTypes.BOOLEAN, defaultValue: false },
    analysis_status: {
      type: DataTypes.ENUM('pending', 'analyzing', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    submitted_at: { 
      type: DataTypes.DATE, 
      defaultValue: DataTypes.NOW,
      field: 'submitted_at'
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
    tableName: 'Reflections',
    timestamps: true,
    underscored: false
  });
};
