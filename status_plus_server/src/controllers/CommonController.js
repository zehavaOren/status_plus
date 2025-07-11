const dbService = require('../services/dbService');

const getCities = async (req, res) => {
    try {
        const citiesList = await dbService.executeStoredProcedure('sp_stpl_get_city');
        res.status(200).json({ citiesList });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const getJobForEmployee = async (req, res) => {
    try {
        const jobs = await dbService.executeStoredProcedure('sp_stpl_get_jobs_for_employee');
        res.status(200).json({ jobs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const getGradesAndClasses = async (req, res) => {
    try {
        const gradesAndClasses = await dbService.executeStoredProcedure('sp_stpl_get_grades_and_classes');
        res.status(200).json({ gradesAndClasses });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const getJobs = async (req, res) => {
    try {
        const jobsList = await dbService.executeStoredProcedure('sp_stpl_get_jobs');
        res.status(200).json({ jobsList });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const getPermission = async (req, res) => {
    try {
        const permissionList = await dbService.executeStoredProcedure('sp_stpl_get_all_permission');
        res.status(200).json({ permissionList });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const getGrade = async (req, res) => {
    try {
        const gradesList = await dbService.executeStoredProcedure('sp_stpl_get_grade');
        res.status(200).json({ gradesList });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const getCodeTableDetails = async (req, res) => {
    try {
        const codeTableDetails = await dbService.executeStoredProcedure('sp_stpl_get_code_table_data');
        res.status(200).json({ codeTableDetails });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const addDataCodeTable = async (req, res) => {
    const tableName = req.body.selectedList;
    const additionalData = req.body.additionalValue;
    try {
        const dataAddedCodeTable = await dbService.executeStoredProcedure('sp_stpl_upsert_code_table', { tableName, additionalData });
        res.status(200).json({ dataAddedCodeTable });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const addCategoryValueConnection = async (req, res) => {
    const valueId = req.body.valueId;
    const categoryId = req.body.categoryId;

    try {
        const dataAddedConnectionTable = await dbService.executeStoredProcedure('sp_stpl_upsert_value_for_category', { valueId, categoryId });
        res.status(200).json({ dataAddedConnectionTable });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const updateStudents = async (req, res) => {
    const currentYear = req.body.currentYear;
    const numberOfAClasses = req.body.numberOfAClasses;

    try {
        const studentsUpdated = await dbService.executeStoredProcedure('sp_stpl_upload_year_update_students', { currentYear, numberOfAClasses });
        res.status(200).json({ studentsUpdated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const updateClasses = async (req, res) => {
    const numberOfAClasses = req.body.numClasses;

    try {
        const classesUpdated = await dbService.executeStoredProcedure('sp_stpl_upload_year_update_classes', { numberOfAClasses });
        res.status(200).json({ classesUpdated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const getTeachers = async (req, res) => {
    try {
        const teachersList = await dbService.executeStoredProcedure('sp_stpl_get_employees_data');
        res.status(200).json({ teachersList });
    }
    catch {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const getStudentsByGrade = async (req, res) => {
    const grade_id = parseInt(req.params.gradeId, 10);
    let class_id = req.params.classId;

    if (class_id === "null" || class_id === undefined) {
        class_id = null;
    } else {
        class_id = parseInt(class_id, 10);
    }

    try {
        const studentsByGradeList = await dbService.executeStoredProcedure('sp_stpl_get_students_by_grade', { grade_id, class_id })
        res.status(200).json({ studentsByGradeList });
    }
    catch {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

const addEmployeesForStudents = async (req, res) => {
    const employeeId = req.body.teacherId;
    const studentsIds = req.body.studentsIds;
    const currentYear = req.body.currrentYear;
    console.log(studentsIds);
    
    try {
        const teacherForStudents = await dbService.executeStoredProcedure('sp_stpl_insert_employee_for_students', { employeeId, studentsIds, currentYear });
        res.status(200).json({ teacherForStudents })
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

module.exports = {
    getCities,
    getJobForEmployee,
    getGradesAndClasses,
    getJobs,
    getPermission,
    getGrade,
    getCodeTableDetails,
    addDataCodeTable,
    addCategoryValueConnection,
    updateStudents,
    updateClasses,
    getTeachers,
    getStudentsByGrade,
    addEmployeesForStudents
};