import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, doc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase Konfiguration - GLEICHE WIE IN INDEX.HTML
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

// Session-Daten laden
const userCode = localStorage.getItem('berufseinstieg_code');
const sessionId = localStorage.getItem('berufseinstieg_session');

if (!userCode || !sessionId) {
    alert('Keine aktive Sitzung gefunden. Du wirst zur Startseite weitergeleitet.');
    window.location.href = 'index.html';
}

// Code in der Überschrift anzeigen
document.querySelector('.subtitle').textContent = `Dein Code: ${userCode} - Wie geht es dir in deiner Lehre?`;

// Code auch im Intro anzeigen
document.getElementById('displayCode').textContent = userCode;

// Zeichenzähler für Textfelder
function setupCharCounter(textareaId, counterId) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    
    if (textarea && counter) {
        textarea.addEventListener('input', () => {
            counter.textContent = textarea.value.length;
        });
    }
}

setupCharCounter('companyDetails', 'companyChars');
setupCharCounter('schoolDetails', 'schoolChars');
setupCharCounter('privateDetails', 'privateChars');
setupCharCounter('finalFeedback', 'finalChars');

// Conditional anzeigen bei Problemen im Betrieb
const problemsRadios = document.querySelectorAll('input[name="problems-company"]');
const companyProblemsDetails = document.getElementById('companyProblemsDetails');

problemsRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.value === 'kleine' || radio.value === 'grosse') {
            companyProblemsDetails.style.display = 'block';
        } else {
            companyProblemsDetails.style.display = 'none';
        }
    });
});

// Formular-Daten sammeln
function collectFormData() {
    const data = {
        timestamp: new Date().toISOString(),
        
        // 1. Allgemeine Stimmung
        mood: document.querySelector('input[name="mood"]:checked')?.value || null,
        
        // 2. Lehrbetrieb
        problemsCompany: document.querySelector('input[name="problems-company"]:checked')?.value || null,
        companyIssues: Array.from(document.querySelectorAll('input[name="company-issues"]:checked'))
            .map(cb => cb.value),
        companyDetails: document.getElementById('companyDetails').value.trim(),
        
        // 3. Berufsschule
        schoolSituation: document.querySelector('input[name="school-situation"]:checked')?.value || null,
        schoolIssues: Array.from(document.querySelectorAll('input[name="school-issues"]:checked'))
            .map(cb => cb.value),
        schoolDetails: document.getElementById('schoolDetails').value.trim(),
        
        // 4. Privatleben & Organisation
        organizationRating: document.querySelector('input[name="organization"]:checked')?.value || null,
        privateIssues: Array.from(document.querySelectorAll('input[name="private-issues"]:checked'))
            .map(cb => cb.value),
        privateDetails: document.getElementById('privateDetails').value.trim(),
        
        // 5. Work-Life-Balance
        workload: document.querySelector('input[name="workload"]:checked')?.value || null,
        freetime: document.querySelector('input[name="freetime"]:checked')?.value || null,
        
        // 6. Unterstützung
        supportKnowledge: document.querySelector('input[name="support-knowledge"]:checked')?.value || null,
        supportNeeds: Array.from(document.querySelectorAll('input[name="support-needs"]:checked'))
            .map(cb => cb.value),
        
        // 7. Freies Feedback
        finalFeedback: document.getElementById('finalFeedback').value.trim()
    };
    
    return data;
}

// Validierung
function validateForm() {
    const mood = document.querySelector('input[name="mood"]:checked');
    
    if (!mood) {
        alert('Bitte wähle aus, wie du dich aktuell fühlst (Frage 1).');
        return false;
    }
    
    return true;
}

// Submit Button
const submitBtn = document.getElementById('submitBtn');
const submitSuccess = document.getElementById('submitSuccess');

submitBtn.addEventListener('click', async () => {
    if (!validateForm()) {
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird gesendet...';
    
    try {
        const data = collectFormData();
        
        // In der bestehenden Session speichern (nicht neue Collection!)
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            stimmungsbarometer: data,
            stimmungsbarometer_timestamp: serverTimestamp()
        });
        
        // Erfolg anzeigen
        submitSuccess.classList.remove('hidden');
        submitBtn.style.display = 'none';
        
        // Code in Erfolgs-Nachricht anzeigen
        document.getElementById('successCode').textContent = userCode;
        
        // Nach oben scrollen
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Nach 3 Sekunden zu Lernseite 1 weiterleiten
        setTimeout(() => {
            window.location.href = 'learn1.html';
        }, 3000);
        
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        alert('Fehler beim Senden. Bitte versuche es erneut oder kontaktiere deine Lehrperson.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Stimmungsbarometer absenden';
    }
});

// Info-Tooltips (optional)
document.querySelectorAll('.mood-card, .checkbox-group label').forEach(element => {
    element.addEventListener('click', function() {
        // Sanfte Animation beim Klicken
        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 100);
    });
});

// Speichern in LocalStorage als Backup (falls Verbindung abbricht)
function saveToLocalStorage() {
    const data = collectFormData();
    localStorage.setItem('stimmungsbarometer_backup', JSON.stringify(data));
}

// Alle 30 Sekunden automatisch speichern
setInterval(saveToLocalStorage, 30000);

// Beim Verlassen der Seite warnen, falls nicht abgesendet
window.addEventListener('beforeunload', (e) => {
    if (!submitSuccess.classList.contains('hidden')) {
        // Bereits abgesendet, keine Warnung
        return;
    }
    
    const mood = document.querySelector('input[name="mood"]:checked');
    if (mood) {
        // Benutzer hat begonnen auszufüllen
        e.preventDefault();
        e.returnValue = 'Du hast das Formular noch nicht abgesendet. Möchtest du wirklich die Seite verlassen?';
    }
});
