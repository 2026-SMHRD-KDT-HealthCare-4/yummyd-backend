const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('User', {
    login_id: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    role: { 
      type: DataTypes.ENUM('student', 'institution', 'instructor'), 
      defaultValue: 'student' 
    },
    status: { 
      type: DataTypes.ENUM('active', 'dropout', 'graduated'), 
      defaultValue: 'active' 
    },
    organization_name: { type: DataTypes.STRING },
    institution_id: { type: DataTypes.INTEGER }, // 소속 기관 ID
    group_id: { type: DataTypes.INTEGER },       // 소속 그룹 ID
    cohort_id: { type: DataTypes.INTEGER },
    admission_score: { type: DataTypes.DECIMAL(5, 2) },
    
    // 법적 동의 관련 필드
    privacy_consent: { type: DataTypes.BOOLEAN, defaultValue: false },
    third_party_consent: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    // 유리병 및 배지 시스템 필드 추가
    current_candy_count: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0, 
      validate: { min: 0, max: 15 } 
    },
    total_candy_count: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0 
    },
    attendance_days: { 
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
  });
};
