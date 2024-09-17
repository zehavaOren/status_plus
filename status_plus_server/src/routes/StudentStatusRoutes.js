// /students/{studentId}/status: קבלת סטטוס תלמיד ספציפי.
// /students/{studentId}/status/update: עדכון סטטוס תלמיד.
// /students/{studentId}/status/history: קבלת היסטוריית סטטוס תלמיד.
const express = require('express');
const router = express.Router();
const studentStatusController = require('../controllers/studentStatusController');


//get student for update by employee_id
router.get('/getStudentsStatuses', studentStatusController.getStudentsStatuses);
router.get('/getStatusesList/:studentId', studentStatusController.getStatusesList);
router.get('/getCategories/:employeeId/', studentStatusController.getCategoriesByEmployee);
router.get('/getValues/:employeeId/', studentStatusController.getValuesByEmployeeId);
router.get('/getStatusValuesByEmployeeAndStudent/:studentId/:employeeId/:year/', studentStatusController.getStatusValuesByEmployeeAndStudent);
router.post('/upsertStudentStatus/', studentStatusController.upsertStudentStatus);
router.get('/getStudentStatus/:studentId', studentStatusController.getStudentStatus);
router.get('/getStudetsConflicts/:employeeId/', studentStatusController.getStudetsConflicts);
router.get('/getConflictList/:studentId/', studentStatusController.getConflictList);
router.post('/upsertConflictResolution', studentStatusController.upsertConflictResolution);
router.get('/checkStudentStatus/:studentId/', studentStatusController.checkStudentStatus);

module.exports = router;