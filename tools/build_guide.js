/* Anleitung für mebis-Import, Einstellungen und Fortschrittskontrolle + Änderungsübersicht (Word) */
"use strict";
const fs = require("fs"), path = require("path");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, LevelFormat, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } = require("docx");
const out = process.argv[2] || path.join(__dirname, "../dist/mebis/Anleitung_mebis_und_Aenderungen.docx");
const F = "Arial";
const t = (s, o) => new TextRun(Object.assign({ text: s, font: F }, o || {}));
const p = (s, o) => new Paragraph({ children: typeof s === "string" ? [t(s)] : s, spacing: { after: 100 }, ...(o || {}) });
const h1 = s => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(s, { bold: true, size: 30, color: "1F6F78" })], spacing: { before: 240, after: 120 } });
const h2 = s => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [t(s, { bold: true, size: 24, color: "1F6F78" })], spacing: { before: 200, after: 80 } });
const li = (s, n) => new Paragraph({ numbering: { reference: n ? (n === 2 ? "num2" : "num") : "bul", level: 0 }, children: typeof s === "string" ? [t(s)] : s, spacing: { after: 60 } });
const b = s => t(s, { bold: true });
const W = 9638, thin = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
function table(cols, rows) {
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: cols, rows: rows.map((r, i) => new TableRow({ children: r.map((c, j) => new TableCell({ width: { size: cols[j], type: WidthType.DXA }, borders: { top: thin, bottom: thin, left: thin, right: thin },
    shading: i === 0 ? { fill: "E3F0F1", type: ShadingType.CLEAR, color: "auto" } : undefined, margins: { top: 60, bottom: 60, left: 90, right: 90 }, children: [new Paragraph({ children: [t(c, { bold: i === 0, size: 19 })] })] })) })) });
}
const C = [];
C.push(new Paragraph({ children: [t("Basiskurs Robotik – LEGO SPIKE (Fahrgestell 1)", { bold: true, size: 36 })], spacing: { after: 60 } }));
C.push(p([t("Anleitung für mebis · Fortschrittskontrolle · Übersicht der Änderungen", { color: "5B6672" })]));

C.push(h1("1  Was wurde geliefert?"));
[
 [b("Lernwebseite (GitHub Pages): "), t("14 überarbeitete Lektionen, nur Fahrgestell 1 – marconicklas.github.io/robotik-spike")],
 [b("mebis-Kurs als Sicherung: "), t("Basiskurs_Robotik_SPIKE_Fahrgestell1.mbz (fertiger Kurs, ohne Nutzerdaten)")],
 [b("Einzelteile (falls du lieber selbst aufbaust): "), t("14 SCORM-Lernpakete (Vertiefung) und 14 Moodle-XML-Fragensammlungen (Verständnisprüfung)")],
 [b("Arbeitsblätter: "), t("14 druckfertige Arbeitsblätter (Word + PDF, auch auf der Webseite verlinkt) und 14 Lehrkraftlösungen (nur im Lieferordner, nicht veröffentlicht)")],
 [b("Gemeinsame Inhaltsgrundlage: "), t("content/lessons/L01.json … L14.json im Repository – daraus werden Webseite, mebis-Pakete und Arbeitsblätter erzeugt")]
].forEach(x => C.push(li(x)));

