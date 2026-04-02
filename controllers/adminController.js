const { sequelize, User, Reflection, RiskMetric } = require('../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
  try {
    const institution_id = req.user.id;
    const class_id = req.query.class_id || req.query.group_id;
    
    // 기본 필터: 내 기관의 학생
    const whereClause = { role: 'student', institution_id };
    
    // 특정 클래스 선택 시 필터 추가
    if (class_id && class_id !== 'all') {
      whereClause.class_id = class_id;
    }

    const totalStudents = await User.count({ where: whereClause });
    
    const students = await User.findAll({
      where: whereClause,
      attributes: ['id']
    });
    const studentIds = students.map(s => s.id);

    const today = new Date();
    today.setHours(0,0,0,0);

    const todayReflections = await Reflection.count({
      where: { 
        user_id: { [Op.in]: studentIds.length > 0 ? studentIds : [0] },
        created_at: { [Op.gte]: today } 
      }
    });

    const highRiskCount = await RiskMetric.count({
      where: { 
        user_id: { [Op.in]: studentIds.length > 0 ? studentIds : [0] },
        cumulative_cer: { [Op.gt]: 1.5 },
        created_at: { [Op.gte]: today }
      }
    });

    res.json({ success: true, data: { totalStudents, todayReflections, highRiskCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getWeeklyRiskTrend = async (req, res) => {
  try {
    const institution_id = req.user.id;
    const class_id = req.query.class_id || req.query.group_id;

    const studentIds = (await User.findAll({
      where: { 
        role: 'student', 
        institution_id,
        ...(class_id && class_id !== 'all' ? { class_id } : {})
      },
      attributes: ['id']
    })).map(s => s.id);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trends = await RiskMetric.findAll({
      where: {
        user_id: { [Op.in]: studentIds.length > 0 ? studentIds : [0] },
        created_at: { [Op.gte]: sevenDaysAgo }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('AVG', sequelize.col('cumulative_cer')), 'avg_risk']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
    });

    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getHighRiskStudents = async (req, res) => {
  try {
    const institution_id = req.user.id;
    const class_id = req.query.class_id || req.query.group_id;

    const students = await User.findAll({
      where: { 
        role: 'student', 
        institution_id,
        ...(class_id && class_id !== 'all' ? { class_id } : {})
      },
      include: [{
        model: RiskMetric,
        as: 'RiskMetrics',
        limit: 1,
        order: [['created_at', 'DESC']]
      }],
      order: [[{ model: RiskMetric, as: 'RiskMetrics' }, 'cumulative_cer', 'DESC']]
    });

    const highRisk = students
      .filter(s => s.RiskMetrics && s.RiskMetrics.length > 0)
      .map(s => ({
        id: s.id,
        name: s.username,
        risk_score: s.RiskMetrics[0].cumulative_cer,
        dropout_prob: s.RiskMetrics[0].dropout_prob,
        status: s.RiskMetrics[0].cumulative_cer > 1.5 ? '고위험' : s.RiskMetrics[0].cumulative_cer > 1.0 ? '주의' : '정상'
      }))
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 10);

    res.json({ success: true, data: highRisk });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
