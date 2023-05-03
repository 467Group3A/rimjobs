const express = require('express')
const mysql = require("mysql2/promise")
const sqlite3 = require('sqlite3').verbose()
const LocalStorage = require('node-localstorage').LocalStorage;
require('console-stamp')(console, { 
  format: ':date(HH:MM:ss)' 
} );

// These are terminal color escape codes
const DEFAULT = "\033[39m"
const GREEN = "\033[92m"
const RED = "\033[91m"
const ORANGE = "\033[33m"
const MAGENTA = "\033[35m"

// Smashed into nice variables for use in console.log
const SUCCESS = GREEN + "SUCCESS: " + DEFAULT
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
function newConnection() {
    const newConnection = new sqlite3.Database('./rimjobs.db' , sqlite3.OPEN_READWRITE, (err) => {
        if(err)
        {
            return console.error(err.message)
        }
        else
        {
            console.log(SUCCESS + 'Local Database connected')
        }
    })
    return newConnection
}

 
module.exports = {
    legacyConnection,
    newConnection
}