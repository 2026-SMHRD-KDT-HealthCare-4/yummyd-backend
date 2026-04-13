const { sequelize, User, Reflection, Analyses } = require('../models');
const { Op } = require('sequelize');

const getInstitutionId = async (reqUser) => {
  if ((reqUser.role === 'institution') || (reqUser.role === 'admin')) {
    return reqUser.id;
  }
  // instructor 역할: Users 테이블의 institution_id 조회
  const userRecord = await User.findByPk(reqUser.id, { attributes: ['institution_id'] });
  return userRecord?.institution_id || null;
};

exports.getStats = async (req, res) => {
  try {
    const institution_id = await getInstitutionId(req.user);
    if (!institution_id) {
      return res.json({ success: true, data: { totalStudents: 0, todayReflections: 0, highRiskCount: 0 } });
    }

    const [totalResult] = await sequelize.query(
      `SELECT COUNT(*) as count FROM Users u
       JOIN Classes c ON u.class_id = c.id
       WHERE c.institution_id = :institution_id AND u.role = 'student'`,
      { replacements: { institution_id }, type: sequelize.QueryTypes.SELECT }
    );
    const totalStudents = totalResult.count;

    const studentRows = await sequelize.query(
      `SELECT u.id FROM Users u
       JOIN Classes c ON u.class_id = c.id
       WHERE c.institution_id = :institution_id AND u.role = 'student'`,
      { replacements: { institution_id }, type: sequelize.QueryTypes.SELECT }
    );
    const studentIds = studentRows.map(s => s.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayReflections = await Reflection.count({
      where: {
        UserId: { [Op.in]: studentIds.length > 0 ? studentIds : [0] },
        createdAt: { [Op.gte]: today }
      },
      distinct: true,
      col: 'UserId'
    });

    const [highRiskResult] = await sequelize.query(
      `SELECT COUNT(DISTINCT r.UserId) as count
       FROM Analyses a
       JOIN Reflections r ON a.ReflectionId = r.id
       WHERE r.UserId IN (:studentIds)
         AND a.ers > 1.0`,
      { replacements: { studentIds: studentIds.length > 0 ? studentIds : [0] }, type: sequelize.QueryTypes.SELECT }
    );
    const highRiskCount = highRiskResult.count;

    res.json({ success: true, data: { totalStudents, todayReflections, highRiskCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getWeeklyRiskTrend = async (req, res) => {
  try {
    const institution_id = await getInstitutionId(req.user);
    if (!institution_id) return res.json({ success: true, data: [] });

    const studentRows = await sequelize.query(
      `SELECT u.id FROM Users u
       JOIN Classes c ON u.class_id = c.id
       WHERE c.institution_id = :institution_id AND u.role = 'student'`,
      { replacements: { institution_id }, type: sequelize.QueryTypes.SELECT }
    );
    const studentIds = studentRows.map(s => s.id);

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

exports.getClassStats = async (req, res) => {
  try {
    const { class_id } = req.query;
    if (!class_id) return res.status(400).json({ success: false, message: 'class_id가 필요합니다.' });

    const [totalResult] = await sequelize.query(
      `SELECT COUNT(*) as count FROM Users WHERE class_id = :class_id AND role = 'student'`,
      { replacements: { class_id }, type: sequelize.QueryTypes.SELECT }
    );
    const totalStudents = totalResult.count;

    const studentRows = await sequelize.query(
      `SELECT id FROM Users WHERE class_id = :class_id AND role = 'student'`,
      { replacements: { class_id }, type: sequelize.QueryTypes.SELECT }
    );
    const studentIds = studentRows.map(s => s.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayReflections = await Reflection.count({
      where: {
        UserId: { [Op.in]: studentIds.length > 0 ? studentIds : [0] },
        createdAt: { [Op.gte]: today }
      },
      distinct: true,
      col: 'UserId'
    });

    const [highRiskResult] = await sequelize.query(
      `SELECT COUNT(DISTINCT r.UserId) as count
       FROM Analyses a
       JOIN Reflections r ON a.ReflectionId = r.id
       WHERE r.UserId IN (:studentIds)
         AND a.ers > 1.0`,
      { replacements: { studentIds: studentIds.length > 0 ? studentIds : [0] }, type: sequelize.QueryTypes.SELECT }
    );
    const highRiskCount = highRiskResult.count;

    res.json({
      success: true,
      data: {
        totalStudents,
        todayReflections,
        notSubmitted: totalStudents - todayReflections,
        highRiskCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getClassStudents = async (req, res) => {
  try {
    const { class_id } = req.query;
    if (!class_id) return res.status(400).json({ success: false, message: 'class_id가 필요합니다.' });

    const students = await sequelize.query(
      `SELECT u.id, u.username, u.enroll_status,
        (SELECT a.ers FROM Analyses a
         JOIN Reflections r ON a.ReflectionId = r.id
         WHERE r.UserId = u.id
         ORDER BY a.createdAt DESC LIMIT 1) as latest_ers
       FROM Users u
       WHERE u.class_id = :class_id AND u.role = 'student'
       ORDER BY u.username`,
      { replacements: { class_id }, type: sequelize.QueryTypes.SELECT }
    );

    const result = students.map(s => ({
      id: s.id,
      username: s.username,
      enroll_status: s.enroll_status,
      isHighRisk: s.latest_ers !== null && parseFloat(s.latest_ers) > 1.0
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStudentMonitoring = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ success: false, message: 'user_id가 필요합니다.' });

    const [row] = await sequelize.query(
      `SELECT r.EDU_delay_time, r.EDU_char_count, r.cumulative_days, r.cumulative_absence_days, a.dropout_prob
       FROM Reflections r
       LEFT JOIN Analyses a ON a.ReflectionId = r.id
       WHERE r.UserId = :user_id
       ORDER BY r.createdAt DESC
       LIMIT 1`,
      { replacements: { user_id }, type: sequelize.QueryTypes.SELECT }
    );

    if (!row) return res.json({ success: true, data: null });

    res.json({
      success: true,
      data: {
        EDU_delay_time: row.EDU_delay_time || 0,
        EDU_char_count: row.EDU_char_count || 0,
        cumulative_days: row.cumulative_days || 0,
        cumulative_absence_days: row.cumulative_absence_days || 0,
        dropout_prob: row.dropout_prob !== null ? parseFloat(row.dropout_prob) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getConsultation = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ success: false, message: 'user_id가 필요합니다.' });

    const [row] = await sequelize.query(
      `SELECT consultation_note FROM Users WHERE id = :user_id`,
      { replacements: { user_id }, type: sequelize.QueryTypes.SELECT }
    );

    res.json({ success: true, data: { note: row?.consultation_note || '' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.saveConsultation = async (req, res) => {
  try {
    const { user_id, note } = req.body;
    if (!user_id) return res.status(400).json({ success: false, message: 'user_id가 필요합니다.' });

    await sequelize.query(
      `UPDATE Users SET consultation_note = :note WHERE id = :user_id`,
      { replacements: { note, user_id }, type: sequelize.QueryTypes.UPDATE }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getHighRiskStudents = async (req, res) => {
  try {
    const institution_id = await getInstitutionId(req.user);
    if (!institution_id) return res.json({ success: true, data: [] });

    const studentRows = await sequelize.query(
      `SELECT u.id, u.username FROM Users u
       JOIN Classes c ON u.class_id = c.id
       WHERE c.institution_id = :institution_id AND u.role = 'student'`,
      { replacements: { institution_id }, type: sequelize.QueryTypes.SELECT }
    );
    const studentIds = studentRows.map(s => ({ id: s.id, name: s.username }));

    if (studentIds.length === 0) return res.json({ success: true, data: [] });

    const latestAnalyses = await Analyses.findAll({
      include: [{
        model: Reflection,
        required: true,
        where: { UserId: { [Op.in]: studentIds.map(s => s.id) } },
        attributes: ['UserId']
      }],
      order: [['createdAt', 'DESC']]
    });

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