C.push(h1("2  Warum diese technische Lösung?"));
C.push(p("Geprüft wurden SCORM, H5P und native mebis-Aktivitäten (mebis läuft seit Februar 2026 auf Moodle 5.1). Gewählt wurde eine Kombination:"));
C.push(table([2300, 2700, 4638], [
 ["Schritt", "mebis-Aktivität", "Begründung"],
 ["① Leseauftrag", "Textseite", "Abschluss bei Ansicht; schaltet den Test frei."],
 ["② Verständnisprüfung", "Test (Fragetypen: Multiple Choice, Zuordnung, Anordnung, Numerisch, Kurzantwort, Lückentext-Auswahl)", "Bester Einblick für Lehrkräfte: jede Antwort, jeder Versuch, Dauer, Fragenstatistik. Modus „Interaktiv mit mehreren Versuchen“: 3 Versuche, Hinweis mit Skriptverweis nach Fehlversuch, Lösung erst nach dem 3. Versuch – genau wie auf der Webseite. Nativ = sehr zuverlässig, Bewertung im Gradebook."],
 ["③ Vertiefung", "Lernpaket (SCORM 1.2)", "Nur SCORM kann die eigenen Simulationen und den SPIKE-Block-Simulator tragen. Es meldet Ergebnis, Status, Zeit, jede Antwort (Interaktionen) und jede Aufgabe einzeln (Lernziele) an mebis und speichert den Zwischenstand (Wiederaufnahme). H5P kann die Simulationen nicht abbilden."],
 ["④ Abschluss", "Abschlussverfolgung + Voraussetzungen", "Nächste Lektion öffnet sich erst nach abgeschlossener Vertiefung; Test erst nach dem Leseauftrag; Vertiefung erst ab 70 % im Test."]
]));
C.push(p([b("Pflege: "), t("Alles entsteht aus denselben JSON-Dateien. Nach Änderungen: python3 tools/build.py (Webseite + Pakete) und node tools/build_worksheets.js. In mebis dann nur das geänderte Lernpaket ersetzen oder die Fragen neu importieren.")]));

C.push(h1("3  Import in mebis (empfohlen: Kurssicherung)"));
["In mebis anmelden → Kursübersicht → Pfeil neben „Neuer Kurs“ → „Kursbackup wiederherstellen“.",
 "Datei Basiskurs_Robotik_SPIKE_Fahrgestell1.mbz hochladen (6 MB; Grenze 512 MB) → „Kursbackup wiederherstellen“.",
 "Warten, bis unter „Aktuell laufende Wiederherstellungsprozesse“ der Status „Abgeschlossen“ steht.",
 "Kurs öffnen → Teilnehmer/innen: Klasse einschreiben.",
 "Kurzprüfung: Lektion 1 – Leseauftrag öffnen, Test starten (über „Rolle wechseln → Schüler/in“ siehst du die Sperren)."].forEach(x => C.push(li(x, true)));
C.push(p([b("Alternative in einen bestehenden Kurs: "), t("Kurs öffnen → Mehr → Kurse wiederverwenden → Sicherung wiederherstellen → .mbz hochladen → in bestehenden Kurs zusammenführen.")]));
C.push(h2("Manueller Aufbau (nur falls die Wiederherstellung nicht möglich ist)"));
["Pro Lektion einen Abschnitt anlegen.",
 "Textseite „Lxx Leseauftrag“ mit dem Text aus der Webseite; Abschluss: „Teilnehmer/in muss Aktivität aufrufen“.",
 "Test „Lxx Verständnisprüfung“: Fragenbank → Import → Format Moodle-XML → Lxx_Verstaendnispruefung.xml; alle Fragen hinzufügen. Frageverhalten „Interaktiv mit mehreren Versuchen“, Versuche unbegrenzt, Bewertung „Bester Versuch“, Bestehensgrenze 70 %, Abschluss „Bestehensnote erreichen“. Voraussetzung: Leseauftrag abgeschlossen.",
 "Lernpaket „Lxx Vertiefung“: Lxx_Vertiefung_SCORM.zip hochladen; Bewertung „Höchste Bewertung“, Versuche unbegrenzt, „Neuen Versuch erzwingen: Nein“, Anzeige im aktuellen Fenster, Struktur ausblenden; Abschluss „Status: abgeschlossen“. Voraussetzung: Bewertung im Test ≥ 70 %.",
 "Leseauftrag der nächsten Lektion: Voraussetzung „Vertiefung der vorigen Lektion abgeschlossen“."].forEach(x => C.push(li(x, 2)));

