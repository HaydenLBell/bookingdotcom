// rooms_seed.js
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "f28wp",
  port: 3306
});

const roomTypes = [
  { type: "Single", min: 40, max: 80 },
  { type: "Double", min: 60, max: 120 },
  { type: "Suite", min: 120, max: 300 },
  { type: "Deluxe", min: 150, max: 350 }
];

// Generate random integer
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Insert rooms
function insertRooms() {
  // Hotels 1–20 exist
  const hotelIDs = Array.from({ length: 20 }, (_, i) => i + 1);

  let queries = [];

  hotelIDs.forEach(hotelID => {
    const numRooms = rand(20, 60); // Generates 20–60 rooms

    for (let i = 0; i < numRooms; i++) {
      const rt = roomTypes[rand(0, roomTypes.length - 1)];
      const price = rand(rt.min, rt.max);
      const available = rand(0, 1);

      const query = `INSERT INTO Rooms (roomType, hotelID, pricePerNight, available) VALUES (?, ?, ?, ?)`;
      const values = [rt.type, hotelID, price, available];
      queries.push({ query, values });
    }
  });

  console.log(`Generating ${queries.length} rooms...`);

  // Execute all inserts
  queries.forEach((q, i) => {
    db.query(q.query, q.values, (err) => {
      if (err) console.error(err);
      if (i === queries.length - 1) {
        console.log("✅ Rooms inserted successfully!");
        db.end();
      }
    });
  });
}

insertRooms();
