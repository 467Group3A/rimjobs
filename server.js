//modules
const express = require('express');
const session = require('express-session');
const axios = require("axios");
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const router = express.Router();
const promise = require('mysql2/promise');

// PRODUCTION PORT, REQUESTS ON PORT 80 ARE REDIRECTED TO THIS PORT
// const port = 2048;
const port = 5050;

const { loadInventory } = require('./services/loadinventory')
const { legacyConnection, newConnection, initializeNewDB, cleanOrders, getOrderDetails } = require('./services/dbconfig') // Some of these functions will be removed

const app = express();

// Allow for session storage
app.use(session({
  secret: 'rimjobsKey',
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 } // Will expire login after 1hr
}));

//Handle HTTP POST requests
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// Engine
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// Static Folders (CSS + Vue Components)
app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'components')));

// Legacy Database Connection Info
const connection = mysql.createConnection({
  host: 'blitz.cs.niu.edu',
  user: 'student',
  password: 'student',
  database: 'csci467',
});
 
connection.connect((error) => {
  if (error) {
    console.error('Error connecting to database:', error);
  } else {
    console.log('--- CONNECTED TO DATABASE ---');
  }
});

/* -------------------------------------------------------- 
                   CUSTOMER FACING VIEWS
   -------------------------------------------------------- */
// Root, send index
app.get("/", (req, res) => {
  //send the index.html file for all requests
  res.sendFile(__dirname + "/views/index.html");
});

// If url is /viewinventory, send the viewinventory.html file
app.get('/viewinventory', (req, res) => {
  res.sendFile(__dirname + "/views/viewinventory.html");
})

// Cart Page
app.get('/cart', (req, res) => {
  res.sendFile(__dirname + "/views/cart.html");
})

// Checkout page
app.get('/ccauth', (req, res) => {
  res.sendFile(__dirname + "/views/ccauth.html");
})

// Credits Page
app.get('/credits', (req, res) => {
  res.sendFile(__dirname + "/views/credits.html");
})

/* -------------------------------------------------------- 
                   EMPLOYEE FACING VIEWS
   -------------------------------------------------------- */

// Used to access the following pages below
app.get('/login', (req, res) => {
  res.sendFile(__dirname + "/views/login.html");
})

app.get('/employee', isEmployee, (req, res) => {
  res.sendFile(__dirname + "/views/employee.html");
})

app.get('/vieworders', isEmployee, (req, res) => {
  res.sendFile(__dirname + "/views/vieworders.html");
})

app.get('/vieworderdetails', isEmployee, (req, res) => {
  res.sendFile(__dirname + "/views/vieworderdetails.html");
})

app.get('/replenish', isEmployee, (req, res) => {
  res.sendFile(__dirname + "/views/replenish.html");
})

app.get('/shippingfees', isAdmin, (req, res) => {
  res.sendFile(__dirname + "/views/shippingfees.html");
})

/* -------------------------------------------------------- 
                   API ENDPOINTS
   -------------------------------------------------------- */

// Start of endpoints
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
    if (err) {
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
    if (err) {
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
    if (err) {
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
  // The entire JSON Object
  const recievedData = req.body

  // This is the form data that will be sent to ege's cc auth
  const formData = recievedData.formData

  // This is extra stuff for storing in db
  const customerData = recievedData.customer

  // This is the cart data including id price and qty
  const orderData = recievedData.orderInfo
  const url = "http://blitz.cs.niu.edu/CreditCard/"

  let totalPrice = 0;
  let totalWeight = 0;
  let shippingCost = 0;

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
      // Otherwise send the whole json back as confirmation and update the proper databases
      else {
        // Calculate total price and weight
        for (let i = 0; i < orderData.length; i++) {
          const item = orderData[i]
          totalPrice += item.price * item.quantity
          totalWeight += item.weight * item.quantity
        }

        const db = newConnection()

        // Insert the customer data and transaction number into the Orders table
        db.run('INSERT INTO orders (id, name, email, amount, weight, shipping, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [formData.trans, customerData.name, customerData.email, totalPrice, totalWeight, customerData.weightCost, customerData.address, "In Progress"], (err) => {
          if (err) {
            console.log(err)
          }
        })

        // Loop through the customers cart
        for (let i = 0; i < orderData.length; i++) {
          let item = orderData[i]
          // Insert the order items into the orderitems table
          db.run('INSERT INTO orderitems (orderid, partnumber, quantity) VALUES (?, ?, ?)', [formData.trans, item.item_id, item.quantity], (err) => {
            if (err) {
              console.log(err)
            }
          })
          // Update the inventory table with the new quantity
          db.run('UPDATE inventory SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.item_id], (err) => {
            if (err) {
              console.log(err)
            }
          })
        }
        // Close the db connection and send success status to front end
        db.close();
        res.status(200).json(response.data)
      }
    })
    .catch((error) => {
      console.log(error)
      res.status(501).send("An error occured with third party credit card authorization!")
    });
});

