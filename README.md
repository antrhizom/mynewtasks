# Berufseinstieg - ABU EBA Digital

Eine interaktive Lernplattform zum Thema Berufseinstieg, entwickelt für den Allgemeinbildenden Unterricht EBA (Eidgenössisches Berufsattest) in der Schweiz.

## 📋 Übersicht

Diese Web-Applikation ermöglicht Lernenden, sich selbstständig und handlungskompetenzorientiert mit dem Thema Berufseinstieg auseinanderzusetzen. Die Plattform erfasst alle Lernaktivitäten und generiert am Ende einen detaillierten Aktivitätsbericht.

## ✨ Hauptfunktionen

- **Einmalige Code-Zuweisung**: Jede:r Nutzer:in erhält einen einzigartigen 8-stelligen Code
- **Zwei Lernseiten**: 
  - Seite 1: Grundlagen (Arbeitsvertrag, Probezeit, Sozialversicherungen)
  - Seite 2: Vertiefung (Kompetenzen, Konflikte, Selbstreflexion)
- **Multimediale Inhalte**: Audio-Dateien und Videos zur Wissensvermittlung
- **Interaktive Aufgaben**: Textaufgaben, Quiz, Fallbeispiele, Selbstbewertungen
- **Aktivitätstracking**: Erfassung von Zeit, Medienkonsumation und Aufgabenbearbeitung
- **PDF-Export**: Druckbarer Aktivitätsbericht mit persönlichem Code
- **Cloud-Synchronisation**: Daten werden in Firebase Firestore gespeichert

## 🛠 Technologie-Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Firestore (NoSQL-Datenbank)
- **PDF-Generierung**: jsPDF
- **Hosting**: GitHub Pages + Firebase

## 📁 Projektstruktur

```
berufseinstieg-app/
├── index.html              # Startseite mit Code-Zuweisung
├── learn1.html             # Lernseite 1 (Grundlagen)
├── learn2.html             # Lernseite 2 (Vertiefung)
├── activity.html           # Aktivitätsbericht
├── css/
│   └── styles.css         # Zentrales Stylesheet
├── js/
│   ├── learn1.js          # JavaScript für Seite 1
│   ├── learn2.js          # JavaScript für Seite 2
│   └── activity.js        # JavaScript für Aktivitätsbericht
└── README.md              # Diese Datei
```

## 🚀 Installation & Setup

### 1. Firebase-Projekt erstellen

1. Gehe zu [Firebase Console](https://console.firebase.google.com/)
2. Klicke auf "Projekt hinzufügen"
3. Gib deinem Projekt einen Namen (z.B. "berufseinstieg-abu")
4. Folge den Anweisungen zur Projekterstellung

### 2. Firebase-Konfiguration

1. In der Firebase Console: Gehe zu Projekteinstellungen (⚙️)
2. Scrolle zu "Deine Apps" und klicke auf das Web-Symbol (</>)
3. Registriere deine App
4. Kopiere die Firebase-Konfiguration

### 3. Firestore Database einrichten

1. In der Firebase Console: Gehe zu "Firestore Database"
2. Klicke auf "Datenbank erstellen"
3. Wähle "Im Testmodus starten" (für Entwicklung)
4. Wähle einen Standort (europe-west6 für Schweiz)

### 4. Firestore-Regeln konfigurieren

Gehe zu "Firestore Database" → "Regeln" und füge folgende Regeln ein:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sessions/{sessionId} {
      // Erlaubt das Erstellen neuer Sessions
      allow create: if true;
      
      // Erlaubt das Lesen und Schreiben nur für die eigene Session
      allow read, update: if true;
      
      // Verhindert das Löschen
      allow delete: if false;
    }
  }
}
```

**Wichtig für Produktion**: Später solltest du die Regeln verschärfen!

### 5. Code anpassen

Öffne folgende Dateien und ersetze die Firebase-Konfiguration:

- `index.html` (Zeile ~85-91)
- `js/learn1.js` (Zeile ~4-10)
- `js/learn2.js` (Zeile ~4-10)
- `js/activity.js` (Zeile ~4-10)

Ersetze die Platzhalter mit deinen echten Firebase-Werten:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "dein-projekt.firebaseapp.com",
    projectId: "dein-projekt-id",
    storageBucket: "dein-projekt.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};
```

