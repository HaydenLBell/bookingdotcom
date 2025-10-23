const mysql = require('mysql2');

// MySQL connection details
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',  // Assuming no password for MySQL (default for XAMPP)
  database: 'f28wp'
});

// List of hotel names
const hotelNames = [
  'The Grand Royale', 'Ocean Breeze Resort', 'Sunset Lodge', 'Mountainview Inn',
  'Riverfront Hotel', 'City Central Suites', 'Beachside Villas', 'Parkview Retreat',
  'Green Valley Inn', 'The Elegant Stay', 'Skyline Luxury Hotel', 'The White Orchid',
  'Seaview Resort', 'Luxury Palms Hotel', 'Sunshine Guest House', 'Classic Comfort Inn',
  'The Lighthouse Resort', 'Royal Heritage Hotel', 'The Urban Haven', 'Golden Sands Resort'
];

// Function to generate a random number of rooms (between 10 and 500)
const getRandomRooms = () => Math.floor(Math.random() * 491) + 10;

// Function to generate a random address (just a simple placeholder for now)
const getRandomAddress = () => `Street ${Math.floor(Math.random() * 1000) + 1}, City, Country`;

// Function to insert the hotels into the database
const insertHotels = async () => {
  for (let i = 0; i < hotelNames.length; i++) {
    const hotelName = hotelNames[i];
    const address = getRandomAddress();
    const numberOfRooms = getRandomRooms();

    const query = `INSERT INTO Hotels (hotelName, address, numberOfRooms) VALUES (?, ?, ?)`;
    const values = [hotelName, address, numberOfRooms];
    
    connection.execute(query, values, (err, results) => {
      if (err) {
        console.error('Error inserting hotel:', err);
      } else {
        console.log(`Hotel inserted: ${hotelName}`);
      }
    });
  }
};

// Run the function to insert hotels
insertHotels();

// Close the connection after the operation
connection.end();
