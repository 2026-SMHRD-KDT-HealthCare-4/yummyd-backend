const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/stats', verifyToken, adminController.getStats);

module.exports = router;
