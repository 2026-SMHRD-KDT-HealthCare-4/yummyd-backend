const { sequelize, User, Reflection, Analyses, Class } = require('../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
  try {
    const institution_id = req.user.id;
    const class_id = req.query.class_id;

    const classWhere = { institution_id };
    if (class_id && class_id !== 'all') classWhere.id = class_id;

    const totalStudents = await User.count({
      where: { role: 'student' },
      include: [{ model: Class, as: 'StudentClass', where: classWhere, required: true }]
    });

    const students = await User.findAll({
      where: { role: 'student' },
      include: [{ model: Class, as: 'StudentClass', where: classWhere, required: true }],
      attributes: ['id']
    });
    const studentIds = students.map(s => s.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayReflections = await Reflection.count({
      where: {
        UserId: { [Op.in]: studentIds.length > 0 ? studentIds : [0] },
        createdAt: { [Op.gte]: today }
      }
    });

    // 오늘 ers > 1.0 인 Analyses 건수 (고위험 기준)
    const highRiskCount = await Analyses.count({
      where: { ers: { [Op.gt]: 1.0 } },
      include: [{
        model: Reflection,
        required: true,
        where: {
          UserId: { [Op.in]: studentIds.length > 0 ? studentIds : [0] },
          createdAt: { [Op.gte]: today }
        },
        attributes: []
      }]
    });

    res.json({ success: true, data: { totalStudents, todayReflections, highRiskCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getWeeklyRiskTrend = async (req, res) => {
  try {
    const institution_id = req.user.id;
    const class_id = req.query.class_id;

    const classWhere = { institution_id };
    if (class_id && class_id !== 'all') classWhere.id = class_id;

    const studentIds = (await User.findAll({
      where: { role: 'student' },
      include: [{ model: Class, as: 'StudentClass', where: classWhere, required: true }],
      attributes: ['id']
    })).map(s => s.id);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trends = await Analyses.findAll({
      where: { createdAt: { [Op.gte]: sevenDaysAgo } },
      include: [{
        model: Reflection,
        required: true,
        where: { UserId: { [Op.in]: studentIds.length > 0 ? studentIds : [0] } },
        attributes: []
      }],
      attributes: [
        [sequelize.fn('DATE', sequelize.col('Analyses.createdAt')), 'date'],
        [sequelize.fn('AVG', sequelize.col('Analyses.ers')), 'avg_risk']
      ],
      group: [sequelize.fn('DATE', sequelize.col('Analyses.createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('Analyses.createdAt')), 'ASC']]
    });

    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getHighRiskStudents = async (req, res) => {
  try {
    const institution_id = req.user.id;
    const class_id = req.query.class_id;

    const classWhere = { institution_id };
    if (class_id && class_id !== 'all') classWhere.id = class_id;

    const studentIds = (await User.findAll({
      where: { role: 'student' },
      include: [{ model: Class, as: 'StudentClass', where: classWhere, required: true }],
      attributes: ['id', 'username']
    })).map(s => ({ id: s.id, name: s.username }));

    if (studentIds.length === 0) return res.json({ success: true, data: [] });

    // 학생별 최신 Analyses.ers 조회
    const latestAnalyses = await Analyses.findAll({
      include: [{
        model: Reflection,
        required: true,
        where: { UserId: { [Op.in]: studentIds.map(s => s.id) } },
        attributes: ['UserId']
      }],
      order: [['createdAt', 'DESC']]
    });

    // 학생별 최신 1건만 추출
    const seen = new Set();
    const result = [];
    for (const a of latestAnalyses) {
      const userId = a.Reflection.UserId;
      if (!seen.has(userId)) {
        seen.add(userId);
        const student = studentIds.find(s => s.id === userId);
        const ers = parseFloat(a.ers);
        result.push({
          id: userId,
          name: student?.name || '-',
          risk_score: ers,
          status: ers > 1.0 ? '고위험' : ers > 0.5 ? '주의' : '정상'
        });
      }
    }

    const highRisk = result
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 10);

    res.json({ success: true, data: highRisk });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
