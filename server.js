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
app.use(express.static('public'));

// ---------------------------------------------
//  MAIN PAGE
// ---------------------------------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Pages', 'index.html'));
});

// ---------------------------------------------
//  MYSQL CONNECTION
// ---------------------------------------------
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'f28wp',
    port: 3306
});

db.connect(err => {
    if (err) return console.error('❌ MySQL Error:', err);
    console.log('✅ MySQL Connected');
});

// ------------------------------------------------
//  LOGIN
// ------------------------------------------------
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM Users WHERE email = ? AND psswrd = ?";
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: "DB error", details: err.message });
        if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });

        const user = results[0];
        res.json({
            message: "Success",
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

// ------------------------------------------------
//  SIGNUP
// ------------------------------------------------
app.post('/api/signup', (req, res) => {
    const { fname, lname, email, password } = req.body;

    if (!fname || !lname || !email || !password)
        return res.status(400).json({ error: "All fields required" });

    db.query("SELECT * FROM Users WHERE email = ?", [email], (err, results) => {
        if (err) return res.status(500).json({ error: "DB error", details: err.message });
        if (results.length > 0) return res.status(409).json({ error: "Email exists" });

        const insert = `
            INSERT INTO Users (fname, lname, email, psswrd, isAdmin)
            VALUES (?, ?, ?, ?, 0)
        `;
        db.query(insert, [fname, lname, email, password], err => {
            if (err) return res.status(500).json({ error: "Insert fail", details: err.message });
            res.json({ message: "User created" });
        });
    });
});

// ------------------------------------------------
//  GET ALL HOTELS + MIN ROOM PRICE
// ------------------------------------------------
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
        if (err) return res.status(500).json({ error: "DB error", details: err.message });
        res.json(results);
    });
});

// ------------------------------------------------
//  GET HOTEL + ALL ROOMS
// ------------------------------------------------
app.get("/api/hotels/:id", (req, res) => {
    const hotelID = req.params.id;

    const sql = `
        SELECT 
            Hotels.hotelID,
            Hotels.hotelName,
            Hotels.address,
            Rooms.roomID,
            Rooms.roomType,
            Rooms.pricePerNight,
            Rooms.available
        FROM Hotels
        LEFT JOIN Rooms ON Hotels.hotelID = Rooms.hotelID
        WHERE Hotels.hotelID = ?
    `;
    db.query(sql, [hotelID], (err, rows) => {
        if (err) return res.status(500).json({ error: "DB error", details: err.message });
        if (rows.length === 0) return res.status(404).json({ error: "Not found" });

        const hotel = {
            hotelID: rows[0].hotelID,
            hotelName: rows[0].hotelName,
            address: rows[0].address,
            rooms: rows
                .filter(r => r.roomID !== null)
                .map(r => ({
                    roomID: r.roomID,
                    roomType: r.roomType,
                    pricePerNight: r.pricePerNight,
                    available: r.available
                }))
        };
        res.json(hotel);
    });
});

// ------------------------------------------------
//  GET HOTEL ROOMS ONLY (FOR rooms.html)
// ------------------------------------------------
app.get("/api/hotel/:id/rooms", (req, res) => {
    const hotelID = req.params.id;

    const sql = `
        SELECT 
            Hotels.hotelName,
            Hotels.address,
            Rooms.roomID,
            Rooms.roomType,
            Rooms.pricePerNight,
            Rooms.available
        FROM Rooms
        JOIN Hotels ON Hotels.hotelID = Rooms.hotelID
        WHERE Rooms.hotelID = ?
    `;
    db.query(sql, [hotelID], (err, rows) => {
        if (err) return res.status(500).json({ error: "DB error", details: err.message });
        if (rows.length === 0) return res.status(404).json({ error: "No rooms found" });

        res.json({
            hotelName: rows[0].hotelName,
            address: rows[0].address,
            rooms: rows
        });
    });
});

// ------------------------------------------------
//  GET SINGLE ROOM
// ------------------------------------------------
app.get("/api/room/:id", (req, res) => {
    const roomID = req.params.id;

    const sql = `
        SELECT Rooms.roomID, Rooms.roomType, Rooms.pricePerNight, Rooms.available,
               Hotels.hotelID, Hotels.hotelName, Hotels.address
        FROM Rooms
        JOIN Hotels ON Rooms.hotelID = Hotels.hotelID
        WHERE Rooms.roomID = ?
    `;
    db.query(sql, [roomID], (err, rows) => {
        if (err) return res.status(500).json({ error: "DB error", details: err.message });
        if (rows.length === 0) return res.status(404).json({ error: "Room not found" });
        res.json(rows[0]);
    });
});

