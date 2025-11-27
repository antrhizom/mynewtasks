import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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

let allData = [];

// Daten laden
async function loadData() {
    try {
        // Lade alle Sessions die Stimmungsbarometer-Daten haben
        const q = query(collection(db, 'sessions'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        allData = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Nur Sessions mit Stimmungsbarometer-Daten
            if (data.stimmungsbarometer) {
                allData.push({
                    id: doc.id,
                    code: data.code,
                    timestamp: data.stimmungsbarometer_timestamp || data.createdAt,
                    ...data.stimmungsbarometer
                });
            }
        });
        
        console.log(`${allData.length} Stimmungsbarometer-Antworten geladen`);
        analyzeData();
        
    } catch (error) {
        console.error('Fehler beim Laden:', error);
        alert('Fehler beim Laden der Daten. Prüfe die Firestore-Berechtigungen.');
    }
}

// Daten analysieren
function analyzeData() {
    if (allData.length === 0) {
        document.getElementById('totalResponses').textContent = '0';
        return;
    }
    
    // Gesamtanzahl
    document.getElementById('totalResponses').textContent = allData.length;
    
    // Durchschnittsstimmung
    const moodValues = {
        'sehr-gut': 5,
        'gut': 4,
        'mittel': 3,
        'nicht-so-gut': 2,
        'schlecht': 1
    };
    
    const moods = allData.map(d => moodValues[d.mood] || 0).filter(v => v > 0);
    const avgMood = moods.length > 0 ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : 0;
    document.getElementById('avgMood').textContent = `${avgMood}/5`;
    
    // Probleme
    const problemCount = allData.filter(d => 
        d.problemsCompany === 'kleine' || d.problemsCompany === 'grosse'
    ).length;
    document.getElementById('problemCount').textContent = `${problemCount} (${Math.round(problemCount/allData.length*100)}%)`;
    
    // Unterstützungsbedarf
    const needSupport = allData.filter(d => 
        d.supportNeeds && d.supportNeeds.length > 0 && !d.supportNeeds.includes('keine')
    ).length;
    document.getElementById('needSupport').textContent = `${needSupport} (${Math.round(needSupport/allData.length*100)}%)`;
    
    // Charts erstellen
    createMoodChart();
    createIssuesCharts();
    createSupportChart();
    createWorkLifeStats();
}

