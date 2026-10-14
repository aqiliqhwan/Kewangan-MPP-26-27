// ==========================================
// 1. TETAPAN FIREBASE (SIMPANAN AWAN REALTIME)
// ==========================================
const firebaseConfig = {
    // Ambil apiKey & projectId penuh dari Firebase Console > Project Settings
    apiKey: "AIzaSy...", // Masukkan API Key korang jika ada
    projectId: "kewanganmpp-default-rtdb", 
    databaseURL: "https://kewanganmpp-default-rtdb.asia-southeast1.firebasedatabase.app/" 
};

let useFirebase = false;
let dbRef = null;

function initFirebase() {
    try {
        if (firebaseConfig.databaseURL && !firebaseConfig.databaseURL.includes("SEMAK_FIREBASE")) {
            // Elak inisialisasi berulang
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            // RUJUKAN NODE DATABASE
            dbRef = firebase.database().ref("mpp_transactions");
            useFirebase = true;
            
            const statusEl = document.getElementById('cloud-status');
            if (statusEl) {
                statusEl.className = "bg-emerald-100 border-l-4 border-emerald-500 text-emerald-800 p-3 rounded-r text-xs md:text-sm flex items-center";
                statusEl.innerHTML = '<i class="fa-solid fa-cloud-check text-lg mr-2"></i> <strong>Awan Aktif:</strong> Data disimpan secara langsung dan dikongsi bersama semua ahli MPP.';
            }
            
            // Tarik data sebaik sahaja Firebase bersedia
            loadData();
        } else {
            fallbackToLocal();
        }
    } catch(e) {
        console.error("Firebase Error:", e);
        fallbackToLocal();
    }
}

function fallbackToLocal() {
    useFirebase = false;
    console.log("Menjalankan mod LocalStorage sahaja.");
    loadData();
}

let transactions = [];

// Loading Data
function loadData() {
    if (useFirebase && dbRef) {
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
        }, (error) => {
            console.error("Gagal membaca data dari Firebase:", error);
        });
    } else {
        // Mod Fallback: Simpan di LocalStorage pelayar
        const local = localStorage.getItem('mpp_tx_2627');
        transactions = local ? JSON.parse(local) : [];
        updateUI();
    }
}

// ... [KEKALKAN BAHAGIAN BORANG & JADUAL KORANG DARI KOD ASAL] ...

// ==========================================
// INIT (PASTIKAN PANGGIL SELEPAS PAGE READY)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    initFirebase();
});
