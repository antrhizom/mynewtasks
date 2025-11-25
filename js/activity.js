import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
    alert('Keine aktive Sitzung gefunden.');
    window.location.href = 'index.html';
}

document.getElementById('reportCode').textContent = userCode;
document.getElementById('footerCode').textContent = userCode;

// Aktivitätsdaten laden und anzeigen
async function loadActivityData() {
    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        const sessionSnap = await getDoc(sessionRef);

        if (!sessionSnap.exists()) {
            alert('Session nicht gefunden.');
            return;
        }

        const data = sessionSnap.data();
        const activities = data.activities;

        // Zeitaufwand berechnen
        const learn1Time = Math.round(activities.learn1.timeSpent / 60) || 0;
        const learn2Time = Math.round(activities.learn2.timeSpent / 60) || 0;
        const totalTime = learn1Time + learn2Time;

        document.getElementById('learn1Time').textContent = `${learn1Time} Min.`;
        document.getElementById('learn2Time').textContent = `${learn2Time} Min.`;
        document.getElementById('totalTime').textContent = `${totalTime} Min.`;

        // Medien-Status
        updateCheckIcon('audio1Check', activities.learn1.audioPlayed);
        updateCheckIcon('video1Check', activities.learn1.videoWatched);
        updateCheckIcon('audio2Check', activities.learn2.audioPlayed);
        updateCheckIcon('video2Check', activities.learn2.videoWatched);

        // Medien-Fortschritt
        let mediaCount = 0;
        if (activities.learn1.audioPlayed) mediaCount++;
        if (activities.learn1.videoWatched) mediaCount++;
        if (activities.learn2.audioPlayed) mediaCount++;
        if (activities.learn2.videoWatched) mediaCount++;
        
        const mediaPercentage = (mediaCount / 4) * 100;
        document.getElementById('mediaProgress').style.width = `${mediaPercentage}%`;
        document.getElementById('mediaPercentage').textContent = `${mediaPercentage}%`;

        // Aufgaben-Status
        const task1Completed = activities.learn1.task1Text && activities.learn1.task1Text.length > 0;
        const task2Completed = activities.learn1.quizScore !== undefined;
        const task3Completed = activities.learn2.task3Text && activities.learn2.task3Text.length > 0;
        const task4Completed = activities.learn2.task4Text && activities.learn2.task4Text.length > 0;
        const task5Completed = activities.learn2.ratings !== undefined;

        updateTaskStatus('task1Status', task1Completed);
        updateTaskStatus('task2Status', task2Completed);
        updateTaskStatus('task3Status', task3Completed);
        updateTaskStatus('task4Status', task4Completed);
        updateTaskStatus('task5Status', task5Completed);

        // Aufgaben-Fortschritt
        let taskCount = 0;
        if (task1Completed) taskCount++;
        if (task2Completed) taskCount++;
        if (task3Completed) taskCount++;
        if (task4Completed) taskCount++;
        if (task5Completed) taskCount++;

        const taskPercentage = (taskCount / 5) * 100;
        document.getElementById('taskProgress').style.width = `${taskPercentage}%`;
        document.getElementById('taskPercentage').textContent = `${taskPercentage}%`;

        // Gesamtbewertung berechnen
        let score = 0;
        
        // Zeit (max 20 Punkte) - mindestens 30 Minuten für volle Punktzahl
        score += Math.min(20, (totalTime / 30) * 20);
        
        // Medien (20 Punkte)
        score += mediaCount * 5;
        
        // Aufgaben (60 Punkte)
        score += taskCount * 12;

        const finalScore = Math.round(score);
        document.getElementById('overallScore').querySelector('.score-value').textContent = finalScore;

        // Bewertungstext
        let scoreText = '';
        if (finalScore >= 90) {
            scoreText = '🌟 Ausgezeichnet! Du hast alle Inhalte intensiv bearbeitet und zeigst hohes Engagement.';
        } else if (finalScore >= 75) {
            scoreText = '👍 Sehr gut! Du hast die meisten Inhalte erfolgreich bearbeitet.';
        } else if (finalScore >= 60) {
            scoreText = '✓ Gut gemacht! Du hast die Grundlagen erfasst. Einige Bereiche könnten noch vertieft werden.';
        } else if (finalScore >= 40) {
            scoreText = '⚠️ Teilweise erfüllt. Versuche, mehr Aufgaben zu bearbeiten und die Medien anzusehen.';
        } else {
            scoreText = '❌ Noch nicht ausreichend. Bitte bearbeite die Lerneinheit vollständig.';
        }
        document.getElementById('scoreText').textContent = scoreText;

        // Kommentar generieren
        let comment = '<p><strong>Zusammenfassung:</strong></p>';
        comment += `<p>Du hast insgesamt ${totalTime} Minuten mit dieser Lerneinheit verbracht. `;
        comment += `Du hast ${taskCount} von 5 Aufgaben bearbeitet und ${mediaCount} von 4 Medien konsumiert.</p>`;
        
        if (finalScore >= 75) {
            comment += '<p>Deine Aktivität zeigt, dass du dich ernsthaft mit dem Thema Berufseinstieg auseinandergesetzt hast. Weiter so!</p>';
        } else if (finalScore >= 50) {
            comment += '<p>Du hast einen guten Start gemacht. Versuche beim nächsten Mal, alle Aufgaben zu bearbeiten, um das Maximum aus der Lerneinheit herauszuholen.</p>';
        } else {
            comment += '<p>Um die Lerneinheit vollständig abzuschliessen, solltest du die fehlenden Aufgaben noch bearbeiten.</p>';
        }

        document.getElementById('finalComment').innerHTML = comment;

        // Session als completed markieren
        if (finalScore >= 60) {
            await updateDoc(sessionRef, {
                completed: true,
                finalScore: finalScore
            });
        }

    } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        alert('Fehler beim Laden der Aktivitätsdaten.');
    }
}

