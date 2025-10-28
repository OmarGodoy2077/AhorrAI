const express = require('express');
const { LoanController } = require('../controllers');
const { authenticate, validateLoan } = require('../middleware');

const router = express.Router();

router.post('/', authenticate, validateLoan, LoanController.createLoan);
router.get('/', authenticate, LoanController.getLoans);
router.get('/:id', authenticate, LoanController.getLoan);
router.put('/:id', authenticate, validateLoan, LoanController.updateLoan);
router.delete('/:id', authenticate, LoanController.deleteLoan);

module.exports = router;