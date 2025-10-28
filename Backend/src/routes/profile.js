const express = require('express');
const { ProfileController } = require('../controllers');
const { authenticate, validateProfile } = require('../middleware');

const router = express.Router();

router.get('/', authenticate, ProfileController.getProfile);
router.put('/', authenticate, validateProfile, ProfileController.updateProfile);
router.delete('/', authenticate, ProfileController.deleteProfile);

module.exports = router;