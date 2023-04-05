//modules
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
var path = require('path');
const port = 3300; 

const legacyPartsRouter = require("./routes/legacyParts");
const { loadInventory } = require('./services/loadinventory')
const { legacyConnection , newConnection } = require('./services/dbconfig')

const app = express();

//use ejs as view engine
app.set('view engine', 'ejs');

//Handle HTTP POST requests
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());

app.engine('html', require('ejs').renderFile);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// CSS and image files
app.use(express.static(path.join(__dirname,'assets')));

// Vue Component files
app.use(express.static(path.join(__dirname,'components')));

// legacy database info
const connection = mysql.createConnection({
    host: 'blitz.cs.niu.edu',
    user: 'student',
    password: 'student',
    database: 'csci467',
});

// Connect to legacy database 
connection.connect((error) => {
    if (error) {
        console.error('Error connecting to database:', error);
    } else {
        console.log('Connected to database successfully!');
    }
});

// Get all info from database
function getAllParts() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM parts', function (error, results, fields) {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

//endpoint for parts page
app.get('/parts', async (req, res) => {
    try {
        const results = await getAllParts();
        const cartTotal = products.length;
        res.render('parts', { parts: results, cartTotal, cartItems: products});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving parts');
    }
});

// TODO: Fix Render. It keeps saying theres no renderer chosen
//GET request for cart page
app.get('/cart', (req, res) => {
    const cartTotal = products.length;
    res.render('cart', {cartItems: products, cartTotal});
});

//parts endpoint
const products = [];
app.post('/parts', (req, res) => {
    const number = req.body.number;
    const description = req.body.description;
    const price = req.body.price;
    const weight = req.body.weight; 
    const image = req.body.image;
    const quantity = req.body.quantity;
    
    // add the product to the products array
    products.push({
        number: number,
        description: description,
        price: price,
        weight: weight,
        image: image,
        quantity: quantity
    });
    
    res.redirect('/parts');
});


// If url is /, send the index.html file
app.get("/", (req, res) => {
  //send the index.html file for all requests
  res.sendFile(__dirname + "/views/index.html");
});

// If url is /viewinventory, send the viewinventory.html file
app.get('/viewinventory', (req, res) => {
  res.sendFile(__dirname + "/views/viewinventory.html");
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
   //loadInventory()
});

