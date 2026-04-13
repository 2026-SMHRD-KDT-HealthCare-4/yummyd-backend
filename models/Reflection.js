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
      field: 'UserId'
    },
    EMO_reflectionText: {
      type: DataTypes.TEXT,
      field: 'EMO_reflectionText'
    },
    EMO_image: {
      type: DataTypes.TEXT('long'),
      field: 'EMO_image'
    },
    EMO_emoji: {
      type: DataTypes.STRING,
      field: 'EMO_emoji'
    },
    EMO_spell: {
      type: DataTypes.STRING,
      field: 'EMO_spell'
    },
    EDU_goal:           { type: DataTypes.STRING,       field: 'EDU_goal' },
    EDU_achievement:    { type: DataTypes.STRING,       field: 'EDU_achievement' },
    EDU_learned:        { type: DataTypes.TEXT,         field: 'EDU_learned' },
    EDU_confused:       { type: DataTypes.TEXT,         field: 'EDU_confused' },
    EDU_review:         { type: DataTypes.TEXT,         field: 'EDU_review' },
    EDU_reflectionText: { type: DataTypes.TEXT('long'), field: 'EDU_reflectionText' },
    EDU_image:          { type: DataTypes.TEXT('long'), field: 'EDU_image' },
    EDU_char_count:     { type: DataTypes.INTEGER,      field: 'EDU_char_count', defaultValue: 0 },
    EDU_delay_time:     { type: DataTypes.INTEGER,      field: 'EDU_delay_time', defaultValue: 0 },

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
