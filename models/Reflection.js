const { DataTypes, Sequelize } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Reflection', {
    original_text: { type: DataTypes.TEXT, allowNull: true },
    gpt_summary: { type: DataTypes.TEXT },
    image_data: { type: DataTypes.TEXT('long') },
    delay_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
    analysis_status: {
      type: DataTypes.ENUM('pending', 'analyzing', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    submitted_at: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },

    // 감정 리플렉션
    emotion_emoji:  { type: DataTypes.STRING },
    selected_spell: { type: DataTypes.STRING },

    // 학습 기록
    today_goal:  { type: DataTypes.STRING },
    achievement: { type: DataTypes.STRING },
    learned:     { type: DataTypes.TEXT },
    confused:    { type: DataTypes.TEXT },
    review:      { type: DataTypes.TEXT },
    free_text:   { type: DataTypes.TEXT('long') },
    study_image: { type: DataTypes.TEXT('long') },
  });
};
