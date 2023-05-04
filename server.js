//
// - - - - - - - - - - - - NPM MODULES - - - - - - - - - - - - 
//
const fs = require('fs');
const http = require('http')
const https = require('https')
const express = require('express');
const session = require('express-session');
const axios = require("axios");
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
const bodyParser = require('body-parser');
const path = require('path');
const router = express.Router();
const promise = require('mysql2/promise');
const LocalStorage = require('node-localstorage').LocalStorage;

//
// - - - - - - - - - - - -  Local Modules - - - - - - - - - - - - 
//
const localStorage = new LocalStorage('./localStorage');
const { legacyConnection, newConnection, getOrderDetails } = require('./services/dbconfig') // Some of these functions will be removed
const emailConfig = require('./services/emailconfig')

// 
// - - - - - - - - - - - - Server Related - - - - - - - - - - - - 
//
const privateKey = fs.readFileSync('', 'utf8');
const certificate = fs.readFileSync('', 'utf8');
const ca = fs.readFileSync('', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};

const httpPort = 2048;
const httpsPort = 2443;

//
// - - - - - - - - - - - -  Logging Related - - - - - - - - - - - - 
//
const DEFAULT = "\033[39m"
const GREEN = "\033[92m"
const RED = "\033[91m"
const ORANGE = "\033[33m"
const MAGENTA = "\033[35m"
const GREY = "\033[37m"

// Smashed into nice variables for use in console.log
const SUCCESS = GREEN + "SUCCESS: " + DEFAULT
const ERROR = RED + "ERROR: " + DEFAULT
const SENT = ORANGE + "SENT: " + DEFAULT
const API = MAGENTA + "API: " + DEFAULT
const PROD = ORANGE + "[PRODUCTION PORT]" + DEFAULT
const DEV = GREEN + "[DEVELOPMENT PORT]" + DEFAULT
const INFO = GREY + "INFO: " + DEFAULT

// Console timestamp for logging
require('console-stamp')(console, { 
  format: ':date(HH:MM:ss)' 
} );

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const app = express();

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);


// Redirection from http to https
app.use((req, res, next) => {
  if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
}); 

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
  connectTimeout: 60000
});

/* -------------------------------------------------------- 
                   CUSTOMER FACING VIEWS
   -------------------------------------------------------- */
// Root, send index
app.get("/", (req, res) => {
  //send the index.html file for all requests
  console.log(SENT + "Index")
  res.sendFile(__dirname + "/views/index.html");
});

// If url is /viewinventory, send the viewinventory.html file
app.get('/viewinventory', (req, res) => {
  console.log(SENT + "Product List")
  res.sendFile(__dirname + "/views/viewinventory.html");
})

// Cart Page
app.get('/cart', (req, res) => {
  console.log(SENT + "Cart")
  res.sendFile(__dirname + "/views/cart.html");
})

// Checkout page
app.get('/checkout', (req, res) => {
  console.log(SENT + "Checkout")
  res.sendFile(__dirname + "/views/ccauth.html");
})

// Credits Page
app.get('/credits', (req, res) => {
  console.log(SENT + "Credits")
  res.sendFile(__dirname + "/views/credits.html");
})

app.get('/findmyorder', (req, res) => {
  console.log(SENT + "Find Order")
  res.sendFile(__dirname + "/views/findmyorder.html");
})

/* -------------------------------------------------------- 
                   EMPLOYEE FACING VIEWS
   -------------------------------------------------------- */

// Used to access the following pages below
app.get('/login', (req, res) => {
  console.log(SENT + "Login")
  res.sendFile(__dirname + "/views/login.html");
})

app.get('/employee', isEmployee, (req, res) => {
  console.log(SENT + "Employee Index")
  res.sendFile(__dirname + "/views/employee.html");
})

app.get('/vieworders', isEmployee, (req, res) => {
  console.log(SENT + "View All Orders")
  res.sendFile(__dirname + "/views/vieworders.html");
})

