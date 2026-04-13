const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const verifyToken = require('../middlewares/authMiddleware');

// 모든 기관 목록 조회 (수강생 가입용)
router.get('/institutions', classController.getInstitutions);

// 클래스 목록 조회 (공개용 — 회원가입 시 사용)
router.get('/list', classController.getClassList);

// 클래스 생성 (기관용)
router.post('/create', verifyToken, classController.createClass);

// 내 기관의 클래스 목록 조회 (기관용)
router.get('/my-classes', verifyToken, classController.getClassesByInstitution);

// 반 회고 조회 (confused 집계용)
router.get('/reflections/:classId', verifyToken, classController.getClassReflections);

module.exports = router;
