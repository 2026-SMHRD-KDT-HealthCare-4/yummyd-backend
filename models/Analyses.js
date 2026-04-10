const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Analyses', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    happyProb:       { type: DataTypes.FLOAT, field: 'happy_prob' },
    fulfillProb:     { type: DataTypes.FLOAT, field: 'fulfill_prob' }, // fulfill_prob로 매핑
    fufillProb_old:  { type: DataTypes.FLOAT, field: 'fufill_prob' },  // DB 오타 필드 유지
    reliefProb:      { type: DataTypes.FLOAT, field: 'relief_prob' },
    gratitudeProb:   { type: DataTypes.FLOAT, field: 'gratitude_prob' },
    proudProb:       { type: DataTypes.FLOAT, field: 'proud_prob' },
    sadProb:         { type: DataTypes.FLOAT, field: 'sad_prob' },
    anxiousProb:     { type: DataTypes.FLOAT, field: 'anxious_prob' },
    anxousProb_old:  { type: DataTypes.FLOAT, field: 'anxous_prob' },  // DB 오타 필드 유지
    defeatProb:      { type: DataTypes.FLOAT, field: 'defeat_prob' },
    stressProb:      { type: DataTypes.FLOAT, field: 'stress_prob' },
    embarrassedProb: { type: DataTypes.FLOAT, field: 'embarrassed_prob' },
    boredProb:       { type: DataTypes.FLOAT, field: 'bored_prob' },
    exhaustedProb:   { type: DataTypes.FLOAT, field: 'exhausted_prob' },
    depressedProb:   { type: DataTypes.FLOAT, field: 'depressed_prob' },
    gptEduSummary:   { type: DataTypes.TEXT,  field: 'gpt_EDU_summary' },
    ers:             { type: DataTypes.FLOAT, field: 'ers' },
    cer:             { type: DataTypes.FLOAT, field: 'cer' },
    dropoutProb:     { type: DataTypes.FLOAT, field: 'dropout_prob' },
    reflectionId:    { type: DataTypes.INTEGER, field: 'ReflectionId', allowNull: false }, // 수동 쿼리 반영
    userId:          { type: DataTypes.INTEGER, field: 'UserId' },
    
    createdAt: { type: DataTypes.DATE, field: 'createdAt' },
    updatedAt: { type: DataTypes.DATE, field: 'updatedAt' }
  }, {
    tableName: 'Analyses',
    timestamps: true,
    underscored: false
  });
};
