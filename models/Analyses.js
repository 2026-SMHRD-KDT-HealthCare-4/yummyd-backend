const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Analyses', {
    // 감정 확률 (KOTE 13종)
    happy_prob:       { type: DataTypes.FLOAT },
    fulfill_prob:     { type: DataTypes.FLOAT },
    relief_prob:      { type: DataTypes.FLOAT },
    gratitude_prob:   { type: DataTypes.FLOAT },
    proud_prob:       { type: DataTypes.FLOAT },
    sad_prob:         { type: DataTypes.FLOAT },
    anxious_prob:     { type: DataTypes.FLOAT },
    defeat_prob:      { type: DataTypes.FLOAT },
    stress_prob:      { type: DataTypes.FLOAT },
    embarrassed_prob: { type: DataTypes.FLOAT },
    bored_prob:       { type: DataTypes.FLOAT },
    exhausted_prob:   { type: DataTypes.FLOAT },
    depressed_prob:   { type: DataTypes.FLOAT },

    // 분석 결과 지표
    ers:             { type: DataTypes.FLOAT }, // 감정 회복 점수
    cer:             { type: DataTypes.FLOAT }, // 누적 감정 위험 지수
    dropout_prob:    { type: DataTypes.FLOAT }, // 중도이탈 확률

    // GPT 분석 결과
    gpt_EDU_summary: { type: DataTypes.TEXT },

    // FK (Reflections 및 Users 관계)
    ReflectionId:    { type: DataTypes.INTEGER },
    UserId:          { type: DataTypes.INTEGER },
  }, {
    tableName: 'Analyses',
    timestamps: true,
  });
};
