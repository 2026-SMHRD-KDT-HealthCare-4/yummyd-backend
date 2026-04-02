const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Intervention', {
    trigger_reason: { type: DataTypes.STRING },
    chatbot_transcript: { type: DataTypes.JSON },
    is_resolved: { type: DataTypes.BOOLEAN, defaultValue: false }
  });
};
