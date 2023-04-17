//modules
const express = require('express');
const axios = require("axios");
const mysql = require('mysql2');
const bodyParser = require('body-parser');
var path = require('path');
const router = express.Router();
const promise = require('mysql2/promise');

const port = 3001;


const { loadInventory } = require('./services/loadinventory')
const { legacyConnection, newConnection, initializeNewDB, cleanOrders, getOrderDetails } = require('./services/dbconfig') // Some of these functions will be removed

const app = express();

//Handle HTTP POST requests
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(
  express.urlencoded({
    extended: true,
  })
);

// CSS and image files
app.use(express.static(path.join(__dirname, 'assets')));

// Vue Component files
app.use(express.static(path.join(__dirname, 'components')));

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
    console.log('--- CONNECTED TO DATABASE ---');
  }
});

// // Get all info from database
// function getAllParts() {
//   return new Promise((resolve, reject) => {
//     connection.query('SELECT * FROM parts', function (error, results, fields) {
//       if (error) {
//         reject(error);
//       } else {
//         resolve(results);
//       }
//     });
//   });
// }

//endpoint for parts page
// app.get('/parts', async (req, res) => {
//   try {
//     const results = await getAllParts();
//     const cartTotal = products.length;
//     res.render('parts', { parts: results, cartTotal, cartItems: products });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error retrieving parts');
//   }
// });

const products = [];
//viewinventory post
app.post('/viewinventory', (req, res) => {

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

  res.redirect('/viewinventory');
});

//cart number total
app.get('/cartTotal', (req, res) => {
  const cartTotal = products.length;
  res.json({ cartTotal });
});

//endpoint to send info of items in cart 
app.get('/cartItems', (req, res) => {
  res.send(JSON.stringify(products));
});

//if url is /cart, send to cart.html file
app.get('/cart', (req, res) => {
  res.sendFile(__dirname + "/views/cart.html");
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

// If url is /template, send the template.html file
app.get('/template', (req, res) => {
  res.sendFile(__dirname + "/views/template.html");
})

// If url is /ccauth, send the ccauth.html file
app.get('/ccauth', (req, res) => {
  res.sendFile(__dirname + "/views/ccauth.html");
})

// If url is /vieworders, send the vieworders.html file
app.get('/vieworders', (req, res) => {
  res.sendFile(__dirname + "/views/vieworders.html");
})

// If url is /vieworderdetails, send the vieworderdetails.html file
app.get('/vieworderdetails', (req, res) => {
  res.sendFile(__dirname + "/views/vieworderdetails.html");
})

// If url is /replenish, send the replenish.html file
app.get('/replenish', (req, res) => {
  res.sendFile(__dirname + "/views/replenish.html");
})

// If url is /replenish, send the replenish.html file
app.get('/shippingfees', (req, res) => {
  res.sendFile(__dirname + "/views/shippingfees.html");
})
  
app.get('/cart', (req, res) => {
  res.sendFile(__dirname + "/views/cart.html");
})

app.get('/credits', (req, res) => {
  res.sendFile(__dirname + "/views/credits.html");
})

app.get('/legacyparts', async (req, res) => {
  const perPage = parseInt(req.query.per) || 10;
  let page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * perPage;

  connection.query(`SELECT * FROM parts LIMIT ${perPage} OFFSET ${offset}`, (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).send('Error retrieving data from database');
    } else {
      console.log(`--- FETCH ${perPage} ITEMS: OFFSET ${offset} ---`);
      res.send(results);
    }
  });
});

app.get('/inventory', (req, res) => {

  const db = newConnection()

  db.all('SELECT * FROM inventory', (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving data from database');
    } else {
      console.log('--- FETCHED INVENTORY ---');
      res.send(rows);
    }
  });
});

