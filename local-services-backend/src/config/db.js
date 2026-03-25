const { Pool } = require('pg');
require('dotenv').config();

// Pool = a set of reusable database connections
// More efficient than opening/closing a connection every time
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the connection when this file is first loaded
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Database connected successfully');
    release();
  }
});

// This is what we export and use everywhere to run SQL queries
// Usage: db.query('SELECT * FROM users', [])
const db = {
  query: (text, params) => pool.query(text, params),
};

module.exports = db;