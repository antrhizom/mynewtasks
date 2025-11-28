import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp, query, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "DEIN_API_KEY",
    authDomain: "DEIN_AUTH_DOMAIN",
    projectId: "DEIN_PROJECT_ID",
    storageBucket: "DEIN_STORAGE_BUCKET",
    messagingSenderId: "DEINE_MESSAGING_SENDER_ID",
    appId: "DEINE_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const userCode = localStorage.getItem('berufseinstieg_code');
const sessionId = localStorage.getItem('berufseinstieg_session');

if (!userCode || !sessionId) {
    alert('Keine aktive Sitzung. Weiterleitung...');
    window.location.href = 'index.html';
}

document.getElementById('headerSubtitle').textContent = `Code: ${userCode} | Wie geht es dir?`;

let currentStep = 1;
const formData = {};
let allData = [];

// Alle Daten laden
async function loadAllData() {
    try {
        const q = query(collection(db, 'sessions'), where('stimmungsbarometer', '!=', null));
        const snapshot = await getDocs(q);
        allData = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.stimmungsbarometer) {
                allData.push(data.stimmungsbarometer);
            }
        });
        console.log(`${allData.length} Datensätze geladen`);
    } catch (error) {
        console.error('Fehler:', error);
    }
}

// SOFORT Mood-Statistiken zeigen
function showMoodStatsInstant(selected) {
    const stats = document.getElementById('moodStats');
    const content = document.getElementById('moodStatsContent');
    
    const counts = { 'sehr-gut': 0, 'gut': 0, 'mittel': 0, 'nicht-so-gut': 0, 'schlecht': 0 };
    allData.forEach(d => { if (d.mood) counts[d.mood]++; });
    
    const total = Object.values(counts).reduce((a,b) => a+b, 0) || 1;
    
    const labels = {
        'sehr-gut': '😄 Sehr gut',
        'gut': '🙂 Gut',
        'mittel': '😐 Mittel',
        'nicht-so-gut': '😟 Nicht so gut',
        'schlecht': '😢 Schlecht'
    };
    
    let html = '';
    Object.entries(counts).forEach(([key, count]) => {
        const pct = Math.round((count/total)*100);
        const isYou = key === selected;
        html += `
            <div class="stat-bar" style="animation-delay: ${Object.keys(counts).indexOf(key) * 0.1}s">
                <div class="stat-label">
                    <span>${labels[key]} ${isYou ? '<span class="your-choice">← DU</span>' : ''}</span>
                    <span>${count} (${pct}%)</span>
                </div>
                <div class="stat-progress">
                    <div class="stat-fill" style="width: ${pct}%">${pct}%</div>
                </div>
            </div>
        `;
    });
    
    content.innerHTML = html;
    stats.style.display = 'block';
}

// SOFORT Company-Stats
function showCompanyStatsInstant(selected) {
    const stats = document.getElementById('companyStats');
    const content = document.getElementById('companyStatsContent');
    
    const counts = { 'nein': 0, 'kleine': 0, 'grosse': 0 };
    allData.forEach(d => { if (d.problemsCompany) counts[d.problemsCompany]++; });
    
    const total = Object.values(counts).reduce((a,b) => a+b, 0) || 1;
    
    const labels = {
        'nein': '✅ Keine Probleme',
        'kleine': '⚠️ Kleinere Probleme',
        'grosse': '❌ Grössere Probleme'
    };
    
    let html = '';
    Object.entries(counts).forEach(([key, count]) => {
        const pct = Math.round((count/total)*100);
        const isYou = key === selected;
        html += `
            <div class="stat-bar">
                <div class="stat-label">
                    <span>${labels[key]} ${isYou ? '<span class="your-choice">← DU</span>' : ''}</span>
                    <span>${count} (${pct}%)</span>
                </div>
                <div class="stat-progress">
                    <div class="stat-fill" style="width: ${pct}%">${pct}%</div>
                </div>
            </div>
        `;
    });
    
    content.innerHTML = html;
    stats.style.display = 'block';
}

