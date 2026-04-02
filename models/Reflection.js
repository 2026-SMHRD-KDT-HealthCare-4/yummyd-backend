const { DataTypes, Sequelize } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Reflection', {
    original_text: { type: DataTypes.TEXT, allowNull: false },
    gpt_summary: { type: DataTypes.TEXT },
    image_data: { type: DataTypes.TEXT('long') }, // Base64 이미지 저장을 위한 롱텍스트
    delay_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
    analysis_status: { 
      type: DataTypes.ENUM('pending', 'analyzing', 'completed', 'failed'), 
      defaultValue: 'pending' 
    },
    submitted_at: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
  });
};