// Stimmungs-Chart
function createMoodChart() {
    const container = document.getElementById('moodChart');
    const moodCounts = {
        'sehr-gut': 0,
        'gut': 0,
        'mittel': 0,
        'nicht-so-gut': 0,
        'schlecht': 0
    };
    
    allData.forEach(d => {
        if (d.mood && moodCounts.hasOwnProperty(d.mood)) {
            moodCounts[d.mood]++;
        }
    });
    
    const labels = {
        'sehr-gut': '😄 Sehr gut',
        'gut': '🙂 Gut',
        'mittel': '😐 Mittel',
        'nicht-so-gut': '😟 Nicht so gut',
        'schlecht': '😢 Schlecht'
    };
    
    let html = '<div class="bar-chart">';
    const maxCount = Math.max(...Object.values(moodCounts));
    
    Object.entries(moodCounts).forEach(([key, count]) => {
        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const colorClass = key === 'sehr-gut' || key === 'gut' ? 'positive' : 
                          key === 'mittel' ? 'neutral' : 'negative';
        
        html += `
            <div class="bar-item">
                <div class="bar-label">${labels[key]}</div>
                <div class="bar-wrapper">
                    <div class="bar ${colorClass}" style="width: ${percentage}%"></div>
                </div>
                <div class="bar-value">${count} (${Math.round(count/allData.length*100)}%)</div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Problem-Charts
function createIssuesCharts() {
    // Lehrbetrieb
    const companyCounts = {};
    allData.forEach(d => {
        if (d.companyIssues) {
            d.companyIssues.forEach(issue => {
                companyCounts[issue] = (companyCounts[issue] || 0) + 1;
            });
        }
    });
    renderBarChart('companyIssuesChart', companyCounts, {
        'beziehung-berufsbildner': 'Beziehung zur Berufsbildner:in',
        'arbeitsklima': 'Arbeitsklima im Team',
        'ueberforderung': 'Überforderung mit Aufgaben',
        'unterforderung': 'Unterforderung',
        'arbeitszeiten': 'Arbeitszeiten / Überstunden',
        'kommunikation': 'Kommunikationsprobleme',
        'erwartungen': 'Unklare Erwartungen',
        'konflikte': 'Konflikte mit Kolleg:innen',
        'andere': 'Andere'
    });
    
    // Berufsschule
    const schoolCounts = {};
    allData.forEach(d => {
        if (d.schoolIssues) {
            d.schoolIssues.forEach(issue => {
                schoolCounts[issue] = (schoolCounts[issue] || 0) + 1;
            });
        }
    });
    renderBarChart('schoolIssuesChart', schoolCounts, {
        'neue-mitschueler': 'Neue Mitschüler:innen',
        'lernstoff': 'Schwieriger Lernstoff',
        'lerntempo': 'Zu schnelles Lerntempo',
        'lehrpersonen': 'Beziehung zu Lehrpersonen',
        'organisation': 'Schulorganisation',
        'hausaufgaben': 'Hausaufgaben / Zeitmanagement',
        'pruefungen': 'Prüfungsangst / -stress',
        'anfahrt': 'Schulweg / Anfahrt',
        'keine': 'Keine Schwierigkeiten'
    });
    
    // Privatleben
    const privateCounts = {};
    allData.forEach(d => {
        if (d.privateIssues) {
            d.privateIssues.forEach(issue => {
                privateCounts[issue] = (privateCounts[issue] || 0) + 1;
            });
        }
    });
    renderBarChart('privateIssuesChart', privateCounts, {
        'zeitmanagement': 'Zeitmanagement',
        'haushalt': 'Haushalt',
        'finanzen': 'Finanzen',
        'schlaf': 'Genug Schlaf',
        'ernaehrung': 'Gesunde Ernährung',
        'soziales': 'Zeit für Freunde/Familie',
        'hobbys': 'Zeit für Hobbys',
        'stress': 'Stress-Management',
        'selbststaendigkeit': 'Selbstständigkeit',
        'keine': 'Keine Herausforderungen'
    });
}

// Unterstützungs-Chart
function createSupportChart() {
    const supportCounts = {};
    allData.forEach(d => {
        if (d.supportNeeds) {
            d.supportNeeds.forEach(need => {
                supportCounts[need] = (supportCounts[need] || 0) + 1;
            });
        }
    });
    
    renderBarChart('supportNeedsChart', supportCounts, {
        'lernhilfe': 'Lernhilfe / Nachhilfe',
        'zeitmanagement-tipps': 'Zeitmanagement-Tipps',
        'gespraech': 'Gespräch mit Vertrauensperson',
        'konfliktloesung': 'Hilfe bei Konflikten',
        'organisation-tipps': 'Organisations-Tipps',
        'stress-management': 'Stress-Management',
        'finanzberatung': 'Finanzberatung',
        'austausch': 'Austausch mit anderen',
        'keine': 'Keine Unterstützung nötig'
    });
}

// Work-Life-Balance Statistiken
function createWorkLifeStats() {
    const overloaded = allData.filter(d => 
        d.workload === 'oft' || d.workload === 'staendig'
    ).length;
    document.getElementById('overloadedCount').textContent = `${overloaded} (${Math.round(overloaded/allData.length*100)}%)`;
    
    const freetimeLabels = {
        'weniger-5': '<5h',
        '5-10': '5-10h',
        '10-15': '10-15h',
        '15-20': '15-20h',
        'mehr-20': '>20h'
    };
    
    const freetimeCounts = {};
    allData.forEach(d => {
        if (d.freetime) {
            freetimeCounts[d.freetime] = (freetimeCounts[d.freetime] || 0) + 1;
        }
    });
    
    const mostCommon = Object.entries(freetimeCounts).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('avgFreetime').textContent = mostCommon ? freetimeLabels[mostCommon[0]] : '--';
}

// Generischer Bar-Chart Renderer
function renderBarChart(containerId, counts, labels) {
    const container = document.getElementById(containerId);
    
    if (Object.keys(counts).length === 0) {
        container.innerHTML = '<p class="no-data">Keine Daten vorhanden</p>';
        return;
    }
    
    const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxCount = sortedEntries[0][1];
    
    let html = '<div class="bar-chart">';
    
    sortedEntries.forEach(([key, count]) => {
        const percentage = (count / maxCount) * 100;
        const label = labels[key] || key;
        
        html += `
            <div class="bar-item">
                <div class="bar-label">${label}</div>
                <div class="bar-wrapper">
                    <div class="bar" style="width: ${percentage}%"></div>
                </div>
                <div class="bar-value">${count} (${Math.round(count/allData.length*100)}%)</div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Details anzeigen
document.getElementById('showDetailsBtn').addEventListener('click', () => {
    const container = document.getElementById('detailsContainer');
    const btn = document.getElementById('showDetailsBtn');
    
    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        btn.textContent = 'Textantworten verbergen';
        renderFeedbackList();
    } else {
        container.classList.add('hidden');
        btn.textContent = 'Alle Textantworten anzeigen';
    }
});

function renderFeedbackList() {
    const container = document.getElementById('feedbackList');
    
    const feedbackData = allData.filter(d => 
        (d.companyDetails && d.companyDetails.length > 0) ||
        (d.schoolDetails && d.schoolDetails.length > 0) ||
        (d.privateDetails && d.privateDetails.length > 0) ||
        (d.finalFeedback && d.finalFeedback.length > 0)
    );
    
    if (feedbackData.length === 0) {
        container.innerHTML = '<p class="no-data">Keine Textantworten vorhanden</p>';
        return;
    }
    
    let html = '';
    feedbackData.forEach((d, index) => {
        const date = d.timestamp ? new Date(d.timestamp.toDate ? d.timestamp.toDate() : d.timestamp).toLocaleDateString('de-CH') : 'Unbekannt';
        const code = d.code || 'N/A';
        const moodEmoji = {
            'sehr-gut': '😄',
            'gut': '🙂',
            'mittel': '😐',
            'nicht-so-gut': '😟',
            'schlecht': '😢'
        }[d.mood] || '❓';
        
        html += `
            <div class="feedback-card">
                <div class="feedback-header">
                    <span class="feedback-mood">${moodEmoji}</span>
                    <span class="feedback-code">Code: ${code}</span>
                    <span class="feedback-date">${date}</span>
                </div>
                <div class="feedback-content">
        `;
        
        if (d.companyDetails) {
            html += `<div class="feedback-section">
                <strong>💼 Lehrbetrieb:</strong>
                <p>${d.companyDetails}</p>
            </div>`;
        }
        
        if (d.schoolDetails) {
            html += `<div class="feedback-section">
                <strong>🎓 Berufsschule:</strong>
                <p>${d.schoolDetails}</p>
            </div>`;
        }
        
        if (d.privateDetails) {
            html += `<div class="feedback-section">
                <strong>🏠 Privatleben:</strong>
                <p>${d.privateDetails}</p>
            </div>`;
        }
        
        if (d.finalFeedback) {
            html += `<div class="feedback-section">
                <strong>💬 Freies Feedback:</strong>
                <p>${d.finalFeedback}</p>
            </div>`;
        }
        
        html += `
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// CSV Export
document.getElementById('exportCSVBtn').addEventListener('click', () => {
    if (allData.length === 0) {
        alert('Keine Daten zum Exportieren vorhanden.');
        return;
    }
    
    let csv = 'Code,Datum,Stimmung,Probleme Betrieb,Betrieb Details,Schulsituation,Schule Details,Organisation,Privat Details,Überlastung,Freizeit,Support Kenntnisse,Freies Feedback\n';
    
    allData.forEach(d => {
        const row = [
            d.code || '',
            d.timestamp || '',
            d.mood || '',
            d.problemsCompany || '',
            (d.companyDetails || '').replace(/"/g, '""'),
            d.schoolSituation || '',
            (d.schoolDetails || '').replace(/"/g, '""'),
            d.organizationRating || '',
            (d.privateDetails || '').replace(/"/g, '""'),
            d.workload || '',
            d.freetime || '',
            d.supportKnowledge || '',
            (d.finalFeedback || '').replace(/"/g, '""')
        ];
        
        csv += '"' + row.join('","') + '"\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stimmungsbarometer_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
});

// PDF Export (vereinfacht)
document.getElementById('exportPDFBtn').addEventListener('click', () => {
    alert('PDF-Export: Bitte nutze "Drucken" (Ctrl+P) und wähle "Als PDF speichern"');
    window.print();
});

// Refresh Button
document.getElementById('refreshBtn').addEventListener('click', loadData);

// Initial laden
loadData();
