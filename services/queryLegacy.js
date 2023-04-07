// This file contains the query functions for the legacy database
// Compare this snippet from services/queryLegacy.js:
const db = require('./db');
const helper = require('../helper');
const config = require('../config');

// Current Query
// SELECT number, description, price, weight FROM parts LIMIT 50,50
// TODO:
// 1. Add a function to query the new database and aggregate the data
async function getMultiple(page = 1) {
    const offset = helper.getOffset(page, config.listPerPage);
    const rows = await db.query(
        `SELECT * FROM parts LIMIT ${offset},${config.listPerPage}`
    );
    const data = helper.emptyOrRows(rows);
    const meta = { page };

    return {
        data,
        meta
    }
}

module.exports = {
    getMultiple
}