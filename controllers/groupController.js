const { Group, User } = require('../models');

// [POST] 그룹 생성 (기관 전용)
exports.createGroup = async (req, res) => {
  try {
    if (req.user.role !== 'institution' && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: '그룹 생성 권한이 없습니다.' });
    }
    const { name } = req.body;
    const group = await Group.create({ name, institution_id: req.user.id });
    res.status(201).json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// [GET] 기관별 그룹 목록 조회
exports.getGroupsByInstitution = async (req, res) => {
  try {
    const institution_id = req.query.institution_id || req.user?.id;
    if (!institution_id) {
      return res.status(400).json({ success: false, message: '기관 ID가 필요합니다.' });
    }
    const groups = await Group.findAll({ where: { institution_id } });
    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// [GET] 모든 기관 목록 조회 (수강생 가입용)
exports.getInstitutions = async (req, res) => {
  try {
    const institutions = await User.findAll({
      where: { role: 'institution' },
      attributes: ['id', 'organization_name']
    });
    res.json({ success: true, institutions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
