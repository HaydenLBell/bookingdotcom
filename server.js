const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// ✅ Serve static files first
app.use(express.static('public'));

// ✅ Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Pages', 'index.html'));
});

// ✅ Connect to MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'f28wp',
  port: 3306
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL!');
});

// ✅ Example route
app.get('/api/listings', (req, res) => {
  db.query('SELECT * FROM listings', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM Users WHERE email = ? AND psswrd = ?';

  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.userID,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  });
});

app.post('/api/signup', (req, res) => {
  const { fname, lname, email, password } = req.body;

  if (!fname || !lname || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // check if email already exists
  const checkQuery = 'SELECT * FROM Users WHERE email = ?';
  db.query(checkQuery, [email], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // insert new user
    const insertQuery = 'INSERT INTO Users (fname, lname, email, psswrd, isAdmin) VALUES (?, ?, ?, ?, 0)';
    db.query(insertQuery, [fname, lname, email, password], (err, result) => {
      if (err) {
        console.error('Database insert error:', err);
        return res.status(500).json({ error: 'Could not create user' });
      }

      res.status(201).json({ message: 'User created successfully' });
    });
  });
});

//const PORT = process.env.PORT || 3000;
//app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// ✅ Start the server last
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
