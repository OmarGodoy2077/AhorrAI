const express = require('express');
const { AccountController } = require('../controllers');
const { authenticate, validateAccount } = require('../middleware');

const router = express.Router();

router.post('/', authenticate, validateAccount, AccountController.createAccount);
router.get('/', authenticate, AccountController.getAccounts);
router.get('/:id', authenticate, AccountController.getAccount);
router.put('/:id', authenticate, validateAccount, AccountController.updateAccount);
router.delete('/:id', authenticate, AccountController.deleteAccount);

module.exports = router;