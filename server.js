// ---------------------------------------------
//  F28WP Coursework Server (Node + Express)
//  Admin endpoints added (Option A: userID admin check)
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
  if (err) return console.error('MySQL Error:', err);
  console.log('MySQL Connected');
});

// -----------------------------
// Helper: isAdmin check (Option A)
// -----------------------------
function checkIsAdmin(userID, cb) {
  if (userID === undefined || userID === null) {
    return cb(null, false);
  }
  db.query('SELECT isAdmin FROM Users WHERE userID = ?', [userID], (err, rows) => {
    if (err) return cb(err);
    if (rows.length === 0) return cb(null, false);
    cb(null, rows[0].isAdmin === 1);
  });
}

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
//  GET ALL HOTELS + MIN ROOM PRICE (public)
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
//  GET HOTEL + ALL ROOMS (public)
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
//  GET HOTEL ROOMS ONLY (FOR rooms.html) (public)
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
//  GET SINGLE ROOM (public)
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
//  BOOK ROOM (public)
// ------------------------------------------------
app.post("/api/book", (req, res) => {
  const { userID, roomID, checkInDate, numberOfNights } = req.body;

  if (
    userID === undefined || userID === null ||
    roomID === undefined || roomID === null ||
    !checkInDate ||
    !numberOfNights
  ) {
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

app.put('/api/bookings/:bookingID', (req, res) => {
  const bookingID = req.params.bookingID;
  const { userID, checkInDate, numberOfNights } = req.body;

  if (userID == null || !checkInDate || !numberOfNights) {
    return res.status(400).json({ error: 'Missing fields' });
  }

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

app.delete('/api/bookings/:bookingID', (req, res) => {
  const bookingID = req.params.bookingID;
  const { userID } = req.body;

  if (userID == null) return res.status(400).json({ error: 'Missing userID' });

  db.query('SELECT userID FROM Bookings WHERE bookingID = ?', [bookingID], (err, rows) => {
    if (err) {
      console.error('Booking ownership check error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    if (rows[0].userID !== Number(userID)) return res.status(403).json({ error: 'Not allowed' });

    db.query('SELECT roomID FROM BookedRooms WHERE bookingID = ?', [bookingID], (err, roomRows) => {
      if (err) {
        console.error('Select bookedrooms error:', err);
        return res.status(500).json({ error: 'DB error' });
      }

      const roomIDs = roomRows.map(r => r.roomID);
      if (roomIDs.length > 0) {
        db.query('UPDATE Rooms SET available = 1 WHERE roomID IN (?)', [roomIDs], (err) => {
          if (err) console.error('Failed to free rooms:', err);
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

// ------------------------------------------------
//  USER: password change + delete
// ------------------------------------------------
app.put('/api/user/change-password', (req, res) => {
  const { userID, oldPassword, newPassword } = req.body;
  if (!userID || !oldPassword || !newPassword)
    return res.status(400).json({ success: false, error: 'Missing fields' });

  db.query('SELECT psswrd FROM Users WHERE userID = ?', [userID], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: 'DB error' });
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
    if (rows[0].psswrd !== oldPassword)
      return res.status(400).json({ success: false, error: 'Current password incorrect' });

    db.query('UPDATE Users SET psswrd = ? WHERE userID = ?', [newPassword, userID], (err) => {
      if (err) return res.status(500).json({ success: false, error: 'DB error' });
      res.json({ success: true, message: 'Password changed successfully' });
    });
  });
});

app.delete('/api/user/:id', (req, res) => {
  const userID = req.params.id;

  db.query('SELECT bookingID FROM Bookings WHERE userID = ?', [userID], (err, bookings) => {
    if (err) return res.status(500).json({ success: false, error: 'DB error' });
    const bookingIDs = bookings.map(b => b.bookingID);

    const deleteUser = () => {
      db.query('DELETE FROM Users WHERE userID = ?', [userID], (err) => {
        if (err) return res.status(500).json({ success: false, error: 'DB error' });
        res.json({ success: true, message: 'User deleted successfully' });
      });
    };

    if (bookingIDs.length > 0) {
      db.query('DELETE FROM BookedRooms WHERE bookingID IN (?)', [bookingIDs], (err) => {
        if (err) console.error(err);
        db.query('DELETE FROM Bookings WHERE bookingID IN (?)', [bookingIDs], (err) => {
          if (err) console.error(err);
          deleteUser();
        });
      });
    } else {
      deleteUser();
    }
  });
});


// ------------------------------------------------
//  ADMIN STUFF
// ------------------------------------------------

// Admin: create a hotel
app.post('/api/admin/hotel', (req, res) => {
  const { userID, hotelName, address, numberOfRooms } = req.body;

  if (!hotelName || !address) return res.status(400).json({ error: 'hotelName & address required' });

  checkIsAdmin(userID, (err, ok) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!ok) return res.status(403).json({ error: 'Admin only' });

    const sql = 'INSERT INTO Hotels (hotelName, address, numberOfRooms) VALUES (?, ?, ?)';
    db.query(sql, [hotelName, address, numberOfRooms || 0], (err, result) => {
      if (err) {
        console.error('Insert hotel error:', err);
        return res.status(500).json({ error: 'Insert fail', details: err.message });
      }
      res.json({ message: 'Hotel created', hotelID: result.insertId });
    });
  });
});

// Admin: update hotel
app.put('/api/admin/hotel/:id', (req, res) => {
  const hotelID = req.params.id;
  const { userID, hotelName, address, numberOfRooms } = req.body;

  checkIsAdmin(userID, (err, ok) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!ok) return res.status(403).json({ error: 'Admin only' });

    const sql = 'UPDATE Hotels SET hotelName = ?, address = ?, numberOfRooms = ? WHERE hotelID = ?';
    db.query(sql, [hotelName, address, numberOfRooms, hotelID], (err) => {
      if (err) {
        console.error('Update hotel error:', err);
        return res.status(500).json({ error: 'Update fail', details: err.message });
      }
      res.json({ message: 'Hotel updated' });
    });
  });
});

// Admin: delete hotel (safe) — if force=1 query param then cascade remove bookings/rooms
app.delete('/api/admin/hotel/:id', (req, res) => {
  const hotelID = req.params.id;
  const userID = req.body.userID; // admin user ID
  const force = req.query.force === '1';

  checkIsAdmin(userID, (err, ok) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!ok) return res.status(403).json({ error: 'Admin only' });

    // Check for bookings tied to this hotel
    db.query('SELECT bookingID FROM Bookings WHERE hotelID = ?', [hotelID], (err, bookings) => {
      if (err) return res.status(500).json({ error: 'DB error' });

      const bookingIDs = bookings.map(b => b.bookingID);
      if (bookingIDs.length > 0 && !force) {
        return res.status(400).json({ error: 'Hotel has bookings, use ?force=1 to remove' });
      }

      // If force, we will remove BookedRooms -> Bookings -> Rooms -> Hotels
      const doDelete = () => {
        // get roomIDs for hotel
        db.query('SELECT roomID FROM Rooms WHERE hotelID = ?', [hotelID], (err, roomRows) => {
          if (err) return res.status(500).json({ error: 'DB error' });

          const roomIDs = roomRows.map(r => r.roomID);
          const tasks = [];

          // delete BookedRooms for roomIDs (if any)
          if (roomIDs.length > 0) {
            tasks.push(cb => db.query('DELETE FROM BookedRooms WHERE roomID IN (?)', [roomIDs], cb));
          }

          // delete BookedRooms linked to bookingIDs (if any)
          if (bookingIDs.length > 0) {
            tasks.push(cb => db.query('DELETE FROM BookedRooms WHERE bookingID IN (?)', [bookingIDs], cb));
            tasks.push(cb => db.query('DELETE FROM Bookings WHERE bookingID IN (?)', [bookingIDs], cb));
          }

          // delete rooms for hotel
          tasks.push(cb => db.query('DELETE FROM Rooms WHERE hotelID = ?', [hotelID], cb));

          // finally delete hotel
          tasks.push(cb => db.query('DELETE FROM Hotels WHERE hotelID = ?', [hotelID], cb));

          // run sequentially (simple)
          let i = 0;
          const next = (err) => {
            if (err) {
              console.error('Cascade delete error:', err);
              return res.status(500).json({ error: 'Delete failed', details: err.message });
            }
            if (i >= tasks.length) return res.json({ message: 'Hotel and related data deleted' });
            const fn = tasks[i++];
            fn(next);
          };
          next();
        });
      };

      // If no bookings or force, do delete
      doDelete();
    });
  });
});

// Admin: add multiple rooms of same type (quantity)
app.post('/api/admin/hotel/:id/rooms', (req, res) => {
  const hotelID = req.params.id;
  const { userID, roomType, pricePerNight, quantity, available } = req.body;

  if (!roomType || pricePerNight === undefined || !quantity) return res.status(400).json({ error: 'roomType, pricePerNight, quantity required' });

  checkIsAdmin(userID, (err, ok) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!ok) return res.status(403).json({ error: 'Admin only' });

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) return res.status(400).json({ error: 'quantity must be a positive integer' });

    // Build multi-insert
    const placeholders = new Array(qty).fill('(?, ?, ?, ?)').join(',');
    const values = [];
    for (let i = 0; i < qty; i++) {
      values.push(roomType, hotelID, pricePerNight, available ? 1 : 0);
    }

    const sql = `INSERT INTO Rooms (roomType, hotelID, pricePerNight, available) VALUES ${placeholders}`;
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Batch insert rooms error:', err);
        return res.status(500).json({ error: 'Insert fail', details: err.message });
      }
      res.json({ message: 'Rooms added', inserted: result.affectedRows });
    });
  });
});

// Admin: delete a room (safe) — requires ?force=1 to remove BookedRooms links
app.delete('/api/admin/room/:id', (req, res) => {
  const roomID = req.params.id;
  const userID = req.body.userID;
  const force = req.query.force === '1';

  checkIsAdmin(userID, (err, ok) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!ok) return res.status(403).json({ error: 'Admin only' });

    db.query('SELECT bookingID FROM BookedRooms WHERE roomID = ?', [roomID], (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      const linked = rows.map(r => r.bookingID);
      if (linked.length > 0 && !force) {
        return res.status(400).json({ error: 'Room has bookings, use ?force=1 to remove' });
      }

      const doDelete = () => {
        if (linked.length > 0) {
          db.query('DELETE FROM BookedRooms WHERE roomID = ?', [roomID], (err) => {
            if (err) console.error('Delete BookedRooms error:', err);
            db.query('DELETE FROM Rooms WHERE roomID = ?', [roomID], (err) => {
              if (err) return res.status(500).json({ error: 'Delete fail', details: err.message });
              res.json({ message: 'Room deleted (and freed from bookings)' });
            });
          });
        } else {
          db.query('DELETE FROM Rooms WHERE roomID = ?', [roomID], (err) => {
            if (err) return res.status(500).json({ error: 'Delete fail', details: err.message });
            res.json({ message: 'Room deleted' });
          });
        }
      };
      doDelete();
    });
  });
});

