Pediatric Echocardiogram App

Student Demo Project – Educational/Hospital Use

This is a web-based Pediatric Echocardiogram application developed as a student demo project with assistance from AI. The project is designed for educational purposes and hospital demonstration and allows easy management of pediatric echocardiogram records.

Table of Contents

- [Features]
- [Usage]
- [PDF Reports]
- [Search Patient]
- [Upgradation / Professional Use]
- [License]
- [Acknowledgements]


Features

- Add new patient details including:
  - Name, Patient ID, Date of Birth, Sex, Weight
  - Diagnosis and Segmental Anatomy details
  - Impression notes
  -Auto-calculation of age from date of birth
  - Dynamic “Others” fields for optional or custom input
- View and edit** patient records
- Delete patient records from the table
- Downloadable PDF reports for patients
- Search patients by ID
- Live date display
- Responsive, clean UI with Bootstrap
- Fully functional demo suitable for hospital presentation


Usage

Add New Patient:
Fill out the patient form on index.html
Submit to save patient data to the database
View Records:
Open records.html to view all saved patients
Edit or delete using buttons in the table
Edit Patient:
Click Edit in the records table
Form loads in edit mode, some fields may be locked to prevent changes (Patient ID)
Delete Patient:
Click Delete in the records table
Confirm to remove the patient from the database


PDF Reports

Click Download Report on the patient form or record page
Generates a PDF including:
Patient Details
Segmental Anatomy
Impression
PDF generation uses Puppeteer/Chromium
Works offline once the server is running
⚠️ Note: On first download attempt, PDF may fail on some platforms due to Chromium spawn delays. Retry if necessary.

Search Patient:

Enter Patient ID in the search box
Click Search
Displays all patient details in a readable format

Upgradation Notes:

For professional use, deploy on paid cloud instances with sufficient RAM/CPU
Update Puppeteer/Chromium dependencies to latest versions for stable PDF generation
Secure database connections and implement proper authentication for real hospital use

Acknowledgements:

Developed with JavaScript, Node.js, Express, PostgreSQL, Bootstrap,CSS,HTML
PDF generation with Puppeteer / Chromium
Project assisted by AI
Demo hospital use: Tiny Hearts Fetal & Pediatric Cardiac Clinic