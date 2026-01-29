const table = document.getElementById('patientsTable').querySelector('tbody');
const searchInput = document.getElementById('searchId');
const searchBtn = document.getElementById('searchBtn');
const resetBtn = document.getElementById('resetBtn');

// ------------------- DATE FORMAT DD/MM/YYYY -------------------
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

// ------------------- LOAD ALL PATIENTS -------------------
async function loadPatients() {
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

            // Action buttons
            tr.querySelector('.editBtn').onclick = () => editPatient(p.patient_id);
            tr.querySelector('.deleteBtn').onclick = () => deletePatient(p.patient_id);
            tr.querySelector('.pdfBtn').onclick = () => generatePDF(p.patient_id);
        });
    } catch (err) {
        console.error("Error loading patients:", err);
    }
}
loadPatients();

// ------------------- EDIT PATIENT -------------------
function editPatient(id) {
    window.location.href = `index.html?update=${id}`;
}

// ------------------- DELETE PATIENT -------------------
async function deletePatient(id) {
    if (!confirm("Delete this patient?")) return;

    try {
        const res = await fetch(`/patients/${id}`, { method: 'DELETE' });
        const data = await res.json();
        alert(data.status || data.error);
        loadPatients();
    } catch (err) {
        alert("Error deleting patient: " + err.message);
    }
}

// ------------------- GENERATE PDF -------------------
async function generatePDF(id) {
    try {
        const res = await fetch(`/patients/${id}`);
        const data = await res.json();

        if (!res.ok || data.error) {
            throw new Error(data.error || "Patient fetch failed");
        }

        // Format dates
        data.dob = formatDate(data.dob);
        data.review_date = formatDate(data.review_date);

        const pdfRes = await fetch('/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!pdfRes.ok) {
            const text = await pdfRes.text();
            throw new Error(text || "PDF generation failed");
        }

        const blob = await pdfRes.blob();
        if (blob.type !== "application/pdf") {
            throw new Error("Server did not return a PDF");
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TinyHeartsReport-${data.name.replace(/[^a-z0-9]/gi, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

    } catch (err) {
        alert("PDF generation failed: " + err.message);
        console.error(err);
    }
}

// ------------------- SEARCH FUNCTION -------------------
searchBtn.addEventListener('click', () => {
    const searchId = searchInput.value.trim().toLowerCase();
    if (!searchId) { alert("Enter Patient ID"); return; }

    let found = false;
    document.querySelectorAll('#patientsTable tbody tr').forEach(row => {
        const rowId = row.cells[0].innerText.toLowerCase();
        if (rowId === searchId) {
            row.style.display = '';
            row.classList.add('highlight');
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            found = true;
        } else {
            row.style.display = 'none';
            row.classList.remove('highlight');
        }
    });

    if (!found) alert("Patient not found");
});

// ------------------- RESET FUNCTION -------------------
resetBtn.addEventListener('click', () => {
    document.querySelectorAll('#patientsTable tbody tr').forEach(row => {
        row.style.display = '';
        row.classList.remove('highlight');
    });
    searchInput.value = '';
});
