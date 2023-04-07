const express = require("express");
const axios = require("axios");
var path = require('path');
const app = express();
const port = 3001;

const legacyPartsRouter = require("./routes/legacyParts");
const { loadInventory } = require('./services/loadinventory')
const { legacyConnection , newConnection, initializeNewDB , cleanOrders } = require('./services/dbconfig')

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// CSS and image files
app.use(express.static(path.join(__dirname,'assets')));

// Vue Component files
app.use(express.static(path.join(__dirname,'components')));

// If url is /, send the index.html file
app.get("/", (req, res) => {
  //send the index.html file for all requests
  res.sendFile(__dirname + "/views/index.html");
});

// If url is /viewinventory, send the viewinventory.html file
app.get('/viewinventory', (req, res) => {
  res.sendFile(__dirname + "/views/viewinventory.html");
})

// If url is /template, send the template.html file
app.get('/template', (req, res) => {
  res.sendFile(__dirname + "/views/template.html");
})

// If url is /ccauth, send the ccauth.html file
app.get('/ccauth', (req, res) => {
  res.sendFile(__dirname + "/views/ccauth.html");
})


// Sends back json objects that combine legacy parts with a random inventory amount generated by loadinventory()
app.get('/legacyparts', async (req, res) => {
    try {
      // Connect to legacy database
      const connect = await legacyConnection.getConnection();
  
      // Query the parts from legacy
      const [rows] = await connect.query('SELECT * FROM parts');
  
      // Drop connection
      connect.release();

      const db = newConnection()
  
      // Grab inventory from new db taking number and amount
      const newRows = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM parts_inventory', (err, rows) => {
          if (err) {
            reject(err);
          }
          resolve(rows);
        });
      });

      // Drop connection to new db.
      db.close()

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

// Used to add someone to the new db
app.post('/creditcardauth', (req, res) => {
  const formData = req.body
  const url = "http://blitz.cs.niu.edu/CreditCard/"

  // Send post request to ege's cc auth
  axios.post(url, formData, {
    headers: {
      'Content-type': 'application/json',
      'Accept': 'application/json'
    },
  })
    .then((response) => {
      console.log(response.data)
      // If there is an error from credit card auth, send to user.
      if('errors' in response.data){
        res.status(500).json(response.data)
      }
      else{ // Otherwise send the whole json back as confirmation ( for now )
        res.status(200).json(response.data)
      }
    })
    .catch((error) => {
      console.log(error)
      res.status(501).send("An error occured with third party credit card authorization!")
    });
});


// Another example:
// If url is /about, send the about.html file
// app.get("/about", (req, res) => {
//   res.sendFile(__dirname + "/views/about.html");
// });

// If url is /legacy-parts, send the legacyPartsRouter
app.use("/legacy-parts", legacyPartsRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });
  return;
});

// Displays the port number the server is listening on
app.listen(port, () => {
  console.log(`Node Server listening at http://45.33.66.75:${port}`);
  // Populate inventory in new db using legacy part ids
  // Could do when server runs or manually/scheduled run it in future
   loadInventory()
   //cleanOrders()
   initializeNewDB()
});
