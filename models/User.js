const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    login_id: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    username: { type: DataTypes.STRING(50), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    role: { 
      type: DataTypes.ENUM('student', 'institution', 'instructor', 'admin'), 
      defaultValue: 'student' 
    },
    enroll_status: {
      type: DataTypes.ENUM('active', 'dropout', 'graduated'),
      defaultValue: 'active'
    },
    institution_id: { type: DataTypes.INTEGER, field: 'institution_id' },
    class_id: { type: DataTypes.INTEGER, field: 'class_id' },
    current_candy_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    total_candy_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    attendance_days: { type: DataTypes.INTEGER, defaultValue: 0 },
    streak: { type: DataTypes.INTEGER, defaultValue: 0 },
    privacy_consent: { type: DataTypes.BOOLEAN, defaultValue: false },
    third_party_consent: { type: DataTypes.BOOLEAN, defaultValue: false },
    consultation_note: { type: DataTypes.TEXT, defaultValue: null },
    createdAt: {
      type: DataTypes.DATE,
      field: 'createdAt' // DB 컬럼명에 맞춤
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updatedAt' // DB 컬럼명에 맞춤
    }
  }, {
    tableName: 'Users',
    timestamps: true,
    underscored: false
  });
};
