const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Analyses', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
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
    ers:              { type: DataTypes.FLOAT },
    cer:              { type: DataTypes.FLOAT },
    dropout_prob:     { type: DataTypes.FLOAT },
    gpt_EDU_summary:  { type: DataTypes.TEXT },
    ReflectionId: { 
      type: DataTypes.INTEGER, 
      field: 'ReflectionId' // DB 컬럼명 강제 지정
    },
    UserId: { 
      type: DataTypes.INTEGER, 
      field: 'UserId' // DB 컬럼명 강제 지정
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'createdAt'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updatedAt'
    }
  }, {
    tableName: 'Analyses',
    timestamps: true,
    underscored: false
  });
};
