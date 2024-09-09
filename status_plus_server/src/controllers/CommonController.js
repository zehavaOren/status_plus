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
}

module.exports = {
    getCities,
    getJobForEmployee,
    getGradesAndClasses,
    getJobs
};