
const dbService = require('../services/dbService');
const fs = require('fs');

const uploadFile = async (req, res, next) => {
    try {
        const { studentId, year, base64Pdf } = req.body;

        if (!base64Pdf) return res.status(400).json({ error: 'No file data provided' });

        const buffer = Buffer.from(base64Pdf, 'base64');
        const compressed = buffer.toString('base64');

        await dbService.executeStoredProcedure('sp_stpl_upsert_student_status_file', {
            studentId,
            year,
            compressed,
        }
        );

        res.json({ message: 'File uploaded successfully' });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
module.exports = {
    uploadFile
};