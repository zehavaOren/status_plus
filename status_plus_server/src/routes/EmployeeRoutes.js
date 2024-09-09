// /staff: קבלת רשימת כל אנשי הצוות.
// /staff/{staffId}: קבלת פרטי איש צוות ספציפי.
// /staff/create: יצירת איש צוות חדש.
// /staff/update/{staffId}: עדכון פרטי איש צוות.
// /staff/import: ייבוא רשימת אנשי צוות חדשים.

const express = require('express');
const router = express.Router();
const EmployeeController = require('../controllers/EmployeeController');

router.get('/getEmployeesByGrade/:gradeId/:classId?/', EmployeeController.getEmployeesByGrade);

module.exports = router;
