const express = require('express')
const { newConnection, legacyConnection } = require('./dbconfig');


// Function that will take inventory parts
//   from legacy database, storing the ID
//    and a random amount of inventory from 1-100
//    into the new database rimjobs.db
//
// Known bug right now: I ran the server ~15 times and 1 time it had a problem where the table
//                      was not created in the newDB
//
//
//   New DB called 'rimjobs.db'
//                  - parts_inventory table
//                    - number INT, amount INT
//
//***************************************************************** */
async function loadInventory() {
    try {
      const connect = await legacyConnection.getConnection();
  
      // Grab parts from legacy storing in an array
      const [legacyRows] = await connect.query('SELECT number FROM parts')
  
      // Drop the connection
      connect.release()
  
      // Establish new db
      const db = newConnection()
  
      // Drop the table if exists, this is a tactic that will stop ege from bamboozling
      const dropTableQuery = 'DROP TABLE IF EXISTS parts_inventory'
      await new Promise((resolve, reject) => {
        db.run(dropTableQuery, (err) => {
          if (err) {
            console.log(err.message)
            reject(err)
          } else {
            console.log('parts_inventory table dropped')
            resolve()
          }
        });
      });
  
      const createTableQuery = 'CREATE TABLE IF NOT EXISTS parts_inventory (number INT, amount INT)'
      await new Promise((resolve, reject) => {
        db.run(createTableQuery, [], (err) => {
          if (err) {
            console.log(err)
            console.log('loadInventory() could not create a new table!')
            reject(err)
          } else {
            console.log('parts_inventory table created')
            resolve()
          }
        });
      });
  
      // Generate and execute INSERT queries for each part ID
      for (const part of legacyRows) {
        // Generates random inventory amount from 1-100
        const randomAmount = Math.floor(Math.random() * 100) + 1;
        // Insert the part ID(number) and random amount into the parts_inventory table
        const insertQuery = `INSERT INTO parts_inventory (number, amount) VALUES (${part.number}, ${randomAmount})`
        await new Promise((resolve, reject) => {
          db.run(insertQuery, [], (err) => {
            if (err) {
              console.log(err);
              console.log(`loadInventory() could not insert part with ID ${part.number} into parts_inventory!`)
              reject(err)
            } else {
              resolve()
            }
          });
        });
      }
  
      console.log('loadInventory() inserted randomized inventory to the parts_inventory table!')
  
      // Drop new database connection
      db.close()
    } catch (err) {
      console.log(err)
      console.log('loadInventory() had a problem connecting and querying from the databases!')
    }
  }
  

module.exports = { loadInventory }

