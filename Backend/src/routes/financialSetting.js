const express = require('express');
const { FinancialSettingController } = require('../controllers');
const { authenticate, validateFinancialSetting, validateFinancialSettingUpdate } = require('../middleware');

const router = express.Router();

// Specific routes MUST come before parameterized routes
router.get('/current', authenticate, FinancialSettingController.getCurrentSetting);

// General CRUD routes
router.post('/', authenticate, validateFinancialSetting, FinancialSettingController.createSetting);
router.get('/', authenticate, FinancialSettingController.getSettings);
router.get('/:id', authenticate, FinancialSettingController.getSettings);
router.put('/:id', authenticate, validateFinancialSettingUpdate, FinancialSettingController.updateSetting);
router.delete('/:id', authenticate, FinancialSettingController.deleteSetting);

module.exports = router;