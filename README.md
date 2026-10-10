# Robotik mit SPIKE – Lernplattform Basiskurs Robotik

Interaktive Lernseiten für den Basiskurs Robotik (Wirtschaftsschule, Lernbereiche 2–6) mit LEGO Education SPIKE Prime.
Die aktive Lernfolge nutzt **nur Fahrgestell 1** (Hub, Motoren an C und D, keine angebauten Sensoren; Gyrosensor im Hub).

Online: https://marconicklas.github.io/robotik-spike/

## Aufbau jeder Lektion
1. **Leseauftrag** – genauer Skriptabschnitt mit Seitenangabe
2. **Verständnisprüfung** – Fragen, die das Skript erfordern; 3 Versuche je Frage, Hinweise mit Skriptverweis, Lösung erst nach dem 3. Versuch; bestanden ab 70 %, sonst neue Runde
3. **Vertiefung** – Aufgaben, Simulationen (Vermutung → ausprobieren → erklären) und Programmieraufgaben im SPIKE-Simulator
4. **Abschluss** – Rückmeldung mit Wiederholungsempfehlungen, Selbsteinschätzung, „Lektion abschließen“

## Gemeinsame Inhaltsgrundlage
Alle Inhalte stehen in `content/` (eine JSON-Datei pro Lektion). Daraus wird alles erzeugt:

```
python3 tools/build.py              # Webseite + mebis-Pakete (dist/mebis: SCORM + Moodle-XML-Fragen)
node tools/build_worksheets.js      # Arbeitsblätter (material/arbeitsblaetter) + Lösungen (dist/loesungen)
node tools/test_spike.js            # prüft alle Programmieraufgaben (Musterlösung besteht, Startprogramm nicht)
```

`dist/` (mebis-Pakete, Lehrkraftlösungen) wird nicht veröffentlicht.

## Archiv
Inhalte zum erweiterten Fahrgestell (Farb-, Abstands-, Kraftsensor, Anbau-Motor A) liegen in `erweitert/` und sind nicht Teil der Lernfolge.
Die ursprünglichen Leistungsnachweise sind in `erweitert/ln-spike-erweitert.json` gesichert.

Simulator und Blöcke sind eine vereinfachte Nachbildung der SPIKE App (keine offizielle LEGO-Seite).
LEGO, SPIKE und FIRST LEGO League sind Marken der jeweiligen Inhaber.
