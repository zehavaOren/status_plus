const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

// Login route
router.post('/uploadPdf', fileController.uploadFile);
router.post('/', fileController.uploadFile);
// /logout: התנתקות מהמערכת.

module.exports = router;
