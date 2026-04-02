const { DataTypes, Sequelize } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Reflection', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    origin_text: { type: DataTypes.TEXT, allowNull: false },
    gpt_summary: { type: DataTypes.TEXT },
    rep_emotion: { type: DataTypes.STRING }, // 대표 감정
    sentiment_score: { type: DataTypes.DECIMAL(5, 4) }, // 감정 점수 (수치화)
    daily_risk: { type: DataTypes.DECIMAL(5, 2) }, // 일일 위험도 (이탈 예측용)
    keywords: { type: DataTypes.JSON }, // 핵심 키워드 리스트
    
    // 기존 EmotionLog 통합 필드 (KcELECTRA 결과)
    happy_prob: { type: DataTypes.DECIMAL(5, 4) },
    sad_prob: { type: DataTypes.DECIMAL(5, 4) },
    angry_prob: { type: DataTypes.DECIMAL(5, 4) },
    heartache_prob: { type: DataTypes.DECIMAL(5, 4) },
    anxious_prob: { type: DataTypes.DECIMAL(5, 4) },
    embarrassed_prob: { type: DataTypes.DECIMAL(5, 4) },
    
    image_data: { type: DataTypes.TEXT('long') },
    is_private: { type: DataTypes.BOOLEAN, defaultValue: false },
    analysis_status: { 
      type: DataTypes.ENUM('pending', 'analyzing', 'completed', 'failed'), 
      defaultValue: 'pending' 
    },
    submitted_at: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'Reflections'
  });
};
