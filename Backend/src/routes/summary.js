const express = require('express');
const { SummaryController } = require('../controllers');
const { authenticate } = require('../middleware');

const router = express.Router();

router.get('/monthly/:year/:month', authenticate, SummaryController.getMonthlySummary);
router.get('/yearly/:year', authenticate, SummaryController.getYearlySummary);
router.post('/monthly/generate', authenticate, SummaryController.generateMonthlySummary);

module.exports = router;