// Admin: list rooms (optionally filter by hotelID)
app.get('/api/admin/rooms', (req, res) => {
  const userID = req.query.userID;
  const hotelID = req.query.hotelID;

  checkIsAdmin(userID, (err, ok) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!ok) return res.status(403).json({ error: 'Admin only' });

    let sql = `
      SELECT R.roomID, R.roomType, R.pricePerNight, R.available, R.hotelID, H.hotelName
      FROM Rooms R
      JOIN Hotels H ON R.hotelID = H.hotelID
    `;
    const params = [];
    if (hotelID) {
      sql += ' WHERE R.hotelID = ?';
      params.push(hotelID);
    }

    db.query(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error', details: err.message });
      res.json(rows);
    });
  });
});

// Admin: list hotels (admin version)
app.get('/api/admin/hotels', (req, res) => {
  const userID = req.query.userID;
  checkIsAdmin(userID, (err, ok) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!ok) return res.status(403).json({ error: 'Admin only' });

    const sql = `SELECT hotelID, hotelName, address, numberOfRooms FROM Hotels ORDER BY hotelID`;
    db.query(sql, (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error', details: err.message });
      res.json(rows);
    });
  });
});

// Admin: basic site stats
app.get('/api/admin/stats', (req, res) => {
  const userID = req.query.userID;
  checkIsAdmin(userID, (err, ok) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!ok) return res.status(403).json({ error: 'Admin only' });

    const sql = `
      SELECT
        (SELECT COUNT(*) FROM Hotels) AS hotels,
        (SELECT COUNT(*) FROM Rooms) AS rooms,
        (SELECT COUNT(*) FROM Bookings) AS bookings,
        (SELECT COUNT(*) FROM Users) AS users
    `;
    db.query(sql, (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error', details: err.message });
      res.json(rows[0]);
    });
  });
});