// ------------------------------------------------
//  BOOK ROOM
// ------------------------------------------------
app.post("/api/book", (req, res) => {
    const { userID, roomID, checkInDate, numberOfNights } = req.body;

    if (
      userID === undefined || userID === null ||
      roomID === undefined || roomID === null ||
      !checkInDate ||
      !numberOfNights
    ){
        return res.status(400).json({ error: "All fields required" });
   }   


    // Step 1: Check room exists and is available
    db.query("SELECT hotelID, available FROM Rooms WHERE roomID = ?", [roomID], (err, rooms) => {
        if (err) {
            console.error("Room select error:", err);
            return res.status(500).json({ error: "DB error", details: err.message });
        }

        if (rooms.length === 0) return res.status(404).json({ error: "Room not found" });

        const room = rooms[0];
        if (!room.available) return res.status(400).json({ error: "Room unavailable" });

        const hotelID = room.hotelID;

        // Step 2: Check user exists
        db.query("SELECT * FROM Users WHERE userID = ?", [userID], (err, users) => {
            if (err) {
                console.error("User select error:", err);
                return res.status(500).json({ error: "DB error", details: err.message });
            }
            if (users.length === 0) return res.status(404).json({ error: "User not found" });

            // Step 3: Insert booking
            const insertBooking = `
                INSERT INTO Bookings (userID, checkInDate, numberOfNights, hotelID)
                VALUES (?, ?, ?, ?)
            `;
            db.query(insertBooking, [userID, checkInDate, numberOfNights, hotelID], (err, result) => {
                if (err) {
                    console.error("Booking insert error:", err);
                    return res.status(500).json({ error: "Booking fail", details: err.message });
                }

                const bookingID = result.insertId;

                // Step 4: Link room to booking
                db.query("INSERT INTO BookedRooms (bookingID, roomID) VALUES (?, ?)", [bookingID, roomID], (err) => {
                    if (err) {
                        console.error("BookedRooms insert error:", err);
                        return res.status(500).json({ error: "Link fail", details: err.message });
                    }

                    // Step 5: Mark room unavailable
                    db.query("UPDATE Rooms SET available = 0 WHERE roomID = ?", [roomID], (err) => {
                        if (err) console.error("Room update error:", err);

                        // Success
                        res.json({ message: "Booking success", bookingID });
                    });
                });
            });
        });
    });
});

// -----------------------------
// User bookings: list / edit / cancel
// -----------------------------

// Get bookings for a user (joins Bookings -> BookedRooms -> Rooms -> Hotels)
app.get('/api/user/:id/bookings', (req, res) => {
  const userID = req.params.id;

  const sql = `
    SELECT
      B.bookingID,
      B.userID,
      B.checkInDate,
      B.numberOfNights,
      H.hotelID,
      H.hotelName,
      H.address,
      R.roomID,
      R.roomType,
      R.pricePerNight
    FROM Bookings B
    JOIN BookedRooms BR ON B.bookingID = BR.bookingID
    JOIN Rooms R ON BR.roomID = R.roomID
    JOIN Hotels H ON B.hotelID = H.hotelID
    WHERE B.userID = ?
    ORDER BY B.checkInDate DESC
  `;

  db.query(sql, [userID], (err, rows) => {
    if (err) {
      console.error('Fetch bookings error:', err);
      return res.status(500).json({ error: 'DB error', details: err.message });
    }
    res.json(rows);
  });
});

