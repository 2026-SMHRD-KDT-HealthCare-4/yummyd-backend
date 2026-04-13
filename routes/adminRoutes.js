const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/stats', verifyToken, adminController.getStats);
router.get('/weekly-trend', verifyToken, adminController.getWeeklyRiskTrend);
router.get('/high-risk-students', verifyToken, adminController.getHighRiskStudents);
router.get('/class-stats', verifyToken, adminController.getClassStats);
router.get('/class-students', verifyToken, adminController.getClassStudents);
router.get('/student-monitoring', verifyToken, adminController.getStudentMonitoring);
router.get('/consultation', verifyToken, adminController.getConsultation);
router.post('/consultation', verifyToken, adminController.saveConsultation);

module.exports = router;
