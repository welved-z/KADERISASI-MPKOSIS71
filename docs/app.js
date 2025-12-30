// docs/app.js (ganti header dengan ini — memakai Firebase JS SDK v12.7.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, doc, getDoc, runTransaction, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Konfigurasi proyek Anda (sudah Anda buat)
const firebaseConfig = {
  apiKey: "AIzaSyBpBvKigAXneoyCl32DTis6HmfKTAJgtI4",
  authDomain: "kaderisasi-mpkosis71-d9389.firebaseapp.com",
  projectId: "kaderisasi-mpkosis71-d9389",
  storageBucket: "kaderisasi-mpkosis71-d9389.firebasestorage.app",
  messagingSenderId: "1021211133026",
  appId: "1:1021211133026:web:850dfa2d478a1ddffd7d3b",
  measurementId: "G-5FVWJE7FQM"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* UI elements */
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const loginStatus = document.getElementById('login-status');
const userNameSpan = document.getElementById('user-name');

const btnOpenInput = document.getElementById('btn-open-input');
const modal = document.getElementById('modal');
const btnCancel = document.getElementById('btn-cancel');
const btnSubmitAssess = document.getElementById('btn-submit-assess');
const modalStatus = document.getElementById('modal-status');

const inputParticipant = document.getElementById('input-participant');
const inputJabatan = document.getElementById('input-jabatan');
const inputTags = document.getElementById('input-tags');
const inputJournal = document.getElementById('input-journal');
const inputStatus = document.getElementById('input-status');

const tableBody = document.getElementById('table-body');
const cardList = document.getElementById('card-list');
const updatedAt = document.getElementById('updated-at');

btnLogin.addEventListener('click', async () => {
  loginStatus.textContent = '';
  const username = document.getElementById('email').value.trim();
  const pw = document.getElementById('password').value;
  if (!username || !pw) { loginStatus.textContent = 'Isi username dan password'; loginStatus.classList.add('error'); return; }
  btnLogin.disabled = true;
  try {
    // Using synthetic email scheme: username@mpk71.local
    const email = `${username}@mpk71.local`;
    await signInWithEmailAndPassword(auth, email, pw);
  } catch (err) {
    loginStatus.textContent = 'Login gagal: ' + err.message;
    loginStatus.classList.add('error');
  } finally { btnLogin.disabled = false; }
});

btnLogout.addEventListener('click', async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  loginStatus.textContent = '';
  if (user) {
    const uDoc = await getDoc(doc(db, 'users', user.uid));
    const role = uDoc.exists() ? uDoc.data().role : 'user';
    if (!(role === 'mpk' || role === 'admin')) {
      loginStatus.textContent = 'Akun tidak memiliki izin menilai.';
      loginStatus.classList.add('error');
      await signOut(auth);
      return;
    }
    userNameSpan.textContent = uDoc.exists() ? (uDoc.data().name || user.email) : user.email;
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    await loadAssessments();
  } else {
    dashboardScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
  }
});

/* Modal handlers */
btnOpenInput.addEventListener('click', () => {
  modal.classList.remove('hidden');
  modalStatus.textContent = '';
});
btnCancel.addEventListener('click', () => {
  modal.classList.add('hidden');
});

/* Submit assessment with transaction to prevent double submit */
btnSubmitAssess.addEventListener('click', async () => {
  modalStatus.textContent = ''; modalStatus.classList.remove('error');
  const user = auth.currentUser;
  if (!user) { modalStatus.textContent='Harap login'; modalStatus.classList.add('error'); return; }

  const participantId = inputParticipant.value.trim();
  if (!participantId) { modalStatus.textContent='Masukkan ID peserta'; modalStatus.classList.add('error'); return; }

  const prokerId = 'general';
  const docId = `${participantId}_${prokerId}_${user.uid}`;
  const data = {
    participantId,
    participantName: participantId,
    jabatan: inputJabatan.value.trim() || '',
    assessorId: user.uid,
    assessorName: user.email || '',
    prokerId,
    tags: inputTags.value.split(',').map(t => t.trim()).filter(Boolean),
    journal: inputJournal.value.trim(),
    status: inputStatus.value,
    createdAt: new Date()
  };

  btnSubmitAssess.disabled = true;
  try {
    const docRef = doc(db, 'assessments', docId);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (snap.exists()) throw new Error('Penilaian untuk peserta ini pada proker ini sudah ada.');
      transaction.set(docRef, data);
    });
    modalStatus.textContent = 'Penilaian berhasil dikirim';
    inputParticipant.value = ''; inputJabatan.value = ''; inputTags.value=''; inputJournal.value='';
    await loadAssessments();
  } catch (err) {
    modalStatus.textContent = 'Gagal: ' + err.message;
    modalStatus.classList.add('error');
  } finally {
    btnSubmitAssess.disabled = false;
  }
});

/* Load assessments (demo) */
async function loadAssessments(){
  updatedAt.textContent = '-';
  tableBody.innerHTML = '';
  cardList.innerHTML = '';
  const q = query(collection(db, 'assessments'), orderBy('createdAt', 'desc'), limit(50));
  const snaps = await getDocs(q);
  let count = 0;
  snaps.forEach(docSnap => {
    const d = docSnap.data();
    addRow(docSnap.id, d);
    count++;
  });
  document.getElementById('pager').textContent = `Menampilkan ${count} dari ${count} Kader`;
  if (snaps.size > 0) {
    const latest = snaps.docs[0].data().createdAt;
    updatedAt.textContent = latest && latest.toDate ? latest.toDate().toLocaleString() : '-';
  }
}

function addRow(id, d){
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <div style="font-weight:700">${escapeHtml(d.participantName || d.participantId)}</div>
      <div class="muted small">Angkatan ${d.participantAngkatan || '28'}</div>
    </td>
    <td>${escapeHtml(d.jabatan || '')}</td>
    <td>${(d.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join(' ')}</td>
    <td><em>${escapeHtml(shorten(d.journal || '', 120))}</em></td>
    <td><strong>${escapeHtml(d.status || '')}</strong></td>
    <td><a href="#" data-id="${id}" class="detail-link">Detail</a></td>
  `;
  tableBody.appendChild(tr);

  const card = document.createElement('div');
  card.className = 'kader-card';
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between">
      <div><strong>${escapeHtml(d.participantName || d.participantId)}</strong><div class="meta muted">${escapeHtml(d.jabatan || '')}</div></div>
      <div style="text-align:right"><span style="display:inline-block;padding:0.3rem 0.5rem;border-radius:999px;background:#fff6eb;color:var(--accent);font-weight:600">${escapeHtml(d.status||'')}</span></div>
    </div>
    <div style="margin-top:0.5rem">${(d.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join(' ')}</div>
    <div style="margin-top:0.5rem;color:var(--muted)"><em>${escapeHtml(shorten(d.journal || '', 160))}</em></div>
  `;
  cardList.appendChild(card);
}

function escapeHtml(s=''){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;') }
function shorten(s, n){ if(!s) return ''; return s.length>n? s.slice(0,n-1)+'…': s }
document.addEventListener('click', (e) => {
  if (e.target.matches('.detail-link')) {
    e.preventDefault();
    alert('Detail view belum diimplementasikan di demo.');
  }
});