app.get('/vieworderdetails', isEmployee, (req, res) => {
  console.log(SENT + "Order Details")
  res.sendFile(__dirname + "/views/vieworderdetails.html");
})

app.get('/replenish', isEmployee, (req, res) => {
  console.log(SENT + "Sent Replenish")
  res.sendFile(__dirname + "/views/replenish.html");
})

app.get('/shippingfees', isAdmin, (req, res) => {
  console.log(SENT + "Shipping Fees")
  res.sendFile(__dirname + "/views/shippingfees.html");
})

app.get('/managelogins', isAdmin, (req, res) => {
  console.log(SENT + "Login Management")
  res.sendFile(__dirname + "/views/managelogins.html");
})

/* -------------------------------------------------------- 
                   API ENDPOINTS
   -------------------------------------------------------- */
// Start of endpoints
app.get('/legacyparts', async (req, res) => {
  connection.connect((error) => {
    if (error) {
      console.error(ERROR + 'connecting to database:', error);
    } else {
      console.log(SUCCESS + "Connected to Legacy Database");
    }
  });
  console.log(API + "Legacy Parts Endpoint")
  const perPage = parseInt(req.query.per) || 10;
  let page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * perPage;

  connection.query(`SELECT * FROM parts LIMIT ${perPage} OFFSET ${offset}`, (error, results) => {
    if (error) {
      console.error(ERROR + "In /legacyparts: " + error);
      res.status(500).send('Error retrieving data from database');
    } else {
      console.log(API + "Fetch " + perPage + " items with offset " + offset);
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
      console.log(API + "Fetch Local Inventory");
      res.send(rows);
    }
  });
});

app.get('/api/search', async (req, res) => {
  connection.connect((error) => {
    if (error) {
      console.error(ERROR + 'connecting to database:', error);
    } else {
      console.log(SUCCESS + "Connected to Legacy Database");
    }
  });
  const item = req.query.searchTerm
  console.log(API + "Search For: " + item);

  console.log(`SELECT * FROM parts WHERE description LIKE "%${item}%"`);
  connection.query(`SELECT * FROM parts WHERE Description LIKE "%${item}%"`, (error, results) => {
    if (error) {
      console.error(error);
    } else {
      res.json(results);
    }
  });
  connection.end()
});

// Customer endpoint that allows them to find their order information given orderId
app.post('/api/find-order', async (req, res) => {
  const orderId = req.body.orderId;

  const db = newConnection();

  // get order from table
  db.get('SELECT * FROM orders WHERE id = ?', orderId, async (error, order) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    } else if (!order) {
      res.status(404).json({ error: 'Order not found' });
    } else {
      // grab orderitems from table
      db.all('SELECT * FROM orderitems WHERE orderid = ?', orderId, async (err, orderItems) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: 'Server error' });
        } else {

            // orderItems now contains each part/id select those only from legacy db
              let sql = "SELECT * FROM parts WHERE"

              for(let i=0; i<orderItems.length; i++) {
                if(i===0) {
                  sql += ` number = '${orderItems[i].partnumber}'`
                } else {
                  sql += ` OR number = '${orderItems[i].partnumber}'`
                }
              }

              // Declare variable to hold each orderItem info
              let orderItemsInfo = null

              try{
                // Connect to legacy database
                const connect = await legacyConnection.getConnection()

                // Query the parts from legacy
                const [row] = await connect.query(sql)
                orderItemsInfo = row // Assign from query

                // Drop connection
                connect.release()
              } catch(err){
                console.log(err)
              }

          // Now we should append the quantity to orderItemsInfo
          const combinedRows = orderItemsInfo.map((row) => {
            const matchedRow = orderItems.find((orderItems) => orderItems.partnumber === row.number);
            
            // Add the .amount if the number(part_id) are the same
            if (matchedRow) {
              return {
                ...row,
                amount: matchedRow.quantity,
              };
            } else { // If part ID is not found amount is 0, idealy this wont occur
              return {
                ...row,
                amount: 0,
              };
            }
          });

          // Combine and send to front end
          const orderDetails = {
            foundOrder: order,
            orderItems: combinedRows 
          };
          res.json(orderDetails);
        }
        db.close();
      });
    }
  });
});

