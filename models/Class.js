const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Class', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    class_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    institution_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    start_date: { type: DataTypes.DATEONLY },
    end_date: { type: DataTypes.DATEONLY }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'Classes'
  });
};
