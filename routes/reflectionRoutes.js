const express = require('express');
const router = express.Router();
const reflectionController = require('../controllers/reflectionController');

router.post('/reflection', reflectionController.createReflection);
router.get('/history/:userId', reflectionController.getHistory);
router.get('/board', reflectionController.getBoard);
router.post('/reset-jar', reflectionController.resetJar); // 유리병 비우기 라우트 추가

module.exports = router;
