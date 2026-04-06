const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('EmotionLog', {
    happy_prob: { type: DataTypes.DECIMAL(5, 4) },
    sad_prob: { type: DataTypes.DECIMAL(5, 4) },
    angry_prob: { type: DataTypes.DECIMAL(5, 4) },
    heartache_prob: { type: DataTypes.DECIMAL(5, 4) },
    anxious_prob: { type: DataTypes.DECIMAL(5, 4) },
    embarrassed_prob: { type: DataTypes.DECIMAL(5, 4) },
    dominant_emotion: { type: DataTypes.STRING }
  });
};