app.post("/api/admin/hotels", async (req, res) => {
    const { name, address } = req.body;

    if (!name || !address) {
        return res.json({ success: false, error: "Missing fields" });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO hotels (hotelName, address) VALUES (?, ?)",
            [name, address]
        );

        res.json({
            success: true,
            hotelID: result.insertId,
            message: "Hotel added successfully"
        });

    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Database error" });
    }
});

app.post("/api/admin/rooms", async (req, res) => {
    const { hotelID, roomType, quantity } = req.body;

    if (!hotelID || !roomType || !quantity) {
        return res.json({ success: false, error: "Missing fields" });
    }

    try {
        const roomInserts = [];

        for (let i = 0; i < quantity; i++) {
            roomInserts.push([hotelID, roomType, 1]); // 1 = available
        }

        await db.query(
            "INSERT INTO rooms (hotelID, roomType, available) VALUES ?",
            [roomInserts]
        );

        res.json({
            success: true,
            message: `Added ${quantity} ${roomType} rooms to hotel ${hotelID}`
        });

    } catch (err) {
        console.error(err);
        res.json({ success: false, error: "Database error" });
    }
});


// ------------------------------------------------
//  START SERVER
// ------------------------------------------------
app.listen(3000, () => console.log("Server running on port 3000"));
