const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Connect to MySQL
const db = mysql.createConnection({
  host: '10.15.188.19',
  user: 'root',       // default XAMPP username
  password: '',       // leave empty unless you set one in phpMyAdmin
  database: 'f28wp' // your database name
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL!');
});

//log in query

db.connect(function(err) {
    if (err) throw err;
    let sql = "SELECT * FROM users WHERE username = " + username + " AND password = " + password;
});