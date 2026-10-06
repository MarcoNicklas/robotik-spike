/* Leistungsnachweise: Freischaltung, Aufgabe mit Uhr, Handlungsprodukt, Reflexion, Abgabe als PDF */
(function () {
  "use strict";
  var D = window.LN_DATA, A, U, LNS, PFX;
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  function key(n) { return window.RProg.k(PFX + ":LN:" + n); }
  function load(n) { try { return JSON.parse(A.ls(key(n)) || "{}") || {}; } catch (e) { return {}; } }
  function save(n, st) { A.ls(key(n), JSON.stringify(st)); }
  function unlockCode(n) { return A.hash(A.salt + "|LN|" + A.course + "|" + n, 13).slice(0, 6).toUpperCase(); }
  function reqState(L) {
    var tot = 0, sol = 0, miss = [];
    L.reqs.forEach(function (r) {
      var have = r.ex.filter(function (x) { return !!A.ls(window.RProg.k(PFX + ":" + r.file + ":" + x + ":done")); }).length;
      tot += r.ex.length; sol += have; if (have < r.ex.length) miss.push({ r: r, have: have });
    });
    var need = Math.ceil(tot * 0.8), st = load(L.n);
    return { tot: tot, sol: sol, need: need, miss: miss, ok: sol >= need || !!st.unlocked };
  }
  function fmt(ms) { var neg = ms < 0; ms = Math.abs(ms); var s = Math.floor(ms / 1000), m = Math.floor(s / 60); s %= 60; return (neg ? "+" : "") + m + ":" + (s < 10 ? "0" : "") + s; }
  function statusOf(L) { var st = load(L.n), rq = reqState(L); return st.t1 ? "abgegeben" : st.t0 ? "läuft" : rq.ok ? "freigeschaltet" : "gesperrt"; }
  var BADGE = { "gesperrt": "🔒 gesperrt", "freigeschaltet": "🔓 freigeschaltet", "läuft": "⏱ läuft", "abgegeben": "✓ abgegeben" };

  /* ---------------- Übersicht */
  function overview() {
    var h = ['<section class="hero"><span class="tag">' + esc(A.title) + '</span><span class="tag">3 Noten pro Halbjahr</span><h1>Leistungsnachweise</h1>' +
      '<p>Arbeite die Lern-App in deinem Tempo durch. Sobald ein Leistungsnachweis freigeschaltet ist, entscheidest <b>du</b>, wann du ihn machst – oder ob du vorher noch übst. ' +
      'Spätester Termin ist das Ende des Zeitfensters.</p>' +
      '<div class="goals"><div><b>So läuft es ab</b><ul><li>Voraussetzungen in der Lern-App lösen (mind. 80 % der Aufgaben)</li><li>„Ich starte jetzt“ – deine Aufgabe wird zugelost, die Zeit läuft</li><li>Aufgabe lösen, Handlungsprodukt erstellen, Reflexion schreiben</li><li>Abgeben (PDF ins Abgabe-Formular) und deiner Lehrkraft vorführen</li></ul></div>' +
      '<div><b>Bewertet wird</b><ul><li>ob dein Roboter die Aufgabe erfüllt</li><li>dein Programm</li><li>dein Handlungsprodukt (Video, Comic, Podcast, Mappe …)</li><li>deine Vorstellung und Reflexion</li></ul></div>' +
      '<div><b>Wichtig</b><ul><li>Die Zeit wird festgehalten; Überziehen kostet Punkte (1 Punkt je angefangene 10 Minuten)</li><li>Bewahre deine Abgabe-PDF auf</li><li>Krank oder nicht geschafft? Du bekommst eine andere Variante im nächsten Zeitfenster.</li></ul></div></div></section>',
      '<h2>Deine Leistungsnachweise</h2><div class="ln-cards">'];
    LNS.forEach(function (L) {
      var rq = reqState(L), s = statusOf(L), pct = rq.tot ? Math.round(100 * Math.min(rq.sol, rq.need) / rq.need) : 100;
      h.push('<a class="card ln-card ln-' + (s === "gesperrt" ? "lock" : "open") + '" href="#' + L.n + '"><span class="n">Leistungsnachweis ' + L.n + ' · ' + esc(L.kind) + ' · ' + esc(L.window) + '</span>' +
        '<span class="tt">' + esc(L.title) + '</span><span class="d">' + esc(L.intro) + '</span>' +
        '<span class="ln-req"><span class="ln-bar"><i style="width:' + pct + '%"></i></span>Voraussetzung: ' + rq.sol + ' von ' + rq.tot + ' Aufgaben (nötig: ' + rq.need + ') · ' + L.reqs.map(function (r) { return r.k; }).join(", ") + '</span>' +
        '<span class="chips"><span class="chip">' + esc(L.lb) + '</span><span class="chip">' + L.minutes + ' min</span><span class="chip st-' + s.replace("ä", "ae") + '">' + BADGE[s] + '</span></span></a>');
    });
    h.push('</div><p class="foot">Die Leistungsnachweise folgen den Vorgaben der Schule: 2 schriftliche Noten mit Handlungsprodukt (Vorstellung und Reflexion als integrierte Teilnote) und 1 mündliche Note.</p>');
    $("#ln-app").innerHTML = h.join("");
  }

  /* ---------------- Einzelansicht */
  var timer = null, CUR = null;
  function onInput(e) {
    if (!CUR) return; var t = e.target, st = CUR.st, n = CUR.n; st.f = st.f || {};
    if (!t.closest || !t.closest("#ln-app")) return;
    if (t.hasAttribute("data-ch")) { st.ch = st.ch || []; st.ch[+t.getAttribute("data-ch")] = t.checked ? 1 : 0; }
    else if (t.name === "ln-prod") st.prod = t.value;
    else if (t.getAttribute("data-k")) st[t.getAttribute("data-k")] = t.value;
    else if (t.hasAttribute("data-f")) st.f[t.getAttribute("data-f")] = t.value;
    else if (t.hasAttribute("data-t")) { var id = t.getAttribute("data-t"), r = +t.getAttribute("data-r"), c = +t.getAttribute("data-c"); st.f[id] = st.f[id] || []; st.f[id][r] = st.f[id][r] || []; st.f[id][r][c] = t.value; }
    else if (t.hasAttribute("data-r")) { st.r = st.r || ["", "", ""]; st.r[+t.getAttribute("data-r")] = t.value; }
    else return;
    save(n, st); var s = $("#ln-saved"); if (s) s.textContent = "Gespeichert ✓ " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  }
  function detail(n) {
    var L = LNS.filter(function (x) { return x.n === n; })[0]; if (!L) { overview(); return; }
    clearInterval(timer); CUR = null;
    var st = load(n), rq = reqState(L), app = $("#ln-app");
    var head = '<p><a href="#">← alle Leistungsnachweise</a></p><section class="hero"><span class="tag">Leistungsnachweis ' + n + '</span><span class="tag">' + esc(L.kind) + ' Note</span><span class="tag">' + esc(L.window) + '</span><span class="tag">' + L.minutes + ' Minuten</span>' +
      '<h1>' + esc(L.title) + '</h1><p>' + esc(L.intro) + '</p></section>';
    var rub = '<h3>Bewertung (' + L.max + ' Punkte)</h3><div class="scroll"><table class="t"><tbody>' + L.rubric.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td style="text-align:right"><b>' + r[1] + '</b></td></tr>'; }).join("") + '</tbody></table></div>';
    if (!rq.ok) {
      app.innerHTML = head + '<div class="box warn"><div class="h">🔒 Noch gesperrt</div><p>Du hast ' + rq.sol + ' von ' + rq.tot + ' Aufgaben der Voraussetzungen gelöst – nötig sind ' + rq.need + '. Es fehlen noch Aufgaben in:</p><ul>' +
        rq.miss.map(function (m) { return '<li><a href="' + esc(m.r.file) + '">' + esc(m.r.k + " · " + m.r.title) + '</a> – ' + m.have + ' von ' + m.r.ex.length + ' gelöst</li>'; }).join("") + '</ul></div>' + rub +
        '<details class="ln-code"><summary>Freischaltcode der Lehrkraft</summary><p>Nur nach Absprache mit deiner Lehrkraft.</p><input id="ln-uc" maxlength="8" placeholder="Code"> <button class="btn" id="ln-ucb" type="button">Freischalten</button> <span id="ln-ucm"></span></details>';
      $("#ln-ucb").onclick = function () { if ($("#ln-uc").value.trim().toUpperCase() === unlockCode(n)) { st.unlocked = 1; save(n, st); detail(n); } else $("#ln-ucm").textContent = "Code stimmt nicht."; };
      return;
    }
    if (!st.t0) {
      app.innerHTML = head + '<div class="box merke"><div class="h">🔓 Freigeschaltet – du entscheidest, wann du startest</div><p>Wenn du startest, wird deine Aufgabe zugelost (es gibt ' + L.variants.length + ' Varianten) und die Zeit läuft: <b>' + L.minutes + ' Minuten</b>' +
        (L.group ? ' (Gruppenarbeit, 2–3 Personen – jede Person startet und gibt auf ihrem Gerät ab)' : '') + '. Du kannst die Seite schließen – die Zeit läuft weiter.</p>' +
        '<p>Du fühlst dich noch nicht sicher? Übe weiter in der Lern-App – der Leistungsnachweis wartet.</p><button class="btn ln-start" id="ln-start" type="button">▶ Ich starte jetzt</button></div>' +
        '<h3>Das erwartet dich</h3><ul>' + (L.product ? '<li><b>' + esc(L.product.label) + '</b> – wahlweise: ' + L.product.choices.map(esc).join(" oder ") + '</li>' : '') +
        L.fields.map(function (f) { return '<li>' + esc(f.label) + '</li>'; }).join("") + (L.reflect ? '<li>Reflexion (3 Fragen)</li>' : '') + '<li>' + (L.group ? 'Präsentation eurer Gruppe und eine Einzelfrage' : 'Vorführung deines Roboters bei der Lehrkraft') + '</li></ul>' + rub;
      $("#ln-start").onclick = function () {
        var box = A.el("div"); box.innerHTML = '<h2>Wirklich starten?</h2><p>Die Zeit (' + L.minutes + ' Minuten) beginnt sofort und lässt sich nicht anhalten. Hast du Roboter, Laptop/Tablet und Material bereit?</p><div class="rp-row"><button class="rp-btn" data-a="go" type="button">Ja, ich starte</button><button class="rp-btn sec" data-a="no" type="button">Noch nicht</button></div>';
        var ov = A.overlay(box, true);
        box.addEventListener("click", function (e) { var a = e.target.getAttribute && e.target.getAttribute("data-a"); if (a === "no") ov.remove(); if (a === "go") { ov.remove(); st.t0 = Date.now(); st.v = L.variants[Math.floor(Math.random() * L.variants.length)].id; st.ch = []; st.f = {}; st.r = ["", "", ""]; save(n, st); detail(n); } });
      };
      return;
    }
    // ---- gestartet / abgegeben
    var V = L.variants.filter(function (v) { return v.id === st.v; })[0] || L.variants[0];
    var h = [head, '<div class="ln-timer" id="ln-timer"></div>'];
    if (st.t1) h.push('<div class="box merke"><div class="h">✓ Abgegeben am ' + new Date(st.t1).toLocaleString("de-DE") + '</div><p>Jetzt: Zeige deiner Lehrkraft deinen Roboter' + (L.group ? ' und haltet eure Präsentation' : '') + '. Du kannst Änderungen noch eintragen und erneut abgeben – es zählt die letzte Abgabe.</p></div>');
    h.push('<div class="ex"><div class="exh"><span class="num">Variante ' + esc(V.id) + '</span><span class="title">' + esc(V.title) + '</span></div><div class="task">' + esc(V.text) + '</div>' +
      '<div class="ln-checks"><b>Anforderungen – hake ab, was dein Roboter kann:</b>' + V.checks.map(function (c, i) { return '<label><input type="checkbox" data-ch="' + i + '"' + ((st.ch || [])[i] ? " checked" : "") + '> ' + esc(c) + '</label>'; }).join("") + '</div></div>');
    if (L.group) h.push('<h3>Eure Gruppe</h3><input class="ln-in" data-k="g" placeholder="Namen aller Gruppenmitglieder" value="' + esc(st.g || "") + '">');
    if (L.product) {
      h.push('<h3>' + esc(L.product.label) + '</h3><p>' + esc(L.product.text) + '</p><div class="ln-choices">' + L.product.choices.map(function (c, i) { return '<label><input type="radio" name="ln-prod" value="' + esc(c) + '"' + (st.prod === c ? " checked" : "") + '> ' + esc(c) + '</label>'; }).join("") + '</div>' +
        '<label class="ln-lab">Link zu deinem Produkt (OneDrive-Freigabe) <span class="hint-s">– ' + esc(D.linkHint) + '</span></label><input class="ln-in" data-k="link" placeholder="https://…" value="' + esc(st.link || "") + '">');
    }
    L.fields.forEach(function (fd) {
      var val = (st.f || {})[fd.id];
      if (fd.type === "table") {
        var rows = val || []; var tb = '<table class="t ln-tab"><thead><tr>' + fd.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join("") + '</tr></thead><tbody>';
        for (var r = 0; r < fd.rows; r++) { tb += '<tr>' + fd.cols.map(function (c, ci) { return '<td><input data-t="' + fd.id + '" data-r="' + r + '" data-c="' + ci + '" value="' + esc(((rows[r] || [])[ci]) || (ci === 0 && !((rows[r] || [])[0]) ? String(r + 1) : "")) + '"></td>'; }).join("") + '</tr>'; }
        h.push('<h3>' + esc(fd.label) + '</h3><div class="scroll">' + tb + '</tbody></table></div>');
      } else h.push('<label class="ln-lab">' + esc(fd.label) + '</label><textarea class="ln-in' + (fd.type === "code" ? " ln-code" : "") + '" data-f="' + fd.id + '" rows="' + (fd.rows || 4) + '" spellcheck="' + (fd.type === "code" ? "false" : "true") + '">' + esc(val || "") + '</textarea>');
    });
    if (L.reflect) {
      h.push('<h3>Reflexion</h3>');
      D.reflect.forEach(function (q, i) { h.push('<label class="ln-lab">' + (i + 1) + '. ' + esc(q) + '</label><textarea class="ln-in" data-r="' + i + '" rows="3">' + esc((st.r || [])[i] || "") + '</textarea>'); });
    }
    h.push('<div class="rp-row" style="margin-top:18px"><button class="btn ln-give" id="ln-give" type="button">📤 ' + (st.t1 ? "Erneut abgeben" : "Leistungsnachweis abgeben") + '</button><span class="ln-saved" id="ln-saved">Wird automatisch gespeichert.</span></div><div class="rp-err" id="ln-msg" aria-live="polite" style="color:var(--green)"></div>');
    app.innerHTML = h.join("");
    // Uhr
    function tick() {
      var end = st.t1 || Date.now(), used = end - st.t0, left = L.minutes * 60000 - used, el = $("#ln-timer"); if (!el) return;
      el.className = "ln-timer" + (left < 0 ? " over" : left < 600000 ? " warn" : "") + (st.t1 ? " done" : "");
      el.textContent = (st.t1 ? "Bearbeitungszeit: " + fmt(used).replace("+", "") + " Min." : left >= 0 ? "⏱ Restzeit " + fmt(left) : "⏱ Zeit überzogen: " + fmt(left) + " (1 Punkt Abzug je angefangene 10 Min.)") + "  ·  Variante " + V.id + "  ·  gestartet " + new Date(st.t0).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    }
    tick(); if (!st.t1) timer = setInterval(tick, 1000);
    CUR = { n: n, st: st };
    $("#ln-give").onclick = function () { give(L, V, st); };
  }

  /* ---------------- Abgabe */
  function give(L, V, st) {
    var miss = [];
    if (L.product && !st.prod) miss.push("Art des Handlungsprodukts nicht gewählt");
    if (L.group && !(st.g || "").trim()) miss.push("Gruppenmitglieder fehlen");
    L.fields.forEach(function (fd) { var v = (st.f || {})[fd.id]; if (!v || (Array.isArray(v) ? !v.some(function (r) { return r && r.slice(1).some(function (x) { return x && x.trim(); }); }) : !v.trim())) miss.push(fd.label + " – leer"); });
    if (L.reflect) (st.r || []).forEach(function (r, i) { if (!(r || "").trim()) miss.push("Reflexionsfrage " + (i + 1) + " – leer"); });
    if (L.reflect && !(st.r || []).length) miss.push("Reflexion – leer");
    var open = V.checks.filter(function (c, i) { return !(st.ch || [])[i]; });
    var box = A.el("div");
    box.innerHTML = '<h2>Leistungsnachweis abgeben</h2>' + (miss.length || open.length ? '<p><b>Noch offen:</b></p><ul style="font-size:14px">' + miss.concat(open.map(function (c) { return "Anforderung nicht abgehakt: " + c; })).map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + '</ul><p>Du kannst trotzdem abgeben oder vorher ergänzen.</p>' : '<p>Alles ausgefüllt. 👍</p>') +
      '<p>Beim Abgeben wird deine PDF gespeichert und das Abgabe-Formular öffnet sich. Lade die PDF dort hoch und zeige danach deiner Lehrkraft deinen Roboter.</p>' +
      '<div class="rp-row"><button class="rp-btn" data-a="ok" type="button">📤 Jetzt abgeben</button><button class="rp-btn sec" data-a="no" type="button">Zurück</button></div><div class="rp-err" aria-live="polite" style="color:var(--green)"></div>';
    var ov = A.overlay(box, true), msg = box.querySelector(".rp-err");
    box.addEventListener("click", function (e) {
      var a = e.target.getAttribute && e.target.getAttribute("data-a"); if (a === "no") ov.remove(); if (a !== "ok") return;
      st.t1 = Date.now(); save(L.n, st);
      var payload = { v: 1, c: A.course, n: U.name, k: U.klasse || "", p: U.fp, ln: L.n, var: V.id, t0: st.t0, t1: st.t1, prod: st.prod || "", link: st.link || "", g: st.g || "", f: st.f || {}, r: st.r || [], ch: st.ch || [] };
      var body = A.b64u(JSON.stringify(payload)), lnCode = "RLN1-" + body + "." + A.hash(A.salt + body, 11);
      var dur = Math.round((st.t1 - st.t0) / 60000), over = Math.max(0, dur - L.minutes);
      var B = [{ title: "Leistungsnachweis " + L.n + ": " + L.title }, { t: A.title + " · " + L.kind + "e Note · " + L.window },
        { t: "Name: " + U.name + (U.klasse ? "    Klasse: " + U.klasse : "") + (st.g ? "    Gruppe: " + st.g : "") },
        { t: "Start: " + new Date(st.t0).toLocaleString("de-DE") + "    Abgabe: " + new Date(st.t1).toLocaleString("de-DE") + "    Dauer: " + dur + " Min. (Vorgabe " + L.minutes + ")" + (over ? "  - überzogen: " + over + " Min." : "") },
        { h: "Aufgabe - Variante " + V.id + ": " + V.title }, { t: V.text }, { h: "Anforderungen" }];
      V.checks.forEach(function (c, i) { B.push({ t: ((st.ch || [])[i] ? "[x] " : "[ ] ") + c }); });
      if (L.product) { B.push({ h: L.product.label }); B.push({ t: "Gewählt: " + (st.prod || "-") }); B.push({ t: "Link: " + (st.link || "- (wird bei der Vorführung gezeigt)") }); }
      L.fields.forEach(function (fd) { var v = (st.f || {})[fd.id]; B.push({ h: fd.label });
        if (fd.type === "table") { B.push({ m: fd.cols.join(" | ") }); for (var r = 0; r < fd.rows; r++) B.push({ m: fd.cols.map(function (c, ci) { return ((v || [])[r] || [])[ci] || (ci === 0 ? String(r + 1) : ""); }).join(" | ") }); }
        else if (fd.type === "code") B.push({ m: v || "-" }); else B.push({ t: v || "-" }); });
      if (L.reflect) { B.push({ h: "Reflexion" }); D.reflect.forEach(function (q, i) { B.push({ t: (i + 1) + ". " + q }); B.push({ s: (st.r || [])[i] || "-" }); B.push({ gap: 1 }); }); }
      B.push({ h: "Bewertung (wird von der Lehrkraft ausgefüllt)" }); L.rubric.forEach(function (r) { B.push({ t: r[0] + ":  ____ / " + r[1] }); }); B.push({ t: "Summe: ____ / " + L.max + "      Note: ____" });
      var blob = A.pdfDoc(B, A.makeCode(), A.makeSave(), lnCode);
      var fname = "LN" + L.n + "_" + A.course + "_" + (U.klasse ? A.cleanName(U.klasse) + "_" : "") + A.cleanName(U.name) + "_" + A.stamp() + ".pdf";
      A.saveAndUpload(blob, fname, msg);
      box.querySelector('[data-a="ok"]').textContent = "📤 Nochmal speichern";
      box.querySelector('[data-a="no"]').textContent = "Schließen";
      box.querySelector('[data-a="no"]').onclick = function () { ov.remove(); detail(L.n); };
    });
  }

  function route() { var n = parseInt((location.hash || "").slice(1), 10); if (n) detail(n); else { clearInterval(timer); overview(); } window.scrollTo(0, 0); }
  function start() {
    A = window.RProg && window.RProg.api; if (!A || !D) return;
    U = A.user; PFX = A.prefix; LNS = (D.ln[A.course] || []);
    if (!U) { $("#ln-app").innerHTML = '<p class="foot">Bitte zuerst anmelden.</p>'; return; }
    document.addEventListener("input", onInput); document.addEventListener("change", function (e) { if (e.target.type === "checkbox" || e.target.type === "radio") onInput(e); });
    window.addEventListener("hashchange", route); route();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.LNTool = { unlockCode: function (c, n, salt, hash) { return hash(salt + "|LN|" + c + "|" + n, 13).slice(0, 6).toUpperCase(); } };
})();
