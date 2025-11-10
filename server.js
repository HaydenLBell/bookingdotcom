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

// ------------------------------------------------
//  START SERVER
// ------------------------------------------------
app.listen(3000, () => console.log("✅ Server running on 3000"));
