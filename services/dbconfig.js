const express = require('express')
const mysql = require("mysql2/promise")
const sqlite3 = require('sqlite3').verbose()
const LocalStorage = require('node-localstorage').LocalStorage;
require('console-stamp')(console, { 
  format: ':date(HH:MM:ss)' 
} );

// These are terminal color escape codes
const DEFAULT = "\033[39m"
const GREEN = "\033[92m"
const RED = "\033[91m"
const ORANGE = "\033[33m"
const MAGENTA = "\033[35m"

// Smashed into nice variables for use in console.log
const SUCCESS = GREEN + "SUCCESS: " + DEFAULT
/*
 * Connections
 *
 * * * * * * * * */

// Establishes connection/pool to legacy DB
const legacyConnection = mysql.createPool({
    host: 'blitz.cs.niu.edu',
    port: '3306',
    database: 'csci467',
    user: 'student',
    password: 'student'
})

// Establishes connection to new DB
// './rimjobs.db' will be the name of our newDB
function newConnection() {
    const newConnection = new sqlite3.Database('./rimjobs.db' , sqlite3.OPEN_READWRITE, (err) => {
        if(err)
        {
            return console.error(err.message)
        }
        else
        {
            console.log(SUCCESS + 'Local Database connected')
        }
    })
    return newConnection
}

// Inserts orders, brackets, orderitems into the db
async function initializeNewDB() {

    const db = newConnection()
        
    const createBrackets = `CREATE TABLE IF NOT EXISTS brackets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weight DECIMAL(9,2) DEFAULT '0.00',
        cost DECIMAL(9,2) DEFAULT '0.00'
    )`;
    
    db.run(createBrackets, (err) => {
        if (err) {
            console.error(err.message)
        } else {
            console.log('brackets table created successfully')
        }
    });
    
    const createOrders = `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        amount DECIMAL(9,2) DEFAULT '0.00',
        weight DECIMAL(9,2) DEFAULT '0.00',
        shipping DECIMAL(9,2) DEFAULT '0.00',
        address VARCHAR(255) NOT NULL,
        status VARCHAR(255) DEFAULT 'open' NOT NULL
    )`

      
    db.run(createOrders, (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('orders table created successfully')
        }
    });
    
    const createTableQuery = `CREATE TABLE IF NOT EXISTS orderitems (
        orderid INTEGER NOT NULL,
        partnumber INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        PRIMARY KEY (orderid, partnumber),
        FOREIGN KEY (orderid) REFERENCES orders(id) ON DELETE CASCADE
    )`
      
    db.run(createTableQuery, (err) => {
        if (err) {
            console.error(err.message)
        } else {
            console.log('orderitems table created successfully')
        }
    });

    // all tables for orders are implmeneted
    db.close()
}

// Drops the following tables from the db 
// orderitems, orders, brackets(weight)
async function cleanOrders() {

    const db = newConnection()

    const droptables = 'DROP TABLE IF EXISTS orderitems; DROP TABLE IF EXISTS orders; DROP TABLE IF EXISTS brackets;';
    db.run(droptables, (err) => {
        if (err) {
            console.error(err.message)
        } else {
            console.log('initializeNewDB() dropped tables')
        }
    })

    db.close()
}

// This function is used when combining legacy part information with orderItem to send back to the employees panel
const getOrderDetails = async (orderItems) => {
    const updatedOrderItems = [];
    const connect = await legacyConnection.getConnection();
    for (const orderItem of orderItems) {
      const [rows] = await connect.query('SELECT * FROM parts WHERE number = ?', [orderItem.partnumber])
      if (rows.length === 0) {
        console.error(`Could not find part with ID: ${orderItem.partnumber}`);
        updatedOrderItems.push(orderItem); // Keep the original order item if the part is not found
      } else {
        const part = rows[0];
        const orderItemDetails = {
          number: part.number,
          quantity: orderItem.quantity,
          description: part.description,
          price: part.price,
          weight: part.weight,
          pictureURL: part.pictureURL
        };
        const updatedOrderItem = Object.assign({}, orderItem, orderItemDetails);
        updatedOrderItems.push(updatedOrderItem);
      }
    }
    return updatedOrderItems;
    connect.release()
  };
  
 
module.exports = {
    legacyConnection,
    newConnection,
    initializeNewDB,
    cleanOrders,
    getOrderDetails
}