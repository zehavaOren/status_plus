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
}
module.exports = {
    getCities,
    getJobForEmployee,
    getGradesAndClasses,
    getJobs,
    getPermission,
    getGrade
};