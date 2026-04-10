const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Reflection', {
    id: {
      type: DataTypes.INTEGER, // BIGINT에서 INTEGER로 변경 (호환성 확보)
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      field: 'UserId' // 실제 DB 컬럼명
    },
    originText: {
      type: DataTypes.TEXT,
      field: 'EMO_reflectionText' // 실제 DB 컬럼명
    },
    imageData: {
      type: DataTypes.TEXT('long'),
      field: 'EMO_image' // 실제 DB 컬럼명
    },
    emoji: {
      type: DataTypes.STRING,
      field: 'EMO_emoji'
    },
    spell: {
      type: DataTypes.STRING,
      field: 'EMO_spell'
    },
    // EDU 계열 필드들 추가 (DB에 존재함)
    eduGoal: { type: DataTypes.STRING, field: 'EDU_goal' },
    eduAchievement: { type: DataTypes.STRING, field: 'EDU_achievement' },
    eduLearned: { type: DataTypes.TEXT, field: 'EDU_learned' },
    eduConfused: { type: DataTypes.TEXT, field: 'EDU_confused' },
    eduReview: { type: DataTypes.TEXT, field: 'EDU_review' },
    eduReflectionText: { type: DataTypes.TEXT('long'), field: 'EDU_reflectionText' },
    eduImage: { type: DataTypes.TEXT('long'), field: 'EDU_image' },
    eduCharCount: { type: DataTypes.INTEGER, field: 'EDU_char_count', defaultValue: 0 },
    
    cumulativeDays: { type: DataTypes.INTEGER, field: 'cumulative_days', defaultValue: 0 },
    cumulativeAbsenceDays: { type: DataTypes.INTEGER, field: 'cumulative_absence_days', defaultValue: 0 },
    
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
