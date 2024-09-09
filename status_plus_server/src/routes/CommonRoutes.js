const express = require('express');
const router = express.Router();
const CommonController = require('../controllers/CommonController');

router.get('/getCities', CommonController.getCities);
router.get('/getJobForEmployee', CommonController.getJobForEmployee);
router.get('/getGrades', CommonController.getGradesAndClasses);
router.get('/getJobs', CommonController.getJobs);

module.exports = router;