//modules
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

//port to listen on 
var port = process.env.PORT || 3300;

//Handle HTTP POST requests
app.use(bodyParser.urlencoded({ extended: true }));

// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', './views');

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

//GET request to homepage
app.get('/', (req, res) => {
    res.render('index');
});

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

//start express server
app.listen(port, () => {
    console.log(`Express server listening at http://localhost:${port}`);
});   