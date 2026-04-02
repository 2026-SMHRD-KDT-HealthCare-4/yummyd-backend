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
    enroll_status: { // 제안서의 ENROLL_STATUS
      type: DataTypes.ENUM('active', 'dropout', 'graduated'), 
      defaultValue: 'active' 
    },
    institution_id: { type: DataTypes.INTEGER },
    class_id: { type: DataTypes.INTEGER }, // 기존 group_id 대체
    
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
    
    // 학습 태도 및 이탈 예측 지표
    last_login_at: { type: DataTypes.DATE },
    attendance_days: { type: DataTypes.INTEGER, defaultValue: 0 },
    streak: { type: DataTypes.INTEGER, defaultValue: 0 },
    
    // 법적 동의
    privacy_consent: { type: DataTypes.BOOLEAN, defaultValue: false },
    third_party_consent: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'Users'
  });
};
