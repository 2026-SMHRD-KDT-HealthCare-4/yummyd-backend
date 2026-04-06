const { Class, User } = require('../models');

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
