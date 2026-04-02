const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/check-id', authController.checkId);
router.get('/me', authMiddleware, authController.getMe);
router.patch('/update-profile', authMiddleware, authController.updateProfile);

module.exports = router;
