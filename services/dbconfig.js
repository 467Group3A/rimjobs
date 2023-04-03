const express = require('express')
const mysql = require("mysql2/promise")
const sqlite3 = require('sqlite3').verbose()

/*
 * Connections
 *
 * * * * * * * * */

// Establishes connection/pool to legacy DB
const legacyConnection = mysql.createPool({
    host: 'blitz.cs.niu.edu',
    port: '3306',
    database: 'csci467',
    user: 'student',
    password: 'student'
})

// Establishes connection to new DB
// './rimjobs.db' will be the name of our newDB
const newConnection = new sqlite3.Database('./rimjobs.db' , sqlite3.OPEN_READWRITE, (err) => {
    if(err)
    {
        return console.error(err.message)
    }
    else
    {
        console.log('New Database connected')
    }
})
 
module.exports = {
    legacyConnection,
    newConnection
}