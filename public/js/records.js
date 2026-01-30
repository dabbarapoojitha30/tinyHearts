const table = document.getElementById('patientsTable')?.querySelector('tbody');
const searchInput = document.getElementById('searchId');
const searchBtn = document.getElementById('searchBtn');
const resetBtn = document.getElementById('resetBtn');

// ------------------- DATE FORMAT -------------------
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

// ------------------- LOAD ALL PATIENTS -------------------
async function loadPatients() {
    if(!table) return;
    try {
        const res = await fetch('/patients');
        const data = await res.json();
        table.innerHTML = '';

        data.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.patient_id}</td>
                <td>${p.name}</td>
                <td>${p.age || ''}</td>
                <td>${p.location || ''}</td>
                <td>
                    <button class="btn btn-sm btn-primary editBtn">Edit</button>
                    <button class="btn btn-sm btn-danger deleteBtn">Delete</button>
                    <button class="btn btn-sm btn-success pdfBtn">PDF</button>
                </td>
            `;
            table.appendChild(tr);

            tr.querySelector('.editBtn').onclick = () => editPatient(p.patient_id);
            tr.querySelector('.deleteBtn').onclick = () => deletePatient(p.patient_id);
            tr.querySelector('.pdfBtn').onclick = () => generatePDF(p.patient_id);
        });
    } catch (err) {
        console.error("Error loading patients:", err);
    }
}
loadPatients();

// ------------------- EDIT -------------------
function editPatient(id) {
    window.location.href = `index.html?update=${id}`;
}

// ------------------- DELETE -------------------
async function deletePatient(id) {
    if(!confirm("Delete this patient?")) return;
    try {
        const res = await fetch(`/patients/${id}`, { method: 'DELETE' });
        if(!res.ok){
            const text = await res.text();
            throw new Error(text || "Delete failed");
        }
        alert("Patient deleted successfully");
        loadPatients();
    } catch(err){
        alert("Delete error: "+err.message);
        console.error(err);
    }
}

// ------------------- GENERATE PDF -------------------
async function generatePDF(id) {
    try {
        const res = await fetch(`/patients/${id}`);
        if(!res.ok) throw new Error("Patient fetch failed");
        const data = await res.json();

        // Format dates
        data.dob = formatDate(data.dob);
        data.review_date = formatDate(data.review_date);

        const pdfRes = await fetch('/generate-pdf', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify(data)
        });
        if(!pdfRes.ok) throw new Error(await pdfRes.text());

        const blob = await pdfRes.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TinyHeartsReport-${data.name.replace(/[^a-z0-9]/gi,'_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch(err){
        alert("PDF failed: "+err.message);
        console.error(err);
    }
}

// ------------------- SEARCH -------------------
if(searchBtn && searchInput){
    searchBtn.addEventListener('click', () => {
        const searchId = searchInput.value.trim().toLowerCase();
        if(!searchId){ alert("Enter Patient ID"); return; }

        let found = false;
        document.querySelectorAll('#patientsTable tbody tr').forEach(row=>{
            const rowId = row.cells[0].innerText.toLowerCase();
            if(rowId === searchId){
                row.style.display = '';
                row.classList.add('highlight');
                row.scrollIntoView({behavior:'smooth', block:'center'});
                found = true;
            } else {
                row.style.display = 'none';
                row.classList.remove('highlight');
            }
        });
        if(!found) alert("Patient not found");
    });
}

// ------------------- RESET -------------------
if(resetBtn){
    resetBtn.addEventListener('click', () => {
        document.querySelectorAll('#patientsTable tbody tr').forEach(row=>{
            row.style.display = '';
            row.classList.remove('highlight');
        });
        searchInput.value = '';
    });
}
