const dbService = require('../services/dbService');

const getAllStdents = async (req, res) => {
    try {
        const allStudents = await dbService.executeStoredProcedure('sp_stpl_get_all_students');
        res.status(200).json({ allStudents });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const getStudentsForUpdate = async (req, res) => {
    const employee_id = req.params.employeeId;
    try {
        const studentsForUpdate = await dbService.executeStoredProcedure('sp_stpl_get_students_for_update_status', { employee_id: employee_id });
        res.status(200).json({ studentsForUpdate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const getStudentDetails = async (req, res) => {
    const student_id = req.params.student_id;
    try {
        const studentDetails = await dbService.executeStoredProcedure('sp_stpl_get_student_details', { student_id: student_id });
        res.status(200).json({ studentDetails });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const upsertStudentDetails = async (req, res) => {
    const studentId = req.body.studentId;
    const lastName = req.body.lastName;
    const firstName = req.body.firstName;
    const phone1 = req.body.phone1;
    const phone2 = req.body.phone2;
    const birthDate = req.body.birthDate;
    const address = req.body.address;
    const cityId = req.body.cityId;
    const gradeId = req.body.gradeId;
    const classId = req.body.classId;
    try {
        const studentDetailsSave = await dbService.executeStoredProcedure('sp_stpl_upsert_student_details', { studentId, lastName, firstName, phone1, phone2, birthDate, address, cityId, gradeId, classId });
        res.status(200).json({ studentDetailsSave });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const upsertEmployeesForStudent = async (req, res) => {
    const { student_id, employee_id, year, job_id } = req.body;
    try {
        const employeesForStudentSave = await dbService.executeStoredProcedure('sp_stpl_upsert_employee_for_student_details',
            { student_id: student_id, employee_id: employee_id, year: year, job_id: job_id });
        res.status(200).json({ employeesForStudentSave });
    } catch (err) {
        console.error('Error occurred:', err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const deleteStudent = async (req, res) => {
    const { studentId, year } = req.body;
    try {
        const studentDelete = await dbService.executeStoredProcedure('sp_stpl_delete_detudent',
            { studentId: studentId, year: year });
        res.status(200).json({ studentDelete });
    } catch (err) {
        console.error('Error occurred:', err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const importStudents = async (req, res) => {
    const { studentId, lastName, firstName, phone1, phone2, birthDate, address, city, grade, clas } = req.body;
    try {
        const studentsFileImported = await dbService.executeStoredProcedure('sp_stpl_import_student',
            {
                studentId: studentId,
                lastName: lastName,
                firstName: firstName,
                phone1: phone1,
                phone2: phone2,
                birthDate: birthDate,
                address: address,
                city: city,
                grade: grade,
                class: clas
            });
        if (studentsFileImported[0][0].status === 0) {
            return res.status(400).json({ error: studentsFileImported[0][0].msg });
        }
        res.status(200).json({ studentsFileImported });
    } catch (err) {
        console.error('Error occurred:', err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
}

module.exports = {
    getAllStdents,
    getStudentsForUpdate,
    getStudentDetails,
    upsertStudentDetails,
    upsertEmployeesForStudent,
    deleteStudent,
    importStudents
};
