require("dotenv").config();
const { Pool } = require("pg");

// Create a new Postgres connection pool using .env config
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

(async () => {
    try {
        // Drop table if you want a clean start (optional)
        // await pool.query("DROP TABLE IF EXISTS patients;");

        // Create the table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS patients (
                patient_id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                dob DATE,
                age TEXT,
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

        console.log("✅ Table 'patients' is ready with phone1 and phone2!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error creating table:", err.message);
        process.exit(1);
    }
})();
