const express = require('express');
const router = express.Router();
const reflectionController = require('../controllers/reflectionController');

router.post('/reflection', reflectionController.createReflection);
router.get('/history/:userId', reflectionController.getHistory);
router.get('/board', reflectionController.getBoard);
router.post('/reset-jar', reflectionController.resetJar);
router.put('/update/:id', reflectionController.updateReflection); // 수정 API 추가

module.exports = router;