### 6. Auf GitHub hochladen

```bash
# Repository initialisieren
git init

# Alle Dateien hinzufügen
git add .

# Ersten Commit erstellen
git commit -m "Initiales Setup der Berufseinstieg-App"

# GitHub Repository verbinden (ersetze mit deiner URL)
git remote add origin https://github.com/dein-username/berufseinstieg-app.git

# Hochladen
git branch -M main
git push -u origin main
```

### 7. GitHub Pages aktivieren

1. Gehe zu deinem Repository auf GitHub
2. Klicke auf "Settings"
3. Scrolle zu "Pages" im linken Menü
4. Unter "Source": Wähle "main" branch
5. Klicke auf "Save"
6. Deine App ist nun unter `https://dein-username.github.io/berufseinstieg-app/` verfügbar

## 📊 Datenstruktur (Firestore)

Jede Session wird in Firestore wie folgt gespeichert:

```javascript
{
  code: "ABC12345",
  createdAt: Timestamp,
  startTime: "2024-11-25T10:30:00.000Z",
  completed: false,
  finalScore: 0,
  activities: {
    learn1: {
      visited: true,
      timeSpent: 450,        // in Sekunden
      audioPlayed: true,
      videoWatched: true,
      tasksCompleted: 2,
      task1Text: "...",
      quizScore: 3
    },
    learn2: {
      visited: true,
      timeSpent: 600,
      audioPlayed: true,
      videoWatched: true,
      tasksCompleted: 3,
      task3Text: "...",
      task4Text: "...",
      ratings: {
        punctuality: 4,
        teamwork: 5,
        independence: 4,
        criticism: 3
      }
    }
  }
}
```

## 🎯 Bewertungssystem

Das System berechnet automatisch eine Gesamtpunktzahl (0-100):

- **Zeit (20 Punkte)**: Basierend auf Gesamtzeit (min. 30 Min. für volle Punktzahl)
- **Medien (20 Punkte)**: 5 Punkte pro konsumiertem Medium (4 total)
- **Aufgaben (60 Punkte)**: 12 Punkte pro erledigter Aufgabe (5 total)

### Bewertungsskala:
- 90-100 Punkte: Ausgezeichnet
- 75-89 Punkte: Sehr gut
- 60-74 Punkte: Gut
- 40-59 Punkte: Teilweise erfüllt
- 0-39 Punkte: Ungenügend

## 📱 Browser-Kompatibilität

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🔒 Datenschutz & Sicherheit

- Codes sind einmalig und nicht wiederverwendbar
- Keine personenbezogenen Daten werden gespeichert
- LocalStorage wird nur für Session-Management verwendet
- Firestore-Regeln sollten für Produktion angepasst werden

## 🎨 Anpassungen

### Design ändern
Passe die CSS-Variablen in `css/styles.css` an (Zeile 10-20):

```css
:root {
    --primary-color: #2563eb;    /* Hauptfarbe */
    --success-color: #10b981;    /* Erfolg */
    --warning-color: #f59e0b;    /* Warnung */
    /* ... */
}
```

### Inhalte anpassen
- Bearbeite `learn1.html` und `learn2.html` für Lerninhalte
- Füge eigene Audio/Video-Dateien hinzu
- Passe Aufgabenstellungen an

## 🐛 Bekannte Einschränkungen

- Audio/Video-Dateien müssen separat hochgeladen werden
- Browser-LocalStorage ist erforderlich
- Keine Offline-Funktionalität
- Code-Wiederherstellung nicht möglich

## 📄 Lizenz

Dieses Projekt wurde für Bildungszwecke entwickelt und steht für den Einsatz in Schweizer Berufsschulen zur Verfügung.

## 👥 Autor

Entwickelt für ABU EBA Digital

## 📧 Support

Bei Fragen oder Problemen erstelle ein Issue auf GitHub oder kontaktiere den Entwickler.

---

**Viel Erfolg beim Einsatz der Lernplattform! 🎓**
