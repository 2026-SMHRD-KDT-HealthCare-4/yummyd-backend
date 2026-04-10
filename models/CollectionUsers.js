const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "CollectionUsers",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      collection_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      is_equipped: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      tableName: "Collections_Users",
      timestamps: false,
      underscored: false
    }
  );
};
