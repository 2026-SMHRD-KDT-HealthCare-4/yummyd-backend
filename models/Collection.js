const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Collection", {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    name: DataTypes.STRING,
    grade: DataTypes.STRING,
    item_type: DataTypes.STRING,
    image_url: DataTypes.STRING,
    video_url: DataTypes.STRING,
    weight: DataTypes.INTEGER,
    createdAt: {
      type: DataTypes.DATE,
      field: 'createdAt'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updatedAt'
    }
  }, {
    tableName: "Collections",
    timestamps: true,
    underscored: false
  });
};