// SOFORT School-Stats
function showSchoolStatsInstant(selected) {
    const stats = document.getElementById('schoolStats');
    const content = document.getElementById('schoolStatsContent');
    
    const counts = { 'sehr-gut': 0, 'gut': 0, 'herausfordernd': 0, 'schwierig': 0 };
    allData.forEach(d => { if (d.schoolSituation) counts[d.schoolSituation]++; });
    
    const total = Object.values(counts).reduce((a,b) => a+b, 0) || 1;
    
    const labels = {
        'sehr-gut': '😄 Sehr gut',
        'gut': '🙂 Gut',
        'herausfordernd': '😐 Herausfordernd',
        'schwierig': '😟 Schwierig'
    };
    
    let html = '';
    Object.entries(counts).forEach(([key, count]) => {
        const pct = Math.round((count/total)*100);
        const isYou = key === selected;
        html += `
            <div class="stat-bar">
                <div class="stat-label">
                    <span>${labels[key]} ${isYou ? '<span class="your-choice">← DU</span>' : ''}</span>
                    <span>${count} (${pct}%)</span>
                </div>
                <div class="stat-progress">
                    <div class="stat-fill" style="width: ${pct}%">${pct}%</div>
                </div>
            </div>
        `;
    });
    
    content.innerHTML = html;
    stats.style.display = 'block';
}

// Navigation
function goToStep(step) {
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.progress-step').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`step${step}`).classList.add('active');
    document.querySelector(`.progress-step[data-step="${step}"]`).classList.add('active');
    
    for (let i = 1; i < step; i++) {
        document.querySelector(`.progress-step[data-step="${i}"]`).classList.add('completed');
    }
    
    const progress = ((step - 1) / 3) * 100;
    document.getElementById('progressLine').style.width = `${progress}%`;
    
    currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Step 1: SOFORT beim Klick Stats zeigen
document.querySelectorAll('input[name="mood"]').forEach(radio => {
    radio.addEventListener('change', function() {
        formData.mood = this.value;
        showMoodStatsInstant(this.value);
    });
});

document.getElementById('step1Next').addEventListener('click', () => {
    if (!formData.mood) {
        alert('Bitte wähle deine Stimmung aus.');
        return;
    }
    goToStep(2);
});

// Step 2: Quick Buttons mit SOFORT Stats
document.querySelectorAll('.quick-btn[data-name="problems-company"]').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.quick-btn[data-name="problems-company"]').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        
        const value = this.dataset.value;
        formData.problemsCompany = value;
        
        // SOFORT Stats zeigen
        showCompanyStatsInstant(value);
        
        // Details zeigen/verstecken
        if (value === 'kleine' || value === 'grosse') {
            document.getElementById('companyDetails').style.display = 'block';
        } else {
            document.getElementById('companyDetails').style.display = 'none';
        }
    });
});

document.getElementById('step2Next').addEventListener('click', () => {
    if (!formData.problemsCompany) {
        alert('Bitte beantworte die Frage zum Lehrbetrieb.');
        return;
    }
    
    formData.companyIssues = Array.from(document.querySelectorAll('#companyDetails input:checked')).map(cb => cb.value);
    goToStep(3);
});

// Step 3: School mit SOFORT Stats
document.querySelectorAll('.quick-btn[data-name="school-situation"]').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.quick-btn[data-name="school-situation"]').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        
        const value = this.dataset.value;
        formData.schoolSituation = value;
        
        // SOFORT Stats zeigen
        showSchoolStatsInstant(value);
    });
});

document.getElementById('step3Next').addEventListener('click', async () => {
    if (!formData.schoolSituation) {
        alert('Bitte beantworte, wie es in der Schule läuft.');
        return;
    }
    
    formData.schoolIssues = Array.from(document.querySelectorAll('#step3 .checkbox-group input:checked')).map(cb => cb.value);
    
    // Speichern
    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            stimmungsbarometer: formData,
            stimmungsbarometer_timestamp: serverTimestamp()
        });
        
        goToStep(4);
        document.getElementById('finalCode').textContent = userCode;
        
        // Countdown
        let countdown = 3;
        const interval = setInterval(() => {
            countdown--;
            document.getElementById('countdown').textContent = countdown;
            if (countdown <= 0) {
                clearInterval(interval);
                window.location.href = 'learn1.html';
            }
        }, 1000);
        
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Speichern. Bitte versuche es erneut.');
    }
});

// Zurück-Buttons
document.querySelectorAll('.btn-prev').forEach(btn => {
    btn.addEventListener('click', function() {
        const prevStep = parseInt(this.dataset.prev);
        if (prevStep) goToStep(prevStep);
    });
});

// Initial
loadAllData();