// Edit booking (only checkInDate and numberOfNights)
app.put('/api/bookings/:bookingID', (req, res) => {
  const bookingID = req.params.bookingID;
  const { userID, checkInDate, numberOfNights } = req.body;

  if (userID == null || !checkInDate || !numberOfNights) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Verify ownership
  db.query('SELECT userID FROM Bookings WHERE bookingID = ?', [bookingID], (err, rows) => {
    if (err) {
      console.error('Booking ownership check error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    if (rows[0].userID !== Number(userID)) return res.status(403).json({ error: 'Not allowed' });

    const sql = 'UPDATE Bookings SET checkInDate = ?, numberOfNights = ? WHERE bookingID = ?';
    db.query(sql, [checkInDate, numberOfNights, bookingID], (err) => {
      if (err) {
        console.error('Update booking error:', err);
        return res.status(500).json({ error: 'DB error' });
      }
      res.json({ message: 'Booking updated' });
    });
  });
});

// Cancel booking: free room(s), delete BookedRooms and Bookings
app.delete('/api/bookings/:bookingID', (req, res) => {
  const bookingID = req.params.bookingID;
  const { userID } = req.body;

  if (userID == null) return res.status(400).json({ error: 'Missing userID' });

  // Verify ownership
  db.query('SELECT userID FROM Bookings WHERE bookingID = ?', [bookingID], (err, rows) => {
    if (err) {
      console.error('Booking ownership check error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    if (rows[0].userID !== Number(userID)) return res.status(403).json({ error: 'Not allowed' });

    // Get roomIDs for this booking
    db.query('SELECT roomID FROM BookedRooms WHERE bookingID = ?', [bookingID], (err, roomRows) => {
      if (err) {
        console.error('Select bookedrooms error:', err);
        return res.status(500).json({ error: 'DB error' });
      }

      const roomIDs = roomRows.map(r => r.roomID);
      // Mark each room available = 1
      if (roomIDs.length > 0) {
        db.query('UPDATE Rooms SET available = 1 WHERE roomID IN (?)', [roomIDs], (err) => {
          if (err) console.error('Failed to free rooms:', err);
          // continue even if free fails
          // Delete bookedrooms then booking
          db.query('DELETE FROM BookedRooms WHERE bookingID = ?', [bookingID], (err) => {
            if (err) {
              console.error('Delete BookedRooms error:', err);
              return res.status(500).json({ error: 'DB error' });
            }
            db.query('DELETE FROM Bookings WHERE bookingID = ?', [bookingID], (err) => {
              if (err) {
                console.error('Delete Booking error:', err);
                return res.status(500).json({ error: 'DB error' });
              }
              return res.json({ message: 'Booking cancelled' });
            });
          });
        });
      } else {
        // No rooms linked (weird) — just delete booking
        db.query('DELETE FROM Bookings WHERE bookingID = ?', [bookingID], (err) => {
          if (err) {
            console.error('Delete Booking error:', err);
            return res.status(500).json({ error: 'DB error' });
          }
          return res.json({ message: 'Booking cancelled' });
        });
      }
    });
  });
});

app.put('/api/user/change-password', (req, res) => {
  const { userID, oldPassword, newPassword } = req.body;
  if (!userID || !oldPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });

  // verify current password
  db.query('SELECT psswrd FROM Users WHERE userID = ?', [userID], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    if (rows[0].psswrd !== oldPassword) return res.status(400).json({ error: 'Current password incorrect' });

    db.query('UPDATE Users SET psswrd = ? WHERE userID = ?', [newPassword, userID], (err) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ message: 'Password changed' });
    });
  });
});

app.delete('/api/user/:id', (req, res) => {
  const userID = req.params.id;
  // optionally verify body.userID matches or require password confirmation
  // Remove user's bookings first (safe delete)
  db.query('SELECT bookingID FROM Bookings WHERE userID = ?', [userID], (err, bookings) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    const bookingIDs = bookings.map(b => b.bookingID);
    if (bookingIDs.length > 0) {
      // delete BookedRooms for bookings
      db.query('DELETE FROM BookedRooms WHERE bookingID IN (?)', [bookingIDs], (err) => {
        if (err) console.error(err);
        // delete bookings
        db.query('DELETE FROM Bookings WHERE bookingID IN (?)', [bookingIDs], (err) => {
          if (err) console.error(err);
          // continue to delete user
          db.query('DELETE FROM Users WHERE userID = ?', [userID], (err) => {
            if (err) return res.status(500).json({ error: 'DB error' });
            res.json({ message: 'User deleted' });
          });
        });
      });
    } else {
      // no bookings, just delete user
      db.query('DELETE FROM Users WHERE userID = ?', [userID], (err) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.json({ message: 'User deleted' });
      });
    }
  });
});


// ------------------------------------------------
//  START SERVER
// ------------------------------------------------
app.listen(3000, () => console.log("✅ Server running on 3000"));
