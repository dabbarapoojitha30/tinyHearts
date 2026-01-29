// ------------------- LIVE DATE -------------------
document.getElementById('currentDate').innerText = new Date().toLocaleDateString('en-GB');

// ------------------- DATE FORMAT -------------------
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2,'0');
    const month = String(d.getMonth()+1).padStart(2,'0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// ------------------- AUTO-CALCULATE AGE -------------------
const dobInput = document.getElementById('dob');
const ageInput = document.getElementById('age');

dobInput.addEventListener('change', () => {
    const dob = new Date(dobInput.value);
    const today = new Date();
    if (isNaN(dob)) { ageInput.value = ''; return; }

    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();

    if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }
    ageInput.value = `${years}y ${months}m ${days}d`;
});

// ------------------- OTHERS FIELDS HANDLING -------------------
const othersFields = [
    ['diagnosis','diagnosisOther'], ['situsLoop','situsLoopOther'], ['systemicVeins','systemicVeinsOther'],
    ['pulmonaryVeins','pulmonaryVeinsOther'], ['atria','atriaOther'], ['atrialSeptum','atrialSeptumOther'],
    ['avValves','avValvesOther'], ['ventricles','ventriclesOther'], ['ventricularSeptum','ventricularSeptumOther'],
    ['outflowTracts','outflowTractsOther'], ['pulmonaryArteries','pulmonaryArteriesOther'], ['aorticArch','aorticArchOther'],
    ['othersField','othersFieldOther'], ['impression','impressionOther']
];

othersFields.forEach(([selId, taId]) => {
    const sel = document.getElementById(selId);
    const ta = document.getElementById(taId);
    if(sel && ta){
        sel.addEventListener('change', () => {
            if(sel.value === 'Others') ta.classList.remove('d-none');
            else { ta.classList.add('d-none'); ta.value = ''; }
        });
    }
});

// ------------------- HELPER FUNCTIONS -------------------
function camelToSnake(str){
    return str.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
}

function setSelectOrOther(selId, taId, value){
    const sel = document.getElementById(selId);
    const ta = document.getElementById(taId);
    if(!sel) return;
    if([...sel.options].some(o => o.value === value)){
        sel.value = value;
        if(ta) ta.classList.add('d-none');
    } else {
        sel.value = 'Others';
        if(ta){ ta.classList.remove('d-none'); ta.value = value; }
    }
}

function getValue(selId, taId){
    const sel = document.getElementById(selId);
    const ta = document.getElementById(taId);
    if(sel.value === 'Others' && ta) return ta.value;
    return sel.value;
}

// ------------------- AUTO-GENERATE PATIENT ID -------------------
const patientIdInput = document.getElementById('patientId');
const locationSelect = document.getElementById('location');
const LOCATION_CODES = {
    "Arthi Hospital, Kumbakonam":"KUM",
    "Senthil Nursing Home, Puthukottai":"PUTS",
    "Hridya Cardiac Care, Puthukottai":"PUTH",
    "Thulir Hospital, Tiruvarur":"TIR",
    "Perambalur Cardiac Centre, Perambalur":"PER",
    "Star Kids Hospital, Dindugul":"DIN",
    "Pugazhini Hospital, Trichy":"TRI"
};

locationSelect.addEventListener('change', async () => {
    const loc = locationSelect.value;
    const code = LOCATION_CODES[loc];
    if(!code){ patientIdInput.value = ''; return; }

    try {
        const res = await fetch(`/generate-patient-id?location=${encodeURIComponent(loc)}`);
        const data = await res.json();
        patientIdInput.value = data.patient_id || code + "1";
    } catch(err){
        console.error("Failed to generate patient ID:", err);
        patientIdInput.value = code + "1";
    }
});

// ------------------- LOAD PATIENT FOR EDIT -------------------
const params = new URLSearchParams(window.location.search);
const updateId = params.get("update");

if(updateId){
    fetch(`/patients/${updateId}`)
        .then(res => res.ok ? res.json() : Promise.reject("Patient not found"))
        .then(data => {
            patientIdInput.value = data.patient_id;
            patientIdInput.readOnly = true;
            document.getElementById('name').value = data.name || '';
            dobInput.value = data.dob ? data.dob.split('T')[0] : '';
            ageInput.value = data.age || '';
            document.getElementById('review_date').value = data.review_date ? data.review_date.split('T')[0] : '';
            document.getElementById('sex').value = data.sex || 'Male';
            document.getElementById('weight').value = data.weight || '';
            document.getElementById('phone1').value = data.phone1 || '';
            document.getElementById('phone2').value = data.phone2 || '';
            document.getElementById('location').value = data.location || '';
            othersFields.forEach(([selId, taId]) => setSelectOrOther(selId, taId, data[camelToSnake(selId)] || ''));
        })
        .catch(err => alert("Failed to load patient: " + err));
}