C.push(h1("4  Lernfortschritt in mebis nachvollziehen"));
C.push(table([3300, 6338], [
 ["Frage", "Wo in mebis?"],
 ["Wer hat begonnen?", "Kurs → Berichte → Aktivitätsabschluss (Leseauftrag erledigt); Testversuche und Lernpaket-Versuche."],
 ["Welche Lektionen begonnen/abgeschlossen?", "Berichte → Aktivitätsabschluss: Häkchen je Leseauftrag, Test und Vertiefung pro Person."],
 ["Welche Ergebnisse?", "Bewertungen (Bewerterübersicht): Test in % und Vertiefung in % je Lektion."],
 ["Welche Versuche?", "Test → Ergebnisse → Bewertung/Antworten (jeder Versuch mit Dauer); Lernpaket → Berichte → Basisbericht (Versuche, Start, letzter Zugriff, Punkte)."],
 ["Wo gibt es Schwierigkeiten?", "Test → Ergebnisse → Statistik (Leichtigkeitsindex je Frage) und Antworten (Einstellung „Alle Versuche“). Lernpaket → Berichte → Lernzielbericht (jede Aufgabe: bestanden / mit Lösung / offen) und Interaktionsbericht (jede Antwort; unter „Einstellungen“ zusätzlich „Zusammenfassung der Frage“ und „Ergebnis“ anhaken)."],
 ["Einzelne Antworten und Zeiten", "Test: vollständige Versuchsansicht mit Zeitpunkt und Dauer. Lernpaket: Klick auf die Punktzahl im Basisbericht → Tracking-Details mit allen Interaktionen inkl. Uhrzeit und Bearbeitungsdauer (Latenz)."]
]));
C.push(p([b("Bewertungslogik Vertiefung: "), t("Aufgabe gelöst ohne Lösungshilfe = 1 Punkt; im 2. Versuch = ½ Punkt; mit angezeigter Lösung = 0 Punkte, gilt aber als bearbeitet. Die Lektion ist abgeschlossen, wenn alle Pflichtaufgaben bearbeitet sind.")]));

C.push(h1("5  Was sich geändert hat"));
["Nur noch Fahrgestell 1 (Hub, Motoren C/D, ohne Sensoren). Simulator kennt jetzt Fahrgestell 1: keine Farb-/Abstands-/Kraftsensoren, Anzeige der Motor-Drehwinkel und des Timers.",
 "14 statt 16 Lektionen. Neu: L08 „Warten und Verzweigen“ (Timer, Gyro, Variablen), L12 „Missionen planen“ (Schieben statt Gabel), L13 „Robot-Game“ mit Fahrgestell 1. Alte Adressen leiten weiter.",
 "Jede Lektion: Leseauftrag (Kapitel, Seiten, Abschnitte, Lesefokus) → Verständnisprüfung (6–8 Fragen, die das Skript erfordern, 9 Aufgabenformen) → Vertiefung (3–4 Aufgaben: Simulationen nach „Vermutung → ausprobieren → erklären“, Programmieraufgaben, Fehlersuche, Transfer) → Abschluss mit Wiederholungsempfehlungen und Selbsteinschätzung.",
 "16 Simulationsaufgaben mit 15 verschiedenen Simulationen, davon 10 neu (u. a. Verbindungs-Labor, Fachwerk, Verkabelung, Gyro, Ultraschall, Lenkung, Vieleck, Regelung, Verschleiß, Strategie).",
 "Hinweise mit Skriptverweis nach Fehlversuch; Lösung erst nach 3 Versuchen bzw. bei Programmieraufgaben nach 3 erfolglosen Prüfungen. Bestehen ab 70 %, sonst neue Runde.",
 "Arbeitsblätter getrennt: nicht in der Webseite auszufüllen, Papier ist keine Voraussetzung für den digitalen Abschluss.",
 "Erweitertes Fahrgestell gesichert im Ordner „erweitert/“ (alte Lektionen funktionsfähig, nicht verlinkt in der Lernfolge).",
 "Leistungsnachweise auf Fahrgestell 1 angepasst (gleiche Struktur, Punkte und Bewertungsraster; Gyro/Rotationssensor statt Abstands-, Farb-, Kraftsensor; Schieben statt Gabel). Originale in erweitert/ln-spike-erweitert.json.",
 "Lehrer-Übersicht (lehrer.html) und Fortschrittscode an die neuen Lektionen angepasst."].forEach(x => C.push(li(x)));

