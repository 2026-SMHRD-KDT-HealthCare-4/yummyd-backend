const { Class, User, Reflection } = require('../models');

// 새로운 클래스(반) 생성
exports.createClass = async (req, res) => {
  const { name } = req.body;
  try {
    const newClass = await Class.create({ 
      class_name: name, 
      institution_id: req.user.id 
    });
    res.status(201).json({ success: true, class: newClass });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 기관 소속 클래스 목록 조회
exports.getClassesByInstitution = async (req, res) => {
  const institution_id = req.query.institution_id || req.user.id;
  try {
    const classes = await Class.findAll({ where: { institution_id } });
    res.json({ success: true, classes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 반 전체 회고 조회 (EDU_confused 집계 및 블라블라캔디용)
exports.getClassReflections = async (req, res) => {
  try {
    const { classId } = req.params;
    // 해당 class의 학생 목록
    const students = await User.findAll({
      where: { class_id: classId },
      attributes: ['id', 'username']
    });
    const studentIds = students.map(s => s.id);
    if (studentIds.length === 0) {
      return res.json({ success: true, confusedList: [], totalStudents: 0 });
    }
    // 최근 7일 회고에서 EDU_confused 수집
    const { Op } = require('sequelize');
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const reflections = await Reflection.findAll({
      where: {
        userId: { [Op.in]: studentIds },
        createdAt: { [Op.gte]: since }
      },
      attributes: ['EDU_confused', 'userId'],
    });

    // {userId, text} 쌍으로 반환 (프론트에서 키워드별 고유 학생 수 계산용)
    const confusedEntries = reflections
      .filter(r => r.EDU_confused)
      .map(r => ({ userId: r.userId, text: r.EDU_confused }));

    res.json({
      success: true,
      confusedEntries,
      totalStudents: studentIds.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 모든 기관 목록 조회 (수강생 가입용)
exports.getInstitutions = async (req, res) => {
  try {
    const { Institution } = require('../models');
    const insts = await Institution.findAll({
      attributes: ['id', 'inst_name']
    });
    res.json({ success: true, institutions: insts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
