const express = require('express');
const { AuthController } = require('../controllers');
const { validateRegister, validateLogin } = require('../middleware');

const router = express.Router();

router.post('/register', validateRegister, AuthController.register);
router.post('/login', validateLogin, AuthController.login);

module.exports = router;