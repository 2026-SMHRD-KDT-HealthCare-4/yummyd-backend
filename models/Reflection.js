const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Reflection', {
    // 공통
    EDU_delay_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },

    // 감정 리플렉션
    EMO_reflectionText: { type: DataTypes.TEXT },
    EMO_image:          { type: DataTypes.TEXT('long') },
    EMO_emoji:          { type: DataTypes.STRING },
    EMO_spell:          { type: DataTypes.STRING },

    // 학습 기록
    EDU_goal:           { type: DataTypes.STRING },
    EDU_achievement:    { type: DataTypes.STRING },
    EDU_learned:        { type: DataTypes.TEXT },
    EDU_confused:       { type: DataTypes.TEXT },
    EDU_review:         { type: DataTypes.TEXT },
    EDU_reflectionText: { type: DataTypes.TEXT('long') },
    EDU_image:          { type: DataTypes.TEXT('long') },
    EDU_char_count:     { type: DataTypes.INTEGER, defaultValue: 0 },
  });
};