// Used for employee/admin login verification
app.post('/api/login', async (req, res) => {
  const username = req.body.username
  const password = req.body.password

  const db = newConnection();

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
    if(err){
      console.log(err)
    }
    // Check if that username exists
    if(!row) {
      res.status(500).json({ message: 'Invalid username' })
      console.log('invalid username')
      // if invalid username dont continue
      return
    }
    // Use bcrypt to check if password is the same
    const checkPassword = await bcrypt.compare(password, row.password.toString())

    //If its a match authenticate accordingly
    if(checkPassword) {
      res.status(200).json({ message: 'Correct login info!'} )
      console.log('correct login')
      // Set their session variable to admin/employee
      if(row.role == 'admin') {
        req.session.isAdmin = true;
      } else {
        req.session.isEmployee = true;
      }
      req.session.save()
      //console.log(req.session) - Server side testing
    } else { // Otherwise send back error
      res.status(501).json({ message: 'Invalid password' }) 
      console.log('invalid password')
    }
  })

  db.close();
});

// Endpoint for employee portal
app.get('/api/userRole', (req, res) => {
  if (req.session.isAdmin) {
    res.status(200).json({ isAdmin: true });
    // No reason to return bad status if they're just an employee
  }
});

// Logs an employee/admin out
app.get('/api/logout', (req, res) => {
  req.session.destroy();

  // DOESNT WORK, NEED TO POSSIBLY CLEAR COOKIE ON CLIENT SIDE!!!!
  // SEEMS TO WORK NOW?
});

// Middle ware to check session variable allows admins to enter a page
async function isEmployee(req, res, next) {
  if(req.session && req.session.isAdmin || req.session.isEmployee){
    // if their session variable says they're admin let them in
    next()
  } else {
    if (req.session) { // Check is session is valid
      await req.session.reload(async function(err) { // refreshing was causing bugs earlier but works now
        if (err) {
          console.log(err)
        }
        if (req.session && req.session.isAdmin || req.session.isEmployee) {
          // if their session variable says they're an employee/admin
          next()
        } else {
          res.redirect('/login')
        }
      })
    } else {
      res.redirect('/login')
    }
  }
}

// Middle ware to check session variable allows admins to enter a page
async function isAdmin(req, res, next) {
  if(req.session && req.session.isAdmin){
    // if their session variable says they're admin let them in
    next()
  } else {
    if (req.session) { // check if session is valid
      await req.session.reload(async function(err) { // refreshing was causing bugs earlier but works now
        if (err) {
          console.log(err)
        }
        if (req.session && req.session.isAdmin) {
          // if their session variable says they're an admin
          next()
        } else {
          res.redirect('/login')
        }
      })
    } else {
      res.redirect('/login')
    }
  }
}

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });
  return;
});

// Displays the port number the server is listening on
app.listen(port, () => {
  if (port == 2048) {
    console.log(`Node Server listening at http://rimjobs.store/`);
  }
  else {
    console.log(`Node Server listening at http://rimjobs.store:${port}`);
  }
});
