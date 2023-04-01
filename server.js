const express = require("express")
const app = express()
const mysql = require("mysql2/promise")
const vue = require('vue')
const port = 3001

/*
 * New Database establish connection
 *
 * */
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./rimjobs.db' , sqlite3.OPEN_READWRITE, (err) => {
    if(err)
    {
        return console.error(err.message)
    }
    else
    {
        console.log('Database connected')
    }
})

/*
 * Legacy database pool creation
 *
 * */

const legacyPool = mysql.createPool({
    host: 'blitz.cs.niu.edu',
    port: '3306',
    database: 'csci467',
    user: 'student',
    password: 'student'
})

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs');

// Page rendering
app.get('/', (req, res) => {
    res.render('index')
})



// Routing requests




// static dir and listen
app.use(express.static('views'));


app.listen(port , () => {
    console.log(`Running on http://45.33.66.75:${port}`)
})
