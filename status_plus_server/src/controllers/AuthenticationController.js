const dbService = require('../services/dbService');

const login = async (req, res) => {
  const identityNumber = req.params.identityNumber;
  try {
    
    const employeeData = await dbService.executeStoredProcedure('sp_stpl_get_permission', { identityNumber: identityNumber });   
    res.status(200).json({ employeeData });
  } catch (err) {    console.error(err);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
};

module.exports = {
  login
};