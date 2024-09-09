
const dbService = require('../services/dbService');
// const pdf2base64 = require('pdf-to-base64');
const fs = require('fs');

const uplaodPdfFile = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).send('No file uploaded.');
        }
        const { id } = req.body;
        if (!id) {
            return res.status(400).send('ID is required.');
        }
        const pdfBuffer = req.file.buffer;
        const fileRes = await dbService.executeStoredProcedure('sp_stpl_get_permission', { id: id, file: pdfBuffer });
        res.status(200).json({ fileRes });
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).send('Error uploading file.');
    }
};
const uploadFile2 = async (req, res) => {
    try {
        const { file, studentId } = req.body; // Assuming the POST request body contains file and studentId
        pdf2base64(file)
            .then((base64String) => {
                res.status(200).json({ message: 'PDF file converted and saved successfully' });
            })
            .catch((error) => {
                console.error('Error converting PDF file to Base64', error);
                res.status(500).send('Failed to convert PDF file to Base64');
            });
    } catch (error) {
        console.error('Error processing file', error);
        res.status(500).send('Failed to process file');

    }

};
const uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileData = req.file.buffer;
        const result = await executeStoredProcedure('your_stored_proc_name', [fileData]);
        res.json({ message: 'File uploaded successfully', fileId: result.fileId });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
module.exports = {
    uplaodPdfFile,
    uploadFile
};