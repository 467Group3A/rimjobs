// This file uses mysql2 to connect to the database and execute queries
const mysql = require('mysql2/promise');
const config = require('../config');

async function query(sql, params) {
    try {
        const connection = await mysql.createConnection(config.db);
        const [results,] = await connection.execute(sql, params);
        return results;
    }
    catch (err) {
        console.log(err);
        return null;
    }
}

module.exports = {
    query
}