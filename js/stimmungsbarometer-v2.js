import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp, query, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase Konfiguration
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

// Session-Daten
const userCode = localStorage.getItem('berufseinstieg_code');
const sessionId = localStorage.getItem('berufseinstieg_session');

if (!userCode || !sessionId) {
    alert('Keine aktive Sitzung. Weiterleitung zur Startseite...');
    window.location.href = 'index.html';
}

document.getElementById('headerSubtitle').textContent = `Dein Code: ${userCode} | Wie geht es dir?`;

// Globale Daten
let currentStep = 1;
const formData = {};
let allSessionsData = [];

// Alle Sessions laden für Statistiken
async function loadAllSessions() {
    try {
        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where('stimmungsbarometer', '!=', null));
        const snapshot = await getDocs(q);
        
        allSessionsData = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.stimmungsbarometer) {
                allSessionsData.push(data.stimmungsbarometer);
            }
        });
        
        console.log(`${allSessionsData.length} Sessions mit Stimmungsbarometer-Daten geladen`);
    } catch (error) {
        console.error('Fehler beim Laden der Sessions:', error);
    }
}

// Statistiken für Stimmung
function showMoodStats(selectedMood) {
    const statsDiv = document.getElementById('moodStats');
    const contentDiv = document.getElementById('moodStatsContent');
    
    if (allSessionsData.length === 0) {
        return;
    }
    
    const moodCounts = {
        'sehr-gut': 0,
        'gut': 0,
        'mittel': 0,
        'nicht-so-gut': 0,
        'schlecht': 0
    };
    
    allSessionsData.forEach(data => {
        if (data.mood && moodCounts.hasOwnProperty(data.mood)) {
            moodCounts[data.mood]++;
        }
    });
    
    const total = Object.values(moodCounts).reduce((a, b) => a + b, 0);
    
    let html = '';
    const labels = {
        'sehr-gut': '😄 Sehr gut',
        'gut': '🙂 Gut',
        'mittel': '😐 Mittel',
        'nicht-so-gut': '😟 Nicht so gut',
        'schlecht': '😢 Schlecht'
    };
    
    Object.entries(moodCounts).forEach(([key, count]) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const isSelected = key === selectedMood;
        
        html += `
            <div class="stat-bar">
                <div class="stat-label">
                    <span>${labels[key]} ${isSelected ? '← Du' : ''}</span>
                    <span>${count} (${percentage}%)</span>
                </div>
                <div class="stat-progress">
                    <div class="stat-fill" style="width: ${percentage}%">${percentage}%</div>
                </div>
            </div>
        `;
    });
    
    contentDiv.innerHTML = html;
    statsDiv.style.display = 'block';
}

