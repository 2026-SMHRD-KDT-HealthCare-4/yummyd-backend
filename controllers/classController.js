const { Class, User } = require('../models');

const getInstitutionId = async (reqUser) => {
  if (reqUser.role === 'institution' || reqUser.role === 'admin') {
    return reqUser.id;
  }
  const userRecord = await User.findByPk(reqUser.id, { attributes: ['institution_id'] });
  return userRecord?.institution_id || null;
};

// 새로운 클래스(반) 생성
exports.createClass = async (req, res) => {
  const { name } = req.body;
  try {
    const institution_id = await getInstitutionId(req.user);
    if (!institution_id) {
      return res.status(400).json({ success: false, message: '기관 정보를 찾을 수 없습니다.' });
    }
    const newClass = await Class.create({
      class_name: name,
      institution_id
    });
    res.status(201).json({ success: true, class: newClass });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 기관 소속 클래스 목록 조회 (공개용 — 회원가입 시 institution_id 쿼리 파라미터로 조회)
exports.getClassList = async (req, res) => {
  try {
    const { institution_id } = req.query;
    if (!institution_id) {
      return res.json({ success: true, classes: [] });
    }
    const classes = await Class.findAll({ where: { institution_id } });
    res.json({ success: true, classes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 내 기관의 클래스 목록 조회 (인증 필요 — 관리자 대시보드용)
exports.getClassesByInstitution = async (req, res) => {
  try {
    const institution_id = await getInstitutionId(req.user);
    if (!institution_id) {
      return res.json({ success: true, classes: [] });
    }
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