// Sends back json objects that combine legacy parts with a random inventory
app.get('/api/combine-parts-quantity', async (req, res) => {
  console.log(API + "Combine Parts + Quantity");
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
    console.log(SUCCESS + 'Retrieved information from legacy database correctly!');
  } catch (err) {
    console.log(ERROR + 'Problem connecting and querying from legacy database:' + err);
  }
});

// Sends back json objects that contain orders
app.get('/api/orders-list', async (req, res) => {
  console.log(API + "Orders List");
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
    console.log(SUCCESS + 'Retrieved orders succesfully');
  } catch (err) {
    console.log(err);
    console.log(ERROR + 'Problem retrieving orders');
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
    console.log(SUCCESS + 'Retrived order ID: ' + orderId +' succesfully');
  } catch (err) {
    //console.log(err);
    console.log(ERROR + "Cannot Retrieve Items: " + err);
  }
});

// Updates the order status
app.post('/api/updateorder', async (req, res) => {

  // Take the order id and new status
  const updateTo = req.body.orderStatus;
  const orderId = req.body.orderId;

  console.log(API + "Update Order " + orderId + " to status " + updateTo);

  const db = newConnection()

  // Update the status of orderID
  db.run(
    'UPDATE orders SET status = ? WHERE id = ?',
    [updateTo, orderId],
    function (err) {
      if (err) {
        console.log(ERROR + 'Unable to update order status')
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

  console.log(API + "Adding " + addStock + " qty to part ID " + partId);

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

  console.log(API + "Removing " + removalStock + " qty to part ID " + partId);

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
  console.log(API + "Get Shipping Fees");
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

  console.log(API + "New Weight Bracket $" + cost + " -> " + weight);

  const db = newConnection()
  db.run('INSERT INTO brackets (weight, cost) VALUES (?, ?)', weight, cost, (err) => {
    if (err) {
      console.log(ERROR + "Adding Shipping Bracket" + err)
      res.status(500).end() // if theres an error, it obviosuly will show when updating on front end but also could make popup
    } // with that same reasoning there is no need for a else, the admin will see the update or error popup.
    else {
      res.status(200).end() // Send success status to front end
    }
  })

  db.close()
});

// Remove weight bracket
app.post('/api/del-shipping-fee', async (req, res) => {
  const cost = req.body.cost
  const weight = req.body.weight

  console.log(API + "Removing Weight Bracket $" + cost + " -> " + weight);

  const db = newConnection()
  db.run(`DELETE FROM brackets WHERE cost = ? and weight = ?`, [cost, weight], (err) => {
    if (err) {
      console.log(ERROR + "Removing Shipping Bracket " + err)
      res.status(500).end() // again if its not removed it will auto update to user, but can add error
    }  // checking w front end by sending 500
    else {
      res.status(200).end() // all good, send status back to front end
    }
  })
  db.close()
});

// Endpoint for sending post to 3rd party CC authorizor
app.post('/api/creditcardauth', (req, res) => {
  console.log(API + "Credit Card Transaction Page");
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
        console.log(ERROR + "Transaction Failed");
        res.status(500).json(response.data)
      }
      // Otherwise send the whole json back as confirmation and update the proper databases
      else {
        console.log(SUCCESS + "Transaction");
        // Calculate total price and weight
        for (let i = 0; i < orderData.length; i++) {
          const item = orderData[i]
          totalPrice += item.price * item.quantity
          totalWeight += item.weight * item.quantity
        }

        const db = newConnection()

        // Set total price to 2 decimal places before inserting
        totalPrice = parseFloat(totalPrice).toFixed(2)

        // Insert the customer data and transaction number into the Orders table
        db.run('INSERT INTO orders (id, name, email, amount, weight, shipping, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [formData.trans, customerData.name, customerData.email, totalPrice, totalWeight, customerData.weightCost, customerData.address, "In Progress"], (err) => {
          if (err) {
            console.log(ERROR + err)
          } else {
            console.log(SUCCESS + "Inserted Order Details into Local Database");
          }
        })

        // Loop through the customers cart
        console.log(API + "Attempting Inventory Updating, errors will be shown below");
        for (let i = 0; i < orderData.length; i++) {
          let item = orderData[i]
          // Insert the order items into the orderitems table
          db.run('INSERT INTO orderitems (orderid, partnumber, quantity) VALUES (?, ?, ?)', [formData.trans, item.item_id, item.quantity], (err) => {
            if (err) {
              console.log(ERROR + err)
            }
          })
          // Update the inventory table with the new quantity
          db.run('UPDATE inventory SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.item_id], (err) => {
            if (err) {
              console.log(ERROR + err)
            }
          })
        }
        // Close the db connection and send success status to front end
        db.close();
        res.status(200).json(response.data)
      }
    })
    .catch((error) => {
      console.log(ERROR + error)
      res.status(501).send("An error occured with third party credit card authorization!")
    });
});

