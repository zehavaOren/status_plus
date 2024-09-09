const dbService = require('../services/dbService');

const getEmployeesByGrade = async (req, res) => {
    const grade_id = req.params.gradeId;
    const class_id = req.params.classId;
    let class_idToSend;
    if (class_id === null) {
      class_idToSend = null;
    } else {
      try {
        class_idToSend = parseInt(class_id);
      } catch (err) {
        console.error(`Failed to convert class_id to int: ${err.message}`);
        class_idToSend = null;
      }
    }
    try {
        const employeesDetails = await dbService.executeStoredProcedure('sp_stpl_get_employee_by_grade',
            {
                grade_id: grade_id,
                class_id: class_idToSend
            }
        );
        res.status(200).json({ employeesDetails });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

module.exports = {
    getEmployeesByGrade
}