C.push(h1("6  Durchgeführte Tests"));
["Webseite (Chromium, Desktop 1280 px, Tablet 768 px mit Touch, Handy 390 px): alle 14 Lektionen automatisiert komplett durchgespielt – Fehlversuch mit Hinweis, richtige Antworten aller 9 Fragetypen, alle 16 Simulationsaufgaben bis zum Ziel, alle 25 Programmieraufgaben (Lösung erst nach 3 Fehlversuchen), Abschluss, Neuladen (Fortschritt bleibt). Keine JavaScript-Fehler.",
 "Nicht bestandene Runde (0 %) → Vertiefung bleibt gesperrt → neue Runde → 100 % → freigeschaltet.",
 "Alle 25 Musterlösungen bestehen, alle Startprogramme bestehen nicht (tools/test_spike.js).",
 "Fortschrittscode → lehrer.html eingelesen; Weiterleitungen, Archiv und Leistungsnachweis-Seite geprüft.",
 "Lokale Moodle-5.1-Installation (Version wie mebis): alle 104 Fragen importiert; Schülerdurchlauf Lektion 1 (Leseauftrag → Test mit Hinweis nach Fehlversuch, 93,75 % → Vertiefung freigeschaltet → Unterbrechung → Wiederaufnahme mit Stand → Abschluss → Lektion 2 frei). Lehrkraftberichte geprüft: Basis-, Interaktions-, Lernzielbericht, Testantworten, Aktivitätsabschluss, Bewertungen. Programme in Lektion 9 werden nach Unterbrechung wiederhergestellt (gespeicherte Daten 1,5 KB von 4 KB).",
 "Kurssicherung (.mbz) in eine zweite Moodle-Instanz wiederhergestellt: 43 Aktivitäten, 41 Voraussetzungen, 104 Testfragen intakt; Sperren funktionieren."].forEach(x => C.push(li(x)));

C.push(h1("7  Einschränkungen"));
["Die Webseite speichert den Fortschritt nur im Browser (wie bisher, mit Fortschrittscode/Abgabe-PDF). Personenbezogene Fortschrittskontrolle gibt es nur über mebis.",
 "Ob jemand das Skript wirklich gelesen hat, lässt sich technisch nicht nachweisen; die Fragen sind aber so gestellt, dass sie ohne Skript kaum sicher zu beantworten sind.",
 "In mebis werden Zuordnungs- und Mehrfachauswahlfragen anteilig bewertet, auf der Webseite nur ganz richtig/falsch.",
 "Das Lernpaket speichert den Zwischenstand in max. 4 KB (SCORM 1.2). Reicht der Platz nicht, werden zuerst gespeicherte Programme verworfen (gelöste Aufgaben bleiben erhalten). Im Test lag der größte Stand bei 1,5 KB.",
 "Die Darstellung des Interaktionsberichts hängt von den mebis-Einstellungen ab; je Interaktion sieht man eine Kennung wie „L01_v2_Verbindung-auswaehlen“, die Antwort und das Ergebnis.",
 "Die Kästen „Ausprobieren im Browser“ im Skript nennen noch die alten Lektionsnummern; der orange Kasten in Kap. 1 nennt den Farbsensor an E. Die Lektionen weisen darauf hin – eine Skript-Aktualisierung ist empfehlenswert.",
 "Der Simulator ist eine vereinfachte Nachbildung; am echten Fahrgestell weichen Strecken und Winkel leicht ab (gewollt: Anlass für Kalibrieren und Gyro-Regelung)."].forEach(x => C.push(li(x)));

const doc = new Document({ styles: { default: { document: { run: { font: F, size: 21 } } } },
  numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }] },
    { reference: "num2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 300 } } } }] },
    { reference: "num", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 300 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1134, right: 1134 } } }, children: C }] });
Packer.toBuffer(doc).then(buf => { fs.writeFileSync(out, buf); console.log("geschrieben:", out); });
