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

const getAllEmployees = async (req, res) => {
  try {
    const allEmployees = await dbService.executeStoredProcedure('sp_stpl_get_all_employees');
    res.status(200).json({ allEmployees });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
};

const getEmployeeById = async (req, res) => {
  const employeeId = req.params.employeeId;
  try {
    const employeeData = await dbService.executeStoredProcedure('sp_stpl_get_employee_by_id', { employeeId: employeeId });
    res.status(200).json({ employeeData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
};

const deleteEmployee = async (req, res) => {
  const { employeeId } = req.params;
  try {
    const employeeDelete = await dbService.executeStoredProcedure('sp_stpl_delete_employee', {
      employeeId: employeeId
    });
    res.status(200).json({ employeeDelete });
  } catch (err) {
    console.error('Error occurred:', err);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
};

const upsertEmployee = async (req, res) => {
  const employeeId = req.body.employeeId;
  const lastName = req.body.lastName;
  const firstName = req.body.firstName;
  const phone = req.body.phone;
  const email = req.body.email;
  const jobId = req.body.jobId;
  const permissionId = req.body.permissionId;
  try {    
    const employeeDetailsSave = await dbService.executeStoredProcedure('sp_stpl_upsert_employee', { employeeId, lastName, firstName, phone, email, jobId, permissionId });
    res.status(200).json({ employeeDetailsSave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
}

module.exports = {
  getEmployeesByGrade,
  getAllEmployees,
  getEmployeeById,
  deleteEmployee,
  upsertEmployee
}