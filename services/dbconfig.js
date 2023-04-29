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
    getOrderDetails
}