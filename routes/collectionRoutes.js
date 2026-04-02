const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/draw', authMiddleware, collectionController.drawItem);
router.get('/:userId', authMiddleware, collectionController.getCollection);
router.post('/toggle-equip', authMiddleware, collectionController.toggleEquip);

module.exports = router;
