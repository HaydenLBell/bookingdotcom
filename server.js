// ---------------------------------------------
//  F28WP Coursework Server (Node + Express)
// ---------------------------------------------

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------------------------
//  Serve Static Files (Front-End)
// ---------------------------------------------
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Pages', 'index.html'));
});

// ---------------------------------------------
//  MySQL Connection
// ---------------------------------------------
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',         
  database: 'f28wp',
  port: 3306
});

db.connect(err => {
  if (err) {
    console.error('❌ MySQL Connection Failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL');
});

// ---------------------------------------------
//  LOGIN
// ---------------------------------------------
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM Users WHERE email = ? AND psswrd = ?';

  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error('❌ Login DB Error:', err);
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

// ---------------------------------------------
//  SIGNUP
// ---------------------------------------------
app.post('/api/signup', (req, res) => {
  const { fname, lname, email, password } = req.body;

  if (!fname || !lname || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const checkQuery = 'SELECT * FROM Users WHERE email = ?';

  db.query(checkQuery, [email], (err, results) => {
    if (err) {
      console.error('❌ Signup DB Error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const insertQuery = `
      INSERT INTO Users (fname, lname, email, psswrd, isAdmin) 
      VALUES (?, ?, ?, ?, 0)
    `;

    db.query(insertQuery, [fname, lname, email, password], (err) => {
      if (err) {
        console.error('❌ Signup Insert Error:', err);
        return res.status(500).json({ error: 'Could not create user' });
      }

      res.status(201).json({ message: 'User created successfully' });
    });
  });
});

// ---------------------------------------------
//  HOTEL LISTINGS (MIN PRICE)
//  Used by listings.html
// ---------------------------------------------
app.get("/api/hotels", (req, res) => {
  const sql = `
    SELECT 
      Hotels.hotelID,
      Hotels.hotelName,
      Hotels.address,
      MIN(Rooms.pricePerNight) AS minPrice
    FROM Hotels
    JOIN Rooms ON Hotels.hotelID = Rooms.hotelID
    GROUP BY Hotels.hotelID
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Hotel Fetch Error:', err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});

app.get("/api/hotels/:id", (req, res) => {
    const hotelID = req.params.id;

    const query = `
        SELECT 
            Hotels.hotelID,
            Hotels.hotelName,
            Hotels.address,
            Hotels.numberOfRooms,
            Rooms.roomID,
            Rooms.roomType,
            Rooms.pricePerNight,
            Rooms.available
        FROM Hotels
        LEFT JOIN Rooms ON Hotels.hotelID = Rooms.hotelID
        WHERE Hotels.hotelID = ?
    `;

    db.query(query, [hotelID], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (results.length === 0) return res.status(404).json({ error: "Hotel not found" });

        const hotel = {
            hotelID: results[0].hotelID,
            hotelName: results[0].hotelName,
            address: results[0].address,
            numberOfRooms: results[0].numberOfRooms,
            rooms: []
        };

        results.forEach(r => {
            if (r.roomID) {
                hotel.rooms.push({
                    roomID: r.roomID,
                    roomType: r.roomType,
                    pricePerNight: r.pricePerNight,
                    available: r.available
                });
            }
        });

        res.json(hotel);
    });
});

// Get rooms for a specific hotel
app.get("/api/hotels/:hotelID", (req, res) => {
    const hotelID = req.params.hotelID;

    const query = `
        SELECT Hotels.hotelID, Hotels.hotelName, Hotels.address,
               Rooms.roomID, Rooms.roomType, Rooms.pricePerNight, Rooms.available
        FROM Hotels
        LEFT JOIN Rooms ON Hotels.hotelID = Rooms.hotelID
        WHERE Hotels.hotelID = ?
    `;

    db.query(query, [hotelID], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) return res.status(404).json({ error: "Hotel not found" });

        const hotel = {
            hotelID: results[0].hotelID,
            hotelName: results[0].hotelName,
            address: results[0].address,
            rooms: results.map(r => r.roomID ? {
                roomID: r.roomID,
                roomType: r.roomType,
                pricePerNight: r.pricePerNight,
                available: r.available
            } : null).filter(Boolean)
        };

        res.json(hotel);
    });
});

// Booking endpoint (as before)
app.post("/api/book", (req, res) => {
    const { userID, roomID, checkInDate, numberOfNights } = req.body;
    if (!userID || !roomID || !checkInDate || !numberOfNights) {
        return res.status(400).json({ error: "All fields are required" });
    }

    db.query("SELECT hotelID, available FROM Rooms WHERE roomID = ?", [roomID], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) return res.status(404).json({ error: "Room not found" });
        const room = results[0];
        if (!room.available) return res.status(400).json({ error: "Room not available" });

        const hotelID = room.hotelID;
        const insertBooking = "INSERT INTO Bookings (userID, checkInDate, numberOfNights, hotelID) VALUES (?, ?, ?, ?)";
        db.query(insertBooking, [userID, checkInDate, numberOfNights, hotelID], (err, bookingResult) => {
            if (err) return res.status(500).json({ error: "Failed to create booking" });
            const bookingID = bookingResult.insertId;
            db.query("INSERT INTO BookedRooms (bookingID, roomID) VALUES (?, ?)", [bookingID, roomID], err => {
                if (err) return res.status(500).json({ error: "Failed to link room" });
                db.query("UPDATE Rooms SET available = 0 WHERE roomID = ?", [roomID], err => {
                    if (err) console.error(err);
                });
                res.json({ message: "Booking successful", bookingID });
            });
        });
    });
});



// ---------------------------------------------
//  Start Server
// ---------------------------------------------
app.listen(3000, () => {
  console.log('✅ Server running at http://localhost:3000');
});