function updateCheckIcon(elementId, completed) {
    const element = document.getElementById(elementId);
    if (completed) {
        element.textContent = '✅';
    } else {
        element.textContent = '⬜';
    }
}

function updateTaskStatus(elementId, completed) {
    const element = document.getElementById(elementId);
    if (completed) {
        element.textContent = 'Erledigt';
        element.classList.remove('incomplete');
        element.classList.add('completed');
    } else {
        element.textContent = 'Nicht bearbeitet';
        element.classList.remove('completed');
        element.classList.add('incomplete');
    }
}

// Daten aktualisieren
document.getElementById('refreshBtn').addEventListener('click', () => {
    loadActivityData();
});

// PDF herunterladen
document.getElementById('downloadBtn').addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Überschrift
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text('Aktivitätsbericht', 105, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.text('Berufseinstieg - ABU EBA Digital', 105, 28, { align: 'center' });
    
    // Code
    pdf.setFontSize(10);
    pdf.text(`Code: ${userCode}`, 105, 35, { align: 'center' });
    pdf.text(`Datum: ${new Date().toLocaleDateString('de-CH')}`, 105, 41, { align: 'center' });
    
    // Trennlinie
    pdf.line(20, 45, 190, 45);
    
    let yPos = 55;
    
    // Zeitaufwand
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Zeitaufwand', 20, yPos);
    yPos += 8;
    
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    const learn1Time = document.getElementById('learn1Time').textContent;
    const learn2Time = document.getElementById('learn2Time').textContent;
    const totalTime = document.getElementById('totalTime').textContent;
    
    pdf.text(`Seite 1 (Grundlagen): ${learn1Time}`, 25, yPos);
    yPos += 6;
    pdf.text(`Seite 2 (Vertiefung): ${learn2Time}`, 25, yPos);
    yPos += 6;
    pdf.text(`Gesamtzeit: ${totalTime}`, 25, yPos);
    yPos += 12;
    
    // Medien
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Medienkonsumation', 20, yPos);
    yPos += 8;
    
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    
    const mediaItems = [
        { id: 'audio1Check', text: 'Audio 1: Die ersten Tage im Betrieb' },
        { id: 'video1Check', text: 'Video 1: Rechte und Pflichten' },
        { id: 'audio2Check', text: 'Audio 2: Dos and Don\'ts im Betrieb' },
        { id: 'video2Check', text: 'Video 2: Konflikte am Arbeitsplatz' }
    ];
    
    mediaItems.forEach(item => {
        const icon = document.getElementById(item.id).textContent;
        pdf.text(`${icon} ${item.text}`, 25, yPos);
        yPos += 6;
    });
    
    const mediaPercentage = document.getElementById('mediaPercentage').textContent;
    pdf.text(`Fortschritt: ${mediaPercentage}`, 25, yPos);
    yPos += 12;
    
    // Neue Seite wenn nötig
    if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
    }
    
    // Aufgaben
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Aufgaben', 20, yPos);
    yPos += 8;
    
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    
    const taskItems = [
        { id: 'task1Status', text: '1. Reflexion: Erwartungen' },
        { id: 'task2Status', text: '2. Verständnisfragen (Quiz)' },
        { id: 'task3Status', text: '3. Fallbeispiel: Mara' },
        { id: 'task4Status', text: '4. Persönliche Ziele' },
        { id: 'task5Status', text: '5. Selbstreflexion' }
    ];
    
    taskItems.forEach(item => {
        const status = document.getElementById(item.id).textContent;
        const icon = status === 'Erledigt' ? '✓' : '✗';
        pdf.text(`${icon} ${item.text}: ${status}`, 25, yPos);
        yPos += 6;
    });
    
    const taskPercentage = document.getElementById('taskPercentage').textContent;
    pdf.text(`Fortschritt: ${taskPercentage}`, 25, yPos);
    yPos += 12;
    
    // Gesamtbewertung
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Gesamtbewertung', 20, yPos);
    yPos += 8;
    
    const scoreValue = document.getElementById('overallScore').querySelector('.score-value').textContent;
    pdf.setFontSize(18);
    pdf.text(`${scoreValue}/100 Punkte`, 25, yPos);
    yPos += 10;
    
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    const scoreText = document.getElementById('scoreText').textContent;
    const splitText = pdf.splitTextToSize(scoreText, 160);
    pdf.text(splitText, 25, yPos);
    
    // Fussnote
    pdf.setFontSize(8);
    pdf.setTextColor(100);
    pdf.text('ABU EBA Digital - Dieser Bericht wurde automatisch generiert', 105, 285, { align: 'center' });
    
    // PDF speichern
    pdf.save(`Aktivitätsbericht_${userCode}.pdf`);
});

// Link teilen
document.getElementById('shareBtn').addEventListener('click', () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?code=${userCode}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Mein Aktivitätsbericht - Berufseinstieg',
            text: 'Hier ist mein Aktivitätsbericht zum Thema Berufseinstieg',
            url: shareUrl
        }).catch(err => console.log('Fehler beim Teilen:', err));
    } else {
        // Fallback: Link kopieren
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Link wurde in die Zwischenablage kopiert!');
        }).catch(() => {
            prompt('Kopiere diesen Link:', shareUrl);
        });
    }
});

// Beim Laden der Seite Daten laden
loadActivityData();
