const { User, Reflection, RiskMetric } = require('../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
  try {
    const institution_id = req.user.id;
    const { group_id } = req.query;
    
    // 기본 필터: 내 기관의 학생
    const whereClause = { role: 'student', institution_id };
    
    // 특정 그룹 선택 시 필터 추가
    if (group_id && group_id !== 'all') {
      whereClause.group_id = group_id;
    }

    const totalStudents = await User.count({ where: whereClause });
    
    // 필터링된 학생들의 ID 목록 추출
    const students = await User.findAll({
      where: whereClause,
      attributes: ['id']
    });
    const studentIds = students.map(s => s.id);

    const todayReflections = await Reflection.count({
      where: { 
        UserId: { [Op.in]: studentIds.length > 0 ? studentIds : [0] },
        createdAt: { [Op.gte]: new Date().setHours(0,0,0,0) } 
      }
    });

    const highRiskCount = await RiskMetric.count({
      where: { 
        UserId: { [Op.in]: studentIds.length > 0 ? studentIds : [0] },
        cumulative_cer: { [Op.gt]: 1.5 },
        createdAt: { [Op.gte]: new Date().setHours(0,0,0,0) }
      }
    });

    res.json({ success: true, data: { totalStudents, todayReflections, highRiskCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
