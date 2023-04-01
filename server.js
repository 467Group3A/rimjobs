// File: server.js
// Date: 3/31/2023
// Made by: Ryan Park
// Description: Main driver for node/express server
//      it will handle all back end interactions with
//      routing and interacting with the two databases
//
////////////////////////////////////////////////
const express = require("express")
const mysql = require("mysql2/promise")
const sqlite3 = require('sqlite3').verbose()
const vue = require('vue')
const app = express()
const port = 3001

/*
 * New Database establish connection
 *
 * */
const db = new sqlite3.Database('./rimjobs.db' , sqlite3.OPEN_READWRITE, (err) => {
    if(err)
    {
        return console.error(err.message)
    }
    else
    {
        console.log('New Database connected')
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

// Function that will take inventory parts
//   from legacy database, storing the ID
//    and a random amount of inventory from 1-100
//    into the new database rimjobs.db
//
// ******** I SHOULD REALLY BE DROPPING AND INITALIZING CONNECTIONS WHEN NEED BE *******
//
// Known bug right now: I ran the server ~15 times and 1 time it had a problem where the table
//                      was not created in the newDB
//
//***************************************************************** */
async function loadInventory() {
    try{
        // Grab parts from legacy storing in an array
        const [legacyRows] = await legacyPool.query('SELECT number FROM parts')

        // Drop the table if exists, this is a tactic that will stop ege from bamboozling
        const dropTableQuery = 'DROP TABLE IF EXISTS parts_inventory'
        db.run(dropTableQuery,  (err) => {
            if(err)
                console.log(err.message)
        })

        const createTableQuery = 'CREATE TABLE IF NOT EXISTS parts_inventory (number INT, amount INT)'
        db.run(createTableQuery, [], async (err) => {
            if (err) {
                console.log(err)
                console.log('loadInventory() could not create a new table!')
                return
            }

            // Generate and execute INSERT queries for each part ID
            for (const part of legacyRows) {
                // Generates random inventory amount from 1-100
                const randomAmount = Math.floor(Math.random() * 100) + 1;
                // Insert the part ID(number) and random amount into the parts_inventory table
                const insertQuery = `INSERT INTO parts_inventory (number, amount) VALUES (${part.number}, ${randomAmount})`
                db.run(insertQuery, [], (err) => {
                    if (err) {
                        console.log(err)
                        console.log(`loadInventory() could not insert part with ID ${part.number} into rimjobsdb!`)
                    }
                });
            }
            console.log('loadInventory() inserted randomized inventory to the newdb!')
        });

        console.log('loadInventory() had no problems!')
    } catch(err) {
        console.log(err)
        console.log('loadInventory() had a problem connecting and querying from the databases!')
    }
}

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs');

// Page rendering
app.get('/', (req, res) => {
    res.render('index')
})
app.get('/viewinventory', (req, res) => {
    res.render('viewinventory')
})





// Routing requests




// static dir and listen
app.use(express.static('views'));


app.listen(port , () => {
    console.log(`Running on http://45.33.66.75:${port}`)
    // Populate inventory in new db using legacy part ids
    loadInventory()
})
