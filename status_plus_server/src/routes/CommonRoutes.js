const express = require('express');
const router = express.Router();
const CommonController = require('../controllers/CommonController');

router.get('/getCities', CommonController.getCities);
router.get('/getJobForEmployee', CommonController.getJobForEmployee);
router.get('/getGradesAndClasses', CommonController.getGradesAndClasses);
router.get('/getJobs', CommonController.getJobs);
router.get('/getPermission', CommonController.getPermission);
router.get('/getGrade', CommonController.getGrade);
router.get('/getCodeTableDetails', CommonController.getCodeTableDetails);
router.post('/addDataCodeTable/', CommonController.addDataCodeTable);
router.post('/addCategoryValueConnection/', CommonController.addCategoryValueConnection);
router.post('/updateStudents/', CommonController.updateStudents);
router.post('/updateClasses/', CommonController.updateClasses);
router.get('/getTeachers', CommonController.getTeachers);
router.get('/getStudentsByGrade/:gradeId/:classId?/', CommonController.getStudentsByGrade);
router.post('/addEmployeesForStudents/', CommonController.addEmployeesForStudents);

module.exports = router;