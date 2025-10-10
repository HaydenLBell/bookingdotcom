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

// Example route
app.get('/api/listings', (req, res) => {
  db.query('SELECT * FROM listings', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
