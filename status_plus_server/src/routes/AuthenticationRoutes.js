const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthenticationController');

// Login route
router.get('/:identityNumber', authController.login);
// /logout: התנתקות מהמערכת.

module.exports = router;