// Statistiken für Lehrbetrieb
function showCompanyStats() {
    const statsDiv = document.getElementById('companyStats');
    const contentDiv = document.getElementById('companyStatsContent');
    
    if (allSessionsData.length === 0) return;
    
    const problemCounts = {
        'nein': 0,
        'kleine': 0,
        'grosse': 0
    };
    
    allSessionsData.forEach(data => {
        if (data.problemsCompany) {
            problemCounts[data.problemsCompany]++;
        }
    });
    
    const total = Object.values(problemCounts).reduce((a, b) => a + b, 0);
    
    let html = '<p><strong>Probleme im Betrieb:</strong></p>';
    const labels = {
        'nein': '✅ Keine Probleme',
        'kleine': '⚠️ Kleinere Probleme',
        'grosse': '❌ Grössere Probleme'
    };
    
    Object.entries(problemCounts).forEach(([key, count]) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        html += `
            <div class="stat-bar">
                <div class="stat-label">
                    <span>${labels[key]}</span>
                    <span>${count} (${percentage}%)</span>
                </div>
                <div class="stat-progress">
                    <div class="stat-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    
    contentDiv.innerHTML = html;
    statsDiv.style.display = 'block';
}

// Statistiken für Schule
function showSchoolStats() {
    const statsDiv = document.getElementById('schoolStats');
    const contentDiv = document.getElementById('schoolStatsContent');
    
    if (allSessionsData.length === 0) return;
    
    const issueCounts = {};
    
    allSessionsData.forEach(data => {
        if (data.schoolIssues && Array.isArray(data.schoolIssues)) {
            data.schoolIssues.forEach(issue => {
                issueCounts[issue] = (issueCounts[issue] || 0) + 1;
            });
        }
    });
    
    const sorted = Object.entries(issueCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    
    const labels = {
        'lernstoff': 'Schwieriger Lernstoff',
        'lerntempo': 'Zu schnelles Tempo',
        'hausaufgaben': 'Hausaufgaben',
        'pruefungen': 'Prüfungsstress',
        'keine': 'Keine Schwierigkeiten'
    };
    
    let html = '<p><strong>Top 5 Herausforderungen:</strong></p>';
    
    sorted.forEach(([key, count]) => {
        const label = labels[key] || key;
        html += `
            <div class="stat-bar">
                <div class="stat-label">
                    <span>${label}</span>
                    <span>${count} Personen</span>
                </div>
                <div class="stat-progress">
                    <div class="stat-fill" style="width: ${Math.min(count * 10, 100)}%"></div>
                </div>
            </div>
        `;
    });
    
    contentDiv.innerHTML = html;
    statsDiv.style.display = 'block';
}

// Statistiken für Alltag
function showPrivateStats() {
    const statsDiv = document.getElementById('privateStats');
    const contentDiv = document.getElementById('privateStatsContent');
    
    if (allSessionsData.length === 0) return;
    
    const issueCounts = {};
    
    allSessionsData.forEach(data => {
        if (data.privateIssues && Array.isArray(data.privateIssues)) {
            data.privateIssues.forEach(issue => {
                issueCounts[issue] = (issueCounts[issue] || 0) + 1;
            });
        }
    });
    
    const sorted = Object.entries(issueCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    
    const labels = {
        'zeitmanagement': 'Zeitmanagement',
        'finanzen': 'Finanzen',
        'schlaf': 'Genug Schlaf',
        'stress': 'Stress',
        'keine': 'Keine'
    };
    
    let html = '<p><strong>Top 5 Alltags-Herausforderungen:</strong></p>';
    
    sorted.forEach(([key, count]) => {
        const label = labels[key] || key;
        html += `
            <div class="stat-bar">
                <div class="stat-label">
                    <span>${label}</span>
                    <span>${count} Personen</span>
                </div>
                <div class="stat-progress">
                    <div class="stat-fill" style="width: ${Math.min(count * 10, 100)}%"></div>
                </div>
            </div>
        `;
    });
    
    contentDiv.innerHTML = html;
    statsDiv.style.display = 'block';
}

// Step Navigation
function goToStep(step) {
    // Aktuellen Step deaktivieren
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.progress-step').forEach(el => el.classList.remove('active'));
    
    // Neuen Step aktivieren
    document.getElementById(`step${step}`).classList.add('active');
    document.querySelector(`.progress-step[data-step="${step}"]`).classList.add('active');
    
    // Completed Steps markieren
    for (let i = 1; i < step; i++) {
        document.querySelector(`.progress-step[data-step="${i}"]`).classList.add('completed');
    }
    
    // Progress Line
    const progress = ((step - 1) / 4) * 100;
    document.getElementById('progressLine').style.width = `${progress}%`;
    
    currentStep = step;
    
    // Nach oben scrollen
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Quick Select Buttons
document.querySelectorAll('.quick-select').forEach(container => {
    container.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const parent = this.closest('.quick-select');
            parent.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            
            const hiddenInput = parent.nextElementSibling;
            if (hiddenInput && hiddenInput.tagName === 'INPUT') {
                hiddenInput.value = this.dataset.value;
            }
        });
    });
});

// Step 1: Stimmung
document.querySelectorAll('input[name="mood"]').forEach(radio => {
    radio.addEventListener('change', function() {
        formData.mood = this.value;
        showMoodStats(this.value);
    });
});

document.getElementById('step1Next').addEventListener('click', () => {
    if (!formData.mood) {
        alert('Bitte wähle deine aktuelle Stimmung aus.');
        return;
    }
    goToStep(2);
});

// Step 2: Lehrbetrieb
document.querySelector('[data-value="nein"]').addEventListener('click', () => {
    document.getElementById('companyProblemsDetails').style.display = 'none';
});

['kleine', 'grosse'].forEach(value => {
    document.querySelector(`[data-value="${value}"]`).addEventListener('click', () => {
        document.getElementById('companyProblemsDetails').style.display = 'block';
    });
});

document.getElementById('step2Next').addEventListener('click', () => {
    const problemsCompany = document.getElementById('problemsCompany').value;
    if (!problemsCompany) {
        alert('Bitte beantworte die Frage zu Problemen im Lehrbetrieb.');
        return;
    }
    
    formData.problemsCompany = problemsCompany;
    formData.companyIssues = Array.from(document.querySelectorAll('#companyIssuesGroup input:checked'))
        .map(cb => cb.value);
    
    showCompanyStats();
    goToStep(3);
});

// Step 3: Schule
document.getElementById('step3Next').addEventListener('click', () => {
    const schoolSituation = document.getElementById('schoolSituation').value;
    if (!schoolSituation) {
        alert('Bitte beantworte, wie es in der Schule läuft.');
        return;
    }
    
    formData.schoolSituation = schoolSituation;
    formData.schoolIssues = Array.from(document.querySelectorAll('#schoolIssuesGroup input:checked'))
        .map(cb => cb.value);
    
    showSchoolStats();
    goToStep(4);
});

// Step 4: Alltag
document.getElementById('step4Next').addEventListener('click', async () => {
    const organization = document.getElementById('organization').value;
    if (!organization) {
        alert('Bitte bewerte deine Alltagsorganisation.');
        return;
    }
    
    formData.organizationRating = organization;
    formData.privateIssues = Array.from(document.querySelectorAll('#privateIssuesGroup input:checked'))
        .map(cb => cb.value);
    
    showPrivateStats();
    
    // Daten speichern
    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            stimmungsbarometer: formData,
            stimmungsbarometer_timestamp: serverTimestamp()
        });
        
        // Zu Step 5
        goToStep(5);
        document.getElementById('finalCode').textContent = userCode;
        
        // Countdown
        let countdown = 3;
        const countdownEl = document.getElementById('countdown');
        const interval = setInterval(() => {
            countdown--;
            countdownEl.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(interval);
                window.location.href = 'learn1.html';
            }
        }, 1000);
        
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        alert('Fehler beim Speichern. Bitte versuche es erneut.');
    }
});

// Zurück-Buttons
document.querySelectorAll('.btn-prev').forEach(btn => {
    btn.addEventListener('click', function() {
        const prevStep = parseInt(this.dataset.prev);
        if (prevStep) {
            goToStep(prevStep);
        }
    });
});

// Initial laden
loadAllSessions();
