const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Analyses', {
    // 감정 확률
    happy_prob:       { type: DataTypes.FLOAT },
    fufill_prob:      { type: DataTypes.FLOAT },
    relief_prob:      { type: DataTypes.FLOAT },
    gratitude_prob:   { type: DataTypes.FLOAT },
    proud_prob:       { type: DataTypes.FLOAT },
    sad_prob:         { type: DataTypes.FLOAT },
    anxous_prob:      { type: DataTypes.FLOAT },
    defeat_prob:      { type: DataTypes.FLOAT },
    stress_prob:      { type: DataTypes.FLOAT },
    embarrassed_prob: { type: DataTypes.FLOAT },
    bored_prob:       { type: DataTypes.FLOAT },
    exhausted_prob:   { type: DataTypes.FLOAT },
    depressed_prob:   { type: DataTypes.FLOAT },

    // GPT 분석 결과
    gpt_EDU_summary: { type: DataTypes.TEXT },
    ers:             { type: DataTypes.FLOAT },

    // FK
    ReflectionId: { type: DataTypes.INTEGER },
  }, {
    tableName: 'Analyses',
    timestamps: true,
  });
};