// Used to send an email confirmation upon checkout
app.post('/api/email-confirmation', (req, res) => { 
  console.log(API + "Email Confirmation In Progress")
  const confirmation = req.body.confirmation
  const customer = req.body.customer
  const date = req.body.date

  // Establish contents of email
  const emailText = `
  <html><body>
  <h2>Rimjobs order invoice</h2>
  <p>Order ID: ${confirmation.trans}</p>
  <p>--------------------------</p>
  <p>Name: ${confirmation.name}</p>
  <p>Amount: $${confirmation.amount}</p>
  <p>Date: ${date}</p>
  <p>Confirmation code: ${confirmation._id}</p>
  <p>Thank you for shopping with Rimjobs.store!</p>
  <p>--------------------------</p>
  <p>If you wish to track the progress please do this:</p>
  <p>1. Navigate to <a href="https://rimjobs.store/findmyorder">rimjobs.store/findmyorder</a></p>
  <p>2. Enter your order id shown at the top of this email.</p>
  </body></html>
  `

  // Establish namecheap email
  const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,
    secure: true,
    auth: {
      user: emailConfig.email,
      pass: emailConfig.password
    }
  })

  // Establish who/and what the email contains
  const emailOptions = {
    from: emailConfig.email,
    to: customer.email,
    subject: 'Rimjobs.store invoice confirmation',
    html: emailText
  }
  
  // Send email
  transporter.sendMail(emailOptions, (err, info) => {
    if(err) {
      console.log(ERROR + err);
    }
    else{
      console.log(SUCCESS + "Email Sent!")
      res.status(200).send('Email confirmation sent')
    }
  })
  
})


// Used for employee/admin login verification
app.post('/api/login', async (req, res) => {
  const username = req.body.username
  const password = req.body.password

  const db = newConnection();

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
    if(err){
      console.log(ERROR + err)
    }
    // Check if that username exists
    if(!row) {
      res.status(500).json({ message: 'Invalid username' })
      console.log(`${ERROR}${username} has failed to login: Invalid username`)
      // if invalid username dont continue
      return
    }
    // Use bcrypt to check if password is the same
    const checkPassword = await bcrypt.compare(password, row.password.toString())

    //If its a match authenticate accordingly
    if(checkPassword) {
      res.status(200).json({ message: 'Correct login info!'} )
      console.log(`${SUCCESS}${username} has logged in.`)
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
      console.log(`${ERROR}${username} has failed to login: Invalid password`)
    }
  })

  db.close();
});

