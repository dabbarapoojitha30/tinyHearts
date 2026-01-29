// createTable.js
const pool = require("./db"); // just import pool from db.js

(async () => {
  try {
    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        patient_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        dob DATE,
        age TEXT,
        review_date DATE,
        sex VARCHAR(10),
        weight NUMERIC(5,2),
        phone1 VARCHAR(10),
        phone2 VARCHAR(10),
        location TEXT,
        diagnosis TEXT,
        situs_loop TEXT,
        systemic_veins TEXT,
        pulmonary_veins TEXT,
        atria TEXT,
        atrial_septum TEXT,
        av_valves TEXT,
        ventricles TEXT,
        ventricular_septum TEXT,
        outflow_tracts TEXT,
        pulmonary_arteries TEXT,
        aortic_arch TEXT,
        others_field TEXT,
        impression TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("✅ Table 'patients' ready");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating table:", err.message);
    process.exit(1);
  }
})();
