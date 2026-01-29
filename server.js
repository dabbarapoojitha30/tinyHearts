require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { body, validationResult } = require("express-validator");
const pool = require("./db");
const puppeteer = require("puppeteer");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
const LOCATION_CODES = {
  "Arthi Hospital, Kumbakonam": "KUM",
  "Senthil Nursing Home, Puthukottai": "PUTS",
  "Hridya Cardiac Care, Puthukottai": "PUTH",
  "Thulir Hospital, Tiruvarur": "TIR",
  "Perambalur Cardiac Centre, Perambalur": "PER",
  "Star Kids Hospital, Dindugul": "DIN",
  "Pugazhini Hospital, Trichy": "TRI"
};

// ---------------- UTILITY ----------------
function calculateAge(dob) {
  const birth = new Date(dob);
  const today = new Date();
  if (isNaN(birth)) return "";
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();
  if (days < 0) {
    months--;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return `${years}y ${months}m ${days}d`;
}

// Format date to DD/MM/YYYY
function formatDateForPDF(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ---------------- DB SETUP ----------------
(async () => {
  try {
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
  } catch (err) {
    console.error("❌ DB setup error:", err.message);
  }
})();

// ---------------- VALIDATION ----------------
const patientValidationRules = [
  body("patient_id").trim().notEmpty(),
  body("name").trim().notEmpty(),
  body("dob").optional({ checkFalsy: true }).isISO8601(),
  body("review_date").optional({ checkFalsy: true }).isISO8601(),
  body("weight").optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body("phone1").optional({ checkFalsy: true }).matches(/^\d{10}$/),
  body("phone2").optional({ checkFalsy: true }).matches(/^\d{10}$/)
];

// ---------------- CRUD ----------------

// CREATE
app.post("/patients", patientValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const p = req.body;
    p.age = p.dob ? calculateAge(p.dob) : "";

    const fields = [
      "patient_id","name","dob","age","review_date","sex","weight","phone1","phone2","location",
      "diagnosis","situs_loop","systemic_veins","pulmonary_veins","atria",
      "atrial_septum","av_valves","ventricles","ventricular_septum",
      "outflow_tracts","pulmonary_arteries","aortic_arch",
      "others_field","impression"
    ];

    const values = fields.map(f => p[f] || null);

    await pool.query(
      `INSERT INTO patients (${fields.join(",")})
       VALUES (${fields.map((_, i) => "$" + (i + 1)).join(",")})`,
      values
    );

    res.json({ status: "success" });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Patient ID already exists" });
    res.status(500).json({ error: err.message });
  }
});

// READ ALL
app.get("/patients", async (req, res) => {
  try {
    const r = await pool.query("SELECT patient_id, name, age, location FROM patients ORDER BY created_at DESC");
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// READ ONE
app.get("/patients/:id", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM patients WHERE patient_id=$1", [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ error: "Patient not found" });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// UPDATE
app.patch("/patients/:id", patientValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const p = req.body;
    if (p.dob) p.age = calculateAge(p.dob);

    const keys = Object.keys(p);
    if (!keys.length) return res.status(400).json({ error: "No fields to update" });

    const setClause = keys.map((k, i) => `${k}=$${i+1}`).join(", ");
    const values = keys.map(k => p[k]);

    const r = await pool.query(
      `UPDATE patients SET ${setClause} WHERE patient_id=$${keys.length+1}`,
      [...values, req.params.id]
    );

    if (!r.rowCount) return res.status(404).json({ error: "Patient not found" });
    res.json({ status: "success" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE
app.delete("/patients/:id", async(req,res)=>{
  try{
    const r = await pool.query("DELETE FROM patients WHERE patient_id=$1", [req.params.id]);
    if(!r.rowCount) return res.status(404).json({error:"Patient not found"});
    res.json({status:"Deleted successfully"});
  } catch(err){ res.status(500).json({error:err.message}); }
});

// ---------------- GENERATE PATIENT ID ----------------
app.get("/generate-patient-id", async (req, res) => {
  const loc = req.query.location;
  if (!loc) return res.status(400).json({ error: "Location required" });

  const code = LOCATION_CODES[loc];
  if (!code) return res.status(400).json({ error: "Invalid location" });

  try {
    // Get last patient ID for this location
    const r = await pool.query(
      "SELECT patient_id FROM patients WHERE patient_id LIKE $1 ORDER BY created_at DESC LIMIT 1",
      [`${code}-%`]
    );

    let nextNumber = 1;
    if (r.rows.length > 0) {
      const lastNumber = parseInt(r.rows[0].patient_id.split("-")[1]);
      if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
    }

    res.json({ patient_id: `${code}-${nextNumber}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- PDF GENERATION ----------------
async function generatePDFFromHTML(fileName, data){
  const htmlPath = path.join(__dirname,"public",fileName);
  if(!fs.existsSync(htmlPath)) throw new Error("HTML template not found");

  // Format dates
  if(data.dob) data.dob = formatDateForPDF(data.dob);
  if(data.review_date) data.review_date = formatDateForPDF(data.review_date);
  data.report_date = data.report_date ? formatDateForPDF(data.report_date) : formatDateForPDF(new Date());

  let html = fs.readFileSync(htmlPath,"utf8");

  for(const key in data){
    const re = new RegExp(`{{${key}}}`,"g");
    html = html.replace(re,data[key]||"");
  }

  const cssPath = path.join(__dirname,"public/style.css");
  if(fs.existsSync(cssPath)){
    const css = fs.readFileSync(cssPath,"utf8");
    html = html.replace("</head>",`<style>${css}</style></head>`);
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html,{waitUntil:"networkidle0"});
  const pdf = await page.pdf({
    format:"A4",
    printBackground:true,
    margin:{top:"10px",bottom:"10px",left:"10px",right:"10px"}
  });
  await browser.close();
  return pdf;
}

app.post("/generate-pdf", async(req,res)=>{
  try{
    const data = req.body;
    if(!data.name) return res.status(400).json({error:"Patient name required"});

    const pdf = await generatePDFFromHTML("report.html", data);
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="TinyHeartsReport-${data.name.replace(/[^a-z0-9]/gi,"_")}.pdf"`);
    res.send(pdf);
  } catch(err){
    res.status(500).json({error:"PDF generation failed: "+err.message});
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