// Creates a new employee/admin in the db
app.post('/api/create-user', async (req, res) => {
  console.log(API + "Create User")
  const username = req.body.username
  const password = req.body.password
  const perms = req.body.perms

  const salt = await bcrypt.genSalt()
  const hashedPassword = await bcrypt.hash(req.body.password, salt)

  const db = newConnection()

  // Check if username exists first
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if(err) {
      console.log(ERROR + err)
      res.status(500).send("Unable to query new database")
    } else {
      // if row is there, existing username
      if(row) {
        res.status(501).send("Username already exists!")
      } else {
        // If it doesnt exist insert it
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', username, hashedPassword, perms, (err) => {
          if(err) {
            console.log(ERROR + err)
            res.status(502).send("Could not insert new user")
          } else {
            console.log(SUCCESS + "Added " + username + " to database")
            res.status(200).send("Inserted new user successfully!")
          }
        })
      }
    }
  })

  db.close();
});

// Sends a list of users to an administrator of the site
app.get('/api/get-users', async (req, res) => {
  console.log(API + "Getting Users")
  const db = newConnection()
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      console.log(ERROR + err)
    }
    else {
      res.json(rows)
    }
    db.close()
  })
})

// Delete a user from the login system
app.post('/api/del-users', async (req, res) => {
  console.log(API + "Deleting User")
  const username = req.body.username
  const db = newConnection();

  // Check if username exists first
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if(err) {
      console.log(ERROR + err)
      res.status(500).send("Unable to query new database")
    } else {
      // if row is there, existing username, delete it!
      if(row) {
        db.run('DELETE FROM users WHERE username = ?', [username], (err, row) => {
          if(err) {
            console.log(ERROR + "Unable to delete User " + username + " : " + err)
            res.status(501).send("Unable to delete user from database")
          } else {
            console.log(SUCCESS + "User " + username + " deleted")
            res.status(200).send(`Deleted ${username} successfully`)
          }
        })
      } else { // User is not in the database, which should be impossible given front end list
        console.log(ERROR + "User " + username + " is not in the database")
        res.status(502).send(`Unable to delete ${username} from database`)
      }
    }
  })
})

// Endpoint for employee portal
app.get('/api/userRole', (req, res) => {
  if (req.session.isAdmin) {
    res.status(200).json({ isAdmin: true });
    // No reason to return bad status if they're just an employee
  }
});

// Logs an employee/admin out
app.get('/api/logout', (req, res) => {
  console.log(API + "Logging out")
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
          console.log(ERROR + err)
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
          console.log(ERROR + err)
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

//findmyorder query to check order id
app.post('/api/find-order', async (req, res) => {
  const orderId = req.body.orderId;

  console.log(API + "Finding Order " + orderId)

  const db = newConnection();

  // get order from table
  db.get('SELECT * FROM orders WHERE id = ?', orderId, (error, order) => {
    if (error) {
      console.error(ERROR + error);
      res.status(500).json({ error: 'Server error' });
    } else if (!order) {
      res.status(404).json({ error: 'Order not found' });
    } else {
      // grab orderitems from table
      db.all('SELECT * FROM orderitems WHERE orderid = ?', orderId, (err, orderItems) => {
        if (err) {
          console.error(ERROR + err);
          res.status(500).json({ error: 'Server error' });
        } else {
          const orderDetails = {
            foundOrder: order,
            orderItems: orderItems 
          };
          res.json(orderDetails);
        }
        db.close();
      });
    }
  });
});

// add a catch-all route that will match any request 
// that hasn't been handled by a previous route 
app.get('*', (req, res) => {
  console.log(SUCCESS + "404: User Tried Requesting -> " + req.url)
  res.sendFile(__dirname + "/views/404.html");
});

// Run http Server
httpServer.listen(httpPort, () => {
  console.log(INFO + 'HTTP: http://rimjobs.store');
});

// Run https server
httpsServer.listen(httpsPort, () => {
  console.log(INFO + 'HTTPS: https://rimjobs.store');
}); 