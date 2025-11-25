import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, getDoc, updateDoc, increment } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase Konfiguration - GLEICHE WIE IN INDEX.HTML
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

// Code im Footer anzeigen
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
            'activities.learn1.visited': true
        });
    } catch (error) {
        console.error('Fehler beim Markieren der Seite:', error);
    }
}

// Zeit beim Verlassen der Seite speichern
async function saveTimeSpent() {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000); // in Sekunden
    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            'activities.learn1.timeSpent': increment(timeSpent)
        });
    } catch (error) {
        console.error('Fehler beim Speichern der Zeit:', error);
    }
}

// Audio-Event-Listener
const audio1 = document.getElementById('audio1');
if (audio1) {
    audio1.addEventListener('play', async () => {
        if (!audioPlayed) {
            audioPlayed = true;
            try {
                const sessionRef = doc(db, 'sessions', sessionId);
                await updateDoc(sessionRef, {
                    'activities.learn1.audioPlayed': true
                });
            } catch (error) {
                console.error('Fehler beim Speichern des Audio-Status:', error);
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
        
        if (!videoWatched && videoId === 'video1') {
            videoWatched = true;
            try {
                const sessionRef = doc(db, 'sessions', sessionId);
                await updateDoc(sessionRef, {
                    'activities.learn1.videoWatched': true
                });
            } catch (error) {
                console.error('Fehler beim Speichern des Video-Status:', error);
            }
        }
    }
};

// Aufgabe 1 - Textfeld
const task1Input = document.getElementById('task1');
const charCount1 = document.getElementById('charCount1');
const saveTask1Btn = document.getElementById('saveTask1');

task1Input.addEventListener('input', () => {
    charCount1.textContent = task1Input.value.length;
});

saveTask1Btn.addEventListener('click', async () => {
    const text = task1Input.value.trim();
    
    if (text.length < 50) {
        alert('Bitte schreibe mindestens 50 Zeichen.');
        return;
    }

    saveTask1Btn.disabled = true;
    saveTask1Btn.textContent = 'Wird gespeichert...';

    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            'activities.learn1.tasksCompleted': increment(1),
            'activities.learn1.task1Text': text
        });
        
        saveTask1Btn.textContent = '✓ Gespeichert';
        saveTask1Btn.style.background = '#10b981';
        
        setTimeout(() => {
            saveTask1Btn.disabled = false;
            saveTask1Btn.textContent = 'Antwort speichern';
            saveTask1Btn.style.background = '';
        }, 2000);
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        alert('Fehler beim Speichern. Bitte versuche es erneut.');
        saveTask1Btn.disabled = false;
        saveTask1Btn.textContent = 'Antwort speichern';
    }
});

// Quiz - Aufgabe 2
const checkQuizBtn = document.getElementById('checkQuiz');
const quizResult = document.getElementById('quizResult');

checkQuizBtn.addEventListener('click', async () => {
    const q1 = document.querySelector('input[name="q1"]:checked');
    const q2 = document.querySelector('input[name="q2"]:checked');
    const q3 = document.querySelector('input[name="q3"]:checked');

    if (!q1 || !q2 || !q3) {
        alert('Bitte beantworte alle Fragen.');
        return;
    }

    // Richtige Antworten: b, c, b
    const correct1 = q1.value === 'b';
    const correct2 = q2.value === 'c';
    const correct3 = q3.value === 'b';
    
    const totalCorrect = (correct1 ? 1 : 0) + (correct2 ? 1 : 0) + (correct3 ? 1 : 0);

    quizResult.classList.remove('hidden');
    
    if (totalCorrect === 3) {
        quizResult.className = 'quiz-result correct';
        quizResult.innerHTML = '✅ Ausgezeichnet! Alle Antworten sind richtig! (3/3)';
    } else {
        quizResult.className = 'quiz-result incorrect';
        quizResult.innerHTML = `⚠️ Du hast ${totalCorrect} von 3 Fragen richtig beantwortet.<br><br>`;
        quizResult.innerHTML += '<strong>Richtige Antworten:</strong><br>';
        quizResult.innerHTML += '1. 1-3 Monate<br>';
        quizResult.innerHTML += '2. Privates Freizeitverhalten<br>';
        quizResult.innerHTML += '3. Hausratversicherung<br>';
    }

    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            'activities.learn1.tasksCompleted': increment(1),
            'activities.learn1.quizScore': totalCorrect
        });
    } catch (error) {
        console.error('Fehler beim Speichern des Quiz-Ergebnisses:', error);
    }
});

// Beim Laden der Seite
markPageVisited();

// Beim Verlassen der Seite Zeit speichern
window.addEventListener('beforeunload', saveTimeSpent);

// Periodisch Zeit speichern (alle 30 Sekunden)
setInterval(saveTimeSpent, 30000);
