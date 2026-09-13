// ==========================================
// 1. TETAPAN FIREBASE (SIMPANAN AWAN REALTIME)
// ==========================================
// Tukar dengan Konfigurasi Firebase Projek Anda (Percuma dari console.firebase.google.com)
const firebaseConfig = {
    databaseURL: "https://kewanganmpp-default-rtdb.asia-southeast1.firebasedatabase.app/" 
};

let useFirebase = false;
let dbRef = null;

// Semak sambungan Firebase
try {
    if (firebaseConfig.databaseURL && !firebaseConfig.databaseURL.includes("SEMAK_FIREBASE")) {
        firebase.initializeApp(firebaseConfig);
        dbRef = firebase.database().ref("mpp_transactions");
        useFirebase = true;
        document.getElementById('cloud-status').className = "bg-emerald-100 border-l-4 border-emerald-500 text-emerald-800 p-3 rounded-r text-xs md:text-sm flex items-center";
        document.getElementById('cloud-status').innerHTML = '<i class="fa-solid fa-cloud-check text-lg mr-2"></i> <strong>Awan Aktif:</strong> Data disimpan secara langsung dan dikongsi bersama semua ahli MPP.';
    }
} catch(e) {
    console.log("Menjalankan mod LocalStorage sahaja.");
}

let transactions = [];

// Loading Data
function loadData() {
    if (useFirebase) {
        // Tarik data terus dari Awan Firebase
        dbRef.on('value', (snapshot) => {
            const data = snapshot.val();
            transactions = [];
            if (data) {
                Object.keys(data).forEach(key => {
                    transactions.push({ id: key, ...data[key] });
                });
            }
            // Susun mengikut tarikh
            transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
            updateUI();
        });
    } else {
        // Mod Fallback: Simpan di LocalStorage pelayar
        const local = localStorage.getItem('mpp_tx_2627');
        transactions = local ? JSON.parse(local) : [];
        updateUI();
    }
}

function saveData() {
    if (!useFirebase) {
        localStorage.setItem('mpp_tx_2627', JSON.stringify(transactions));
    }
}

// ==========================================
// 2. KEMASKINI PAPARAN & JADUAL
// ==========================================
function updateUI() {
    updateCategoryDropdown();
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('transaction-rows');
    const search = document.getElementById('search-input').value.toLowerCase();
    const filterType = document.getElementById('filter-type').value;
    const filterCategory = document.getElementById('filter-category').value;

    tbody.innerHTML = '';

    let currentBalance = 0;
    let totalCredit = 0;
    let totalDebit = 0;
    let displayIndex = 1;

    transactions.forEach((tx) => {
        const isMasuk = tx.type === 'MASUK';
        const credit = isMasuk ? parseFloat(tx.amount) : 0;
        const debit = !isMasuk ? parseFloat(tx.amount) : 0;

        totalCredit += credit;
        totalDebit += debit;
        currentBalance += (credit - debit);

        // Penapis
        const matchesSearch = tx.desc.toLowerCase().includes(search) || tx.category.toLowerCase().includes(search);
        const matchesType = filterType === 'ALL' || tx.type === filterType;
        const matchesCat = filterCategory === 'ALL' || tx.category === filterCategory;

        if (matchesSearch && matchesType && matchesCat) {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-blue-50/50 transition border-b border-gray-100";
            tr.innerHTML = `
                <td class="py-3 px-4 text-center font-medium text-gray-400 text-xs">${displayIndex++}</td>
                <td class="py-3 px-4 whitespace-nowrap font-medium text-gray-600">${formatDate(tx.date)}</td>
                <td class="py-3 px-4 font-semibold text-gray-800">${tx.desc}</td>
                <td class="py-3 px-4"><span class="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-lg border font-medium">${tx.category}</span></td>
                <td class="py-3 px-4 text-right font-bold text-emerald-600">${credit ? 'RM ' + credit.toFixed(2) : '-'}</td>
                <td class="py-3 px-4 text-right font-bold text-rose-600">${debit ? 'RM ' + debit.toFixed(2) : '-'}</td>
                <td class="py-3 px-4 text-right font-black text-blue-900">RM ${currentBalance.toFixed(2)}</td>
                <td class="py-3 px-4 text-center space-x-1">
                    <button onclick="editTx('${tx.id}')" class="text-blue-500 hover:text-blue-700 p-1"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="deleteTx('${tx.id}')" class="text-rose-400 hover:text-rose-600 p-1"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        }
    });

    // Update Total Cards
    document.getElementById('total-credit').innerText = `RM ${totalCredit.toFixed(2)}`;
    document.getElementById('total-debit').innerText = `RM ${totalDebit.toFixed(2)}`;
    document.getElementById('total-balance').innerText = `RM ${currentBalance.toFixed(2)}`;
}

// ==========================================
// 3. BORANG & SIMPAN TRANSAKSI
// ==========================================
function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('tx-id').value;
    const type = document.querySelector('input[name="tx-type"]:checked').value;
    const date = document.getElementById('tx-date').value;
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const desc = document.getElementById('tx-desc').value;
    const category = document.getElementById('tx-category').value;

    const payload = { type, date, amount, desc, category };

    if (useFirebase) {
        if (id) {
            dbRef.child(id).update(payload);
        } else {
            dbRef.push(payload);
        }
    } else {
        if (id) {
            const idx = transactions.findIndex(t => t.id === id);
            transactions[idx] = { id, ...payload };
        } else {
            transactions.push({ id: Date.now().toString(), ...payload });
        }
        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        saveData();
        updateUI();
    }

    closeModal();
}

function deleteTx(id) {
    if (confirm('Adakah anda pasti untuk memadam rekod transaksi ini?')) {
        if (useFirebase) {
            dbRef.child(id).remove();
        } else {
            transactions = transactions.filter(t => t.id !== id);
            saveData();
            updateUI();
        }
    }
}

function editTx(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    document.getElementById('tx-id').value = tx.id;
    document.querySelector(`input[name="tx-type"][value="${tx.type}"]`).checked = true;
    document.getElementById('tx-date').value = tx.date;
    document.getElementById('tx-amount').value = tx.amount;
    document.getElementById('tx-desc').value = tx.desc;
    document.getElementById('tx-category').value = tx.category;

    document.getElementById('modal-title').innerText = "Kemaskini Transaksi";
    document.getElementById('modal').classList.remove('hidden');
}

// Helper Functions
function openModal() {
    document.getElementById('tx-form').reset();
    document.getElementById('tx-id').value = '';
    document.getElementById('tx-date').valueAsDate = new Date();
    document.getElementById('modal-title').innerText = "Tambah Transaksi Baru";
    document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

function updateCategoryDropdown() {
    const select = document.getElementById('filter-category');
    const categories = [...new Set(transactions.map(t => t.category))];
    
    select.innerHTML = '<option value="ALL">Semua Kategori</option>';
    categories.forEach(cat => {
        if(cat) {
            select.innerHTML += `<option value="${cat}">${cat}</option>`;
        }
    });
}

function formatDate(dStr) {
    if(!dStr) return '-';
    const [y, m, d] = dStr.split('-');
    return `${d}/${m}/${y}`;
}

function exportCSV() {
    let csv = 'Bil,Tarikh,Transaksi,Kategori,Jenis,Jumlah (RM)\n';
    transactions.forEach((t, i) => {
        csv += `"${i+1}","${t.date}","${t.desc}","${t.category}","${t.type}","${t.amount}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `CATATAN_KEWANGAN_MPP_${new Date().toISOString().slice(0,10)}.csv`);
    a.click();
}

// Init
loadData();
