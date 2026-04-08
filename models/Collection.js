const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "Collection",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true
      },
      name: DataTypes.STRING,
      grade: DataTypes.STRING,
      image_url: DataTypes.STRING,
      video_url: DataTypes.STRING,
      weight: DataTypes.INTEGER
    },
    {
      tableName: "Collections",
      timestamps: false
    }
  );
};