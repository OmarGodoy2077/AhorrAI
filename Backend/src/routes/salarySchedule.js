const express = require('express');
const { SalaryScheduleController } = require('../controllers');
const { authenticate } = require('../middleware');

const router = express.Router();

router.post('/', authenticate, SalaryScheduleController.createSalarySchedule);
router.get('/', authenticate, SalaryScheduleController.getSalarySchedules);
router.get('/:id', authenticate, SalaryScheduleController.getSalarySchedule);
router.put('/:id', authenticate, SalaryScheduleController.updateSalarySchedule);
router.delete('/:id', authenticate, SalaryScheduleController.deleteSalarySchedule);
router.patch('/:id/toggle', authenticate, SalaryScheduleController.toggleSalarySchedule);

module.exports = router;