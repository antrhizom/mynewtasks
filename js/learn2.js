import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, updateDoc, increment } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyAcf7uz3Q5MZWOqIn2ul94hJfJ0M9Yxt7I",
  authDomain: "berufseinstieg-abu.firebaseapp.com",
  projectId: "berufseinstieg-abu",
  storageBucket: "berufseinstieg-abu.firebasestorage.app",
  messagingSenderId: "270482961754",
  appId: "1:270482961754:web:b35f38fbec64796ca36f63"
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

document.getElementById('footerCode').textContent = userCode;

// Zeittracking
let startTime = Date.now();
let audioPlayed = false;
let videoWatched = false;

// Seite als besucht markieren
async function markPageVisited() {
    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            'activities.learn2.visited': true
        });
    } catch (error) {
        console.error('Fehler:', error);
    }
}

// Zeit speichern
async function saveTimeSpent() {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            'activities.learn2.timeSpent': increment(timeSpent)
        });
    } catch (error) {
        console.error('Fehler:', error);
    }
}

// Audio-Event
const audio2 = document.getElementById('audio2');
if (audio2) {
    audio2.addEventListener('play', async () => {
        if (!audioPlayed) {
            audioPlayed = true;
            try {
                const sessionRef = doc(db, 'sessions', sessionId);
                await updateDoc(sessionRef, {
                    'activities.learn2.audioPlayed': true
                });
            } catch (error) {
                console.error('Fehler:', error);
            }
        }
    });
}

// Video abspielen
window.playVideo = async function(videoId) {
    const videoElement = document.getElementById(videoId);
    if (videoElement) {
        videoElement.classList.add('played');
        videoElement.innerHTML = '<p>✅ Video wurde abgespielt</p><p>In einer echten Implementierung würde hier das Video angezeigt.</p>';
        
        if (!videoWatched && videoId === 'video2') {
            videoWatched = true;
            try {
                const sessionRef = doc(db, 'sessions', sessionId);
                await updateDoc(sessionRef, {
                    'activities.learn2.videoWatched': true
                });
            } catch (error) {
                console.error('Fehler:', error);
            }
        }
    }
};

// Aufgabe 3 - Fallbeispiel
const task3Input = document.getElementById('task3');
const charCount3 = document.getElementById('charCount3');
const saveTask3Btn = document.getElementById('saveTask3');

task3Input.addEventListener('input', () => {
    charCount3.textContent = task3Input.value.length;
});

saveTask3Btn.addEventListener('click', async () => {
    const text = task3Input.value.trim();
    
    if (text.length < 100) {
        alert('Bitte schreibe mindestens 100 Zeichen.');
        return;
    }

    saveTask3Btn.disabled = true;
    saveTask3Btn.textContent = 'Wird gespeichert...';

    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            'activities.learn2.tasksCompleted': increment(1),
            'activities.learn2.task3Text': text
        });
        
        saveTask3Btn.textContent = '✓ Gespeichert';
        saveTask3Btn.style.background = '#10b981';
        
        setTimeout(() => {
            saveTask3Btn.disabled = false;
            saveTask3Btn.textContent = 'Antwort speichern';
            saveTask3Btn.style.background = '';
        }, 2000);
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Speichern.');
        saveTask3Btn.disabled = false;
        saveTask3Btn.textContent = 'Antwort speichern';
    }
});

// Aufgabe 4 - Ziele
const task4Input = document.getElementById('task4');
const charCount4 = document.getElementById('charCount4');
const saveTask4Btn = document.getElementById('saveTask4');

task4Input.addEventListener('input', () => {
    charCount4.textContent = task4Input.value.length;
});

saveTask4Btn.addEventListener('click', async () => {
    const text = task4Input.value.trim();
    
    if (text.length < 80) {
        alert('Bitte schreibe mindestens 80 Zeichen.');
        return;
    }

    saveTask4Btn.disabled = true;
    saveTask4Btn.textContent = 'Wird gespeichert...';

    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            'activities.learn2.tasksCompleted': increment(1),
            'activities.learn2.task4Text': text
        });
        
        saveTask4Btn.textContent = '✓ Gespeichert';
        saveTask4Btn.style.background = '#10b981';
        
        setTimeout(() => {
            saveTask4Btn.disabled = false;
            saveTask4Btn.textContent = 'Ziele speichern';
            saveTask4Btn.style.background = '';
        }, 2000);
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Speichern.');
        saveTask4Btn.disabled = false;
        saveTask4Btn.textContent = 'Ziele speichern';
    }
});

// Aufgabe 5 - Selbstreflexion (Ratings)
const saveRatingsBtn = document.getElementById('saveRatings');

saveRatingsBtn.addEventListener('click', async () => {
    const r1 = document.querySelector('input[name="r1"]:checked');
    const r2 = document.querySelector('input[name="r2"]:checked');
    const r3 = document.querySelector('input[name="r3"]:checked');
    const r4 = document.querySelector('input[name="r4"]:checked');

    if (!r1 || !r2 || !r3 || !r4) {
        alert('Bitte bewerte alle vier Kompetenzen.');
        return;
    }

    saveRatingsBtn.disabled = true;
    saveRatingsBtn.textContent = 'Wird gespeichert...';

    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            'activities.learn2.tasksCompleted': increment(1),
            'activities.learn2.ratings': {
                punctuality: parseInt(r1.value),
                teamwork: parseInt(r2.value),
                independence: parseInt(r3.value),
                criticism: parseInt(r4.value)
            }
        });
        
        saveRatingsBtn.textContent = '✓ Gespeichert';
        saveRatingsBtn.style.background = '#10b981';
        
        setTimeout(() => {
            saveRatingsBtn.disabled = false;
            saveRatingsBtn.textContent = 'Bewertung speichern';
            saveRatingsBtn.style.background = '';
        }, 2000);
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Speichern.');
        saveRatingsBtn.disabled = false;
        saveRatingsBtn.textContent = 'Bewertung speichern';
    }
});

// Initialisierung
markPageVisited();
window.addEventListener('beforeunload', saveTimeSpent);
setInterval(saveTimeSpent, 30000);
