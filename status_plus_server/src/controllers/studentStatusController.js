const dbService = require('../services/dbService');
const fileController = require('../controllers/fileController');

const getStudentsStatuses = async (req, res) => {
    try {
        const studentsStatuses = await dbService.executeStoredProcedure('sp_stpl_get_students_statuses');
        res.status(200).json({ studentsStatuses });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const getStatusesList = async (req, res) => {
    const studentId = req.params.studentId;
    try {
        const statusesList = await dbService.executeStoredProcedure('sp_stpl_get_statuses_list', { studentId: studentId });
        res.status(200).json({ statusesList });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const addStatusFile = async (req, res) => {
    try {
        const file = fileController.uplaodPdfFile(req, res);
        res.status(200).json({ file });
    }

    catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).send('Error uploading file.');
    }
};

const getCategoriesByEmployee = async (req, res) => {
    const employeeId = req.params.employeeId;
    try {
        const categories = await dbService.executeStoredProcedure('sp_stpl_get_categories_by_employee', { employeeId: employeeId });
        res.status(200).json({ categories });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const getValuesByEmployeeId = async (req, res) => {
    const employeeId = req.params.employeeId;
    try {
        const valuesList = await dbService.executeStoredProcedure('sp_stpl_get_values_and_categories_by_employee_id', { employeeId: employeeId });
        res.status(200).json({ valuesList });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const getStatusValuesByEmployeeAndStudent = async (req, res) => {
    const studentId = req.params.studentId;
    const employeeId = req.params.employeeId;
    const year = req.params.year;

    try {
        const valuesList = await dbService.executeStoredProcedure('sp_stpl_get_status_values_by_employee_and_student', { studentId: studentId, employeeId: employeeId, year: year });
        res.status(200).json({ valuesList });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const upsertStudentStatus = async (req, res) => {
    const studentId = req.body.studentId;
    const employeeId = req.body.employeeId;
    const valueId = req.body.valueId;
    const strength = req.body.strength;
    const weakness = req.body.weakness;
    const notes = req.body.notes;
    const year = req.body.year;
    const isFinalChoice = req.body.isFinalChoice;
    try {
        const studentStatusSave = await dbService.executeStoredProcedure('sp_stpl_upsert_student_status', { studentId, employeeId, valueId, strength, weakness, notes, year, isFinalChoice });
        res.status(200).json({ studentStatusSave });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const getStudentStatus = async (req, res) => {
    const studentId = req.params.studentId;
    try {
        const studentStatusData = await dbService.executeStoredProcedure('sp_stpl_get_student_status', { studentId: studentId });
        res.status(200).json({ studentStatusData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const getStudetsConflicts = async (req, res) => {
    const employeeId = req.params.employeeId;
    try {
        const studentConflicts = await dbService.executeStoredProcedure('sp_stpl_get_students_with_conflicts_by_employee', { employeeId: employeeId });
        res.status(200).json({ studentConflicts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const getConflictList = async (req, res) => {
    const studentId = req.params.studentId;
    try {
        const conflictsList = await dbService.executeStoredProcedure('sp_stpl_get_conflicts_list', { studentId: studentId });
        res.status(200).json({ conflictsList });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const upsertConflictResolution = async (req, res) => {
    const valueId = req.body.valueId;
    const studentId = req.body.studentId;
    const year = req.body.year;
    const strength = req.body.strength;
    const weakness = req.body.weakness;
    const note = req.body.notes;
    const employeeId = req.body.employeeId;
    try {
        const studentConflictResolutionSave = await dbService.executeStoredProcedure('sp_stpl_upsert_conflict_resolution', { valueId, studentId, year, strength, weakness, note, employeeId });
        res.status(200).json({ studentConflictResolutionSave });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const checkStudentStatus = async (req, res) => {
    const studentId = req.params.studentId;
    const year = req.params.year;
    try {
        const numbersOfValues = await dbService.executeStoredProcedure('sp_stpl_check_student_status', { studentId: studentId, year: year });
        res.status(200).json({ numbersOfValues });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const upsertStudentStatusReady = async (req, res) => {
    const studentId = req.body.studentId;
    try {
        const studentStatusReady = await dbService.executeStoredProcedure('sp_stpl_upsert_student_status_ready', { studentId, year });
        res.status(200).json({ studentStatusReady });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
}

module.exports = {
    getStudentsStatuses,
    getStatusesList,
    addStatusFile,
    getCategoriesByEmployee,
    getValuesByEmployeeId,
    getStatusValuesByEmployeeAndStudent,
    upsertStudentStatus,
    getStudentStatus,
    getStudetsConflicts,
    getConflictList,
    upsertConflictResolution,
    checkStudentStatus,
    upsertStudentStatusReady
};