// /students: קבלת רשימת כל התלמידים.
// /students/{studentId}: קבלת פרטי תלמיד ספציפי.
// /students/create: יצירת תלמיד חדש.
// /students/update/{studentId}: עדכון פרטי תלמיד.
// /students/import: ייבוא רשימת תלמידים חדשה.
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/StudentController');

//get student for update by employee_id
router.get('/getAllStudents/', studentController.getAllStdents);
router.get('/getStudentsForUpdate/:employeeId', studentController.getStudentsForUpdate);
router.get('/getStudentDetails/:student_id', studentController.getStudentDetails);
router.post('/upsertStudentDetails/', studentController.upsertStudentDetails);
router.post('/upsertEmployeesForStudent/', studentController.upsertEmployeesForStudent);
router.delete('/deleteStudent/', studentController.deleteStudent);
router.post('/importStudents/', studentController.importStudents);

module.exports = router;

