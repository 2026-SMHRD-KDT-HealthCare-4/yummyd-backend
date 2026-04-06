const express = require('express');
const router = express.Router();

const reflectionRoutes = require('./reflectionRoutes');
const adminRoutes = require('./adminRoutes');
const authRoutes = require('./authRoutes');
const classRoutes = require('./classRoutes');
const collectionRoutes = require('./collectionRoutes');

router.use('/auth', authRoutes);
router.use('/classes', classRoutes);
router.use('/collection', collectionRoutes);
router.use('/', reflectionRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
