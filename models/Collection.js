const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Collection', {
    item_id: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    item_type: { 
      type: DataTypes.ENUM('hat', 'glass', 'accessory', 'background'), 
      allowNull: false 
    },
    is_equipped: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false 
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'Collections'
  });
};
