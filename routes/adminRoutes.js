const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/stats', verifyToken, adminController.getStats);
router.get('/weekly-trend', verifyToken, adminController.getWeeklyRiskTrend);
router.get('/high-risk-students', verifyToken, adminController.getHighRiskStudents);

module.exports = router;
