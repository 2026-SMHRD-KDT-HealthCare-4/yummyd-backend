const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('User', {
    login_id: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false }, // 제안서의 NAME
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    role: { 
      type: DataTypes.ENUM('student', 'admin', 'instructor'), 
      defaultValue: 'student' 
    },
    enroll_status: {
      type: DataTypes.ENUM('active', 'dropout', 'graduated'),
      defaultValue: 'active'
    },
    class_id: { type: DataTypes.INTEGER },
    
    // 보상 시스템 (Yummy)
    current_candy_count: { // CANDY_NOW
      type: DataTypes.INTEGER, 
      defaultValue: 0, 
      validate: { min: 0, max: 15 } 
    },
    total_candy_count: { // CANDY_TOTAL
      type: DataTypes.INTEGER, 
      defaultValue: 0 
    },
    streak: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0 
    },
    last_attendance_date: {
      type: DataTypes.DATEONLY
    }
  }, {
    timestamps: false
  });
};
