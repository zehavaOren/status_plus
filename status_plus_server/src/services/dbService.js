const sql = require('mssql/msnodesqlv8');

const config = {
    server: 'localhost',
    database: 'statusPlus',
    options: {
        trustedConnection: true,
        useUTC: true
    },
    driver: 'msnodesqlv8',
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=statusPlus;Trusted_Connection=Yes;'
};

const executeStoredProcedure = async (procedureName, params) => {
    try {
        let pool = await sql.connect(config);
        const request = pool.request();

        // Add parameters to the request
        if (params) {
            for (let key in params) {
                request.input(key, params[key]);
            }
        }
        const result = await request.execute(procedureName);
        return result.recordsets;
    } catch (err) {
        console.log("message: ", err.message);
    }
};




module.exports = {
    executeStoredProcedure
};