// ------------------- FORM SUBMIT -------------------
const form = document.getElementById('echoForm');
form.addEventListener('submit', async e => {
    e.preventDefault();

    const payload = {
        patient_id: patientIdInput.value,
        name: document.getElementById("name").value.trim(),
        age: ageInput.value,
        dob: dobInput.value || null,
        review_date: document.getElementById("review_date")?.value || null,
        sex: document.getElementById("sex").value,
        weight: parseFloat(document.getElementById("weight").value) || null,
        phone1: document.getElementById("phone1").value || null,
        phone2: document.getElementById("phone2").value || null,
        location: locationSelect.value || null
    };

    othersFields.forEach(([selId, taId]) => payload[camelToSnake(selId)] = getValue(selId, taId));

    if(!payload.patient_id || !payload.name){
        alert("Patient ID and Name are required");
        return;
    }

    const method = updateId ? 'PATCH' : 'POST';
    const url = updateId ? `/patients/${updateId}` : '/patients';

    try{
        const res = await fetch(url, {
            method,
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(payload)
        });
        const result = await res.json();
        if(res.ok){
            alert(updateId ? "Patient updated" : "Patient saved");
            window.location.href = 'records.html';
        } else {
            alert(result.error || "Failed to save");
        }
    } catch(err){ alert("Error: " + err.message); }
});

// ------------------- DOWNLOAD PDF -------------------
document.getElementById("downloadReport").addEventListener("click", async () => {
    const payload = {
        patient_id: patientIdInput.value.trim(),
        name: document.getElementById("name").value.trim(),
        age: ageInput.value,
        dob: dobInput.value || null,
        review_date: document.getElementById("review_date")?.value || null,
        sex: document.getElementById("sex").value,
        weight: parseFloat(document.getElementById("weight").value) || null,
        phone1: document.getElementById("phone1").value || null,
        phone2: document.getElementById("phone2").value || null,
        location: locationSelect.value || null
    };
    othersFields.forEach(([selId, taId]) => payload[camelToSnake(selId)] = getValue(selId, taId));

    if(!payload.name || !payload.patient_id){ alert("Patient ID and Name required"); return; }

    try{
        const res = await fetch("/generate-pdf", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(payload)
        });
        if(!res.ok) throw new Error(res.statusText);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `TinyHeartsReport-${payload.name.replace(/[^a-z0-9]/gi,'_')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch(err){ alert("PDF failed: "+err.message); }
});

// ------------------- SEARCH PATIENT -------------------
const searchBtn2 = document.getElementById("searchBtn");
const searchInput2 = document.getElementById("searchId");
const searchResult2 = document.getElementById("searchResult");

searchBtn2.addEventListener("click", async () => {
    const id = searchInput2.value.trim();
    if(!id){ alert("Enter Patient ID"); return; }
    try{
        const res = await fetch(`/patients/${id}`);
        if(res.status === 404){ searchResult2.innerText="Patient not found"; return; }
        if(!res.ok) throw new Error(res.statusText);
        const data = await res.json();

        searchResult2.innerText = `
Patient ID: ${data.patient_id}
Name: ${data.name}
DOB: ${formatDate(data.dob)}
Review Date: ${formatDate(data.review_date)}
Age: ${data.age || ''}
Sex: ${data.sex || ''}
Weight: ${data.weight || ''} kg
Phone1: ${data.phone1 || ''}
Phone2: ${data.phone2 || ''}
Location: ${data.location || ''}
Diagnosis: ${data.diagnosis || ''}
Situs & Looping: ${data.situs_loop || ''}
Systemic Veins: ${data.systemic_veins || ''}
Pulmonary Veins: ${data.pulmonary_veins || ''}
Atria: ${data.atria || ''}
Atrial Septum: ${data.atrial_septum || ''}
AV Valves: ${data.av_valves || ''}
Ventricles: ${data.ventricles || ''}
Ventricular Septum: ${data.ventricular_septum || ''}
Outflow Tracts: ${data.outflow_tracts || ''}
Pulmonary Arteries: ${data.pulmonary_arteries || ''}
Aortic Arch: ${data.aortic_arch || ''}
Others: ${data.others_field || ''}
Impression: ${data.impression || ''}
        `;
    } catch(err){ searchResult2.innerText="Error fetching patient: "+err.message; }
});
