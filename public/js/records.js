const table = document.getElementById('patientsTable').querySelector('tbody');
const searchInput = document.getElementById('searchId');
const searchResult = document.getElementById('searchResult');

// Load all patients
async function loadPatients() {
    const res = await fetch('/patients');
    const data = await res.json();
    table.innerHTML = '';
    data.forEach(p=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.patient_id}</td>
            <td>${p.name}</td>
            <td>
                <button class="btn btn-sm btn-primary editBtn">Edit</button>
                <button class="btn btn-sm btn-danger deleteBtn">Delete</button>
                <button class="btn btn-sm btn-success pdfBtn">PDF</button>
            </td>`;
        table.appendChild(tr);

        tr.querySelector('.editBtn').onclick = ()=> editPatient(p.patient_id);
        tr.querySelector('.deleteBtn').onclick = ()=> deletePatient(p.patient_id);
        tr.querySelector('.pdfBtn').onclick = ()=> generatePDF(p.patient_id);
    });
}
loadPatients();

// SEARCH
document.getElementById('searchBtn').addEventListener('click', async ()=>{
    const id = searchInput.value.trim();
    if(!id){ alert("Enter Patient ID"); return; }
    try{
        const res = await fetch(`/patients/${id}`);
        const json = await res.json();
        if(json.error){ searchResult.textContent = json.error; return; }
        searchResult.textContent = JSON.stringify(json,null,2);
    }catch(err){ searchResult.textContent = err.message; }
});

// EDIT
function editPatient(id){
    window.location.href = `index.html?update=${id}`;
}

// DELETE
async function deletePatient(id){
    if(!confirm("Delete this patient?")) return;
    const res = await fetch(`/patients/${id}`, { method:'DELETE' });
    const json = await res.json();
    alert(json.status||json.error);
    loadPatients();
}

// PDF
async function generatePDF(id){
    const res = await fetch(`/patients/${id}`);
    const data = await res.json();
    if(data.error){ alert(data.error); return; }
    const pdfRes = await fetch('/generate-pdf', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(data)
    });
    const blob = await pdfRes.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TinyHeartsReport-${data.name.replace(/[^a-z0-9]/gi,"_")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
}
