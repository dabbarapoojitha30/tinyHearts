require("dotenv").config();
const { Pool } = require("pg");

// Use DATABASE_URL from Render for production
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.query('SELECT current_database();')
  .then(res => console.log("✅ Connected to database:", res.rows[0].current_database))
  .catch(err => console.error("❌ DB connection error:", err));

module.exports = pool;
