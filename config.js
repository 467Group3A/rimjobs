// This file contains the configuration for the database connection
//
// TODO:
// 1. Add a second config file for the new database
const legacyconfig = {
    db: {
        host: 'blitz.cs.niu.edu',
        user: 'student',
        password: 'student',
        database: 'csci467'
    },
    // This lists all of the items in the database
    // change this for per page
    listPerPage: 30,
};

module.exports = legacyconfig;