// Sends back json objects that combine legacy parts with a random inventory
app.get('/api/combine-parts-quantity', async (req, res) => {
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
      db.all('SELECT * FROM inventory', (err, rows) => {
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
      const matchedRow = newRows.find((newRow) => newRow.id === row.number);
      
      // Add the .amount if the number(part_id) are the same
      if (matchedRow) {
        return {
          ...row,
          amount: matchedRow.quantity,
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

// Sends back json objects that contain orders
app.get('/api/orders-list', async (req, res) => {
  try {
    const db = newConnection()
    // Grab orders from the 
    const data = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM orders', (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      });
    });

    // Drop connection to new db.
    db.close()

    // Send the final rows to Vue
    res.json(data);
    console.log('Retrieved orders succesfully');
  } catch (err) {
    console.log(err);
    console.log('Problem retrieving orders');
  }
});

// Sends back json objects that contain orders
app.get('/api/orderdetails/:id', async (req, res) => {
  try {
    // hold orderid
    const orderId = req.params.id

    const db = newConnection()

    // grab orderitems
    const orderItems = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM orderitems WHERE orderid = ?`, [orderId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // grab order and combine
    const order = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM orders WHERE id = ?`, [orderId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    db.close();

    //const updatedOrderItems = await getOrderDetails(orderItems);

    // combine and send back
    const orderDetails = {
      orderId: orderId,
      order: order,
      orderItems: orderItems // would be updateOrderItems if it didnt timeout
    };
    res.json(orderDetails);

    // Send the final rows to Vue
    console.log('Retrived order items succesfully');
  } catch (err) {
    console.log(err);
    console.log('Can retrieve order items');
  }
});

// Updates the order status
app.post('/api/updateorder', async (req, res) => {

  // Take the order id and new status
  const updateTo = req.body.orderStatus;
  const orderId = req.body.orderId;
  console.log(updateTo)
  console.log(orderId)

  const db = newConnection()

  // Update the status of orderID
  db.run(
    'UPDATE orders SET status = ? WHERE id = ?',
    [updateTo, orderId],
    function (err) {
      if (err) {
        console.log('Unable to update order status')
        res.sendStatus(500)
      } else {
        res.sendStatus(200)
      }
    }
  )

  db.close();
});

// Replenish an inventory part
app.post('/api/replenish', async (req, res) => {

  // Take the order id and new status
  const partId = req.body.partId
  const addStock = req.body.quantity

  const db = newConnection()

  // Get current quantity from the database
  db.get(
    'SELECT quantity FROM inventory WHERE id = ?',
    [partId],
    (err, row) => {
      if (err) {
        res.sendStatus(500)
      } else if (!row) {
        res.sendStatus(404)
      } else {
        // Grab current to show change
        const currentQuantity = row.quantity

        // Add incoming stock to the current stock
        const updatedQuantity = currentQuantity + addStock

        // Update the inventory with the new quantity
        db.run(
          'UPDATE inventory SET quantity = ? WHERE id = ?',
          [updatedQuantity, partId],
          (err) => {
            if (err) {
              res.sendStatus(500)
            } else { // send message to front end employee
              res.status(200).json({ message: `You have updated part number ${partId} from ${currentQuantity} to ${updatedQuantity}.` })
            }
          }
        );
      }
    }
  );
  db.close()
});

// Endpoint that removes amount of part from inventory
app.post('/api/replenish/removal', async (req, res) => {

  // Take the order id and new status
  const partId = req.body.partIdR
  const removalStock = req.body.quantityR

  const db = newConnection()

  // Get current quantity from the database
  db.get(
    'SELECT quantity FROM inventory WHERE id = ?',
    [partId],
    (err, row) => {
      if (err) {
        res.sendStatus(500)
      } else if (!row) {
        res.sendStatus(404)
      } else {
        // Grab current to show change
        const currentQuantity = row.quantity

        // Remove stock from inventory 
        const updatedQuantity = currentQuantity - removalStock

        // Update the inventory with the new quantity
        if (updatedQuantity < 0) {
          res.status(200).json({ message: `Unable to update part ${partId} from ${currentQuantity} to ${updatedQuantity}.` })
        } else {
          db.run(
            'UPDATE inventory SET quantity = ? WHERE id = ?',
            [updatedQuantity, partId],
            (err) => {
              if (err) {
                res.sendStatus(500)
              } else { // send message to front end employee
                res.status(200).json({ message: `You have updated part number ${partId} from ${currentQuantity} to ${updatedQuantity}.` })
              }
            }
          );
        }
      }
    }
  );

  db.close()
});

// Grab shipping brackets from local db
app.get('/api/get-shipping-fees', async (req, res) => { 

  const db = newConnection()
  db.all('SELECT * FROM brackets ORDER BY weight ASC', (err, rows) => {
    if(err) {
      console.log(err)
    }
    else {
      res.json(rows)
    }
    db.close()
  })
})

// Update weight brackets
app.post('/api/add-shipping-fee', async (req, res) => {
  const weight = req.body.weight
  const cost = req.body.cost

  const db = newConnection()
  db.run('INSERT INTO brackets (weight, cost) VALUES (?, ?)', weight, cost, (err) => {
    if(err) {
      console.log(err)
      res.status(500).end() // if theres an error, it obviosuly will show when updating on front end but also could make popup
    } // with that same reasoning there is no need for a else, the admin will see the update or error popup.
    else {
      console.log(`Added weight bracket ${weight}lbs costs $${cost}`)
      res.status(200).end() // Send success status to front end
    }
  })

  db.close()
});

// Remove weight bracket
app.post('/api/del-shipping-fee', async (req, res) => {
  const cost = req.body.cost
  const weight = req.body.weight

  const db = newConnection()
  db.run(`DELETE FROM brackets WHERE cost = ? and weight = ?`, [cost, weight], (err) => {
    if(err) {
      console.log(err)
      res.status(500).end() // again if its not removed it will auto update to user, but can add error
    }  // checking w front end by sending 500
    else {
      console.log(`Removed weight bracket ${weight}lbs that costs $${cost}`)
      res.status(200).end() // all good, send status back to front end
    }
  })
  db.close()
});

// Endpoint for sending post to 3rd party CC authorizor
app.post('/api/creditcardauth', (req, res) => {
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
      if ('errors' in response.data) {
        res.status(500).json(response.data)
      }
      else { // Otherwise send the whole json back as confirmation ( for now )
        res.status(200).json(response.data)
      }
    })
    .catch((error) => {
      console.log(error)
      res.status(501).send("An error occured with third party credit card authorization!")
    });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });
  return;
});

// Displays the port number the server is listening on
app.listen(port, () => {
  console.log(`Node Server listening at http://rimjobs.store:${port}`);
  // Populate inventory in new db using legacy part ids
  // Could do when server runs or manually/scheduled run it in future
  //loadInventory()
});
