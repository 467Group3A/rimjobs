const express = require("express")
const vue = require('vue')
const app = express()
const port = 3001

const { loadInventory } = require('./services/loadinventory')
const { legacyConnection , newConnection } = require('./services/dbconfig')


// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


// View inventory
app.get('/viewinventory', (req, res) => {
  res.sendFile(__dirname + "/views/viewinventory.html");
})


// Routing requests

// Legacy database request + inventory amount
app.get('/legacyparts', async (req, res) => {
    try {
      // Connect to legacy database
      const connect = await legacyConnection.getConnection();
  
      // Query the parts from legacy
      const [rows] = await connect.query('SELECT * FROM parts');
  
      // Drop connection
      connect.release();
  
      // Grab inventory from new db taking number and amount
      const newRows = await new Promise((resolve, reject) => {
        newConnection.all('SELECT * FROM parts_inventory', (err, rows) => {
          if (err) {
            reject(err);
          }
          resolve(rows);
        });
      });

      // Combine legacy and new db rows by part number
      const combinedRows = rows.map((row) => {
        const matchedRow = newRows.find((newRow) => newRow.number === row.number);
        
        // Add the .amount if the number(part_id) are the same
        if (matchedRow) {
          return {
            ...row,
            amount: matchedRow.amount,
          };
        } else { // If part ID is not found amount is 0, idealy this wont occur sense loadInventory()
          return {
            ...row,
            amount: 0,
          };
        }
      });
  
  
      // Send the final rows to Vue
      res.json(combinedRows);
      console.log('Retrieved information from legacy database correctly!');
    } catch (err) {
      console.log(err);
      console.log('Problem connecting and querying from legacy database!');
    }
  });
  



// static dir and listen
app.use(express.static('views'));

app.listen(port , () => {
    console.log(`Running on http://45.33.66.75:${port}`)
    // Populate inventory in new db using legacy part ids
    //loadInventory()
})