const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const verifyToken = require('../middlewares/authMiddleware');

// [GET] 가입용 기관 목록 조회 (토큰 불필요)
router.get('/institutions', groupController.getInstitutions);

// [GET] 특정 기관의 그룹 목록 조회 (수강생 가입용 등)
router.get('/list', groupController.getGroupsByInstitution);

// [POST] 그룹 생성 (기관 전용)
router.post('/create', verifyToken, groupController.createGroup);

// [GET] 내 기관의 그룹 목록 조회 (강사 대시보드용)
router.get('/my-groups', verifyToken, groupController.getGroupsByInstitution);

module.exports = router;
