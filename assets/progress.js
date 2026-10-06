/* Anmeldung + Fortschrittscode für die Robotik-Lernplattformen.
   Kein Server: alles bleibt im Browser. Der Fortschrittscode wird bei der Lehrkraft abgegeben. */
(function () {
  "use strict";
  var me = document.currentScript;
  var COURSE = (me && me.getAttribute("data-course")) || "SPIKE";
  var PREFIX = (me && me.getAttribute("data-prefix")) || "spike";
  var TITLE = (me && me.getAttribute("data-title")) || "Robotik";
  var SALT = "robotik-wst-2026";

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }
  // cyrb53 – kurzer, deterministischer Hash (kein Kryptoschutz, reicht als Fingerabdruck/Prüfsumme)
  function hash(str, seed) {
    var h1 = 0xdeadbeef ^ (seed || 0), h2 = 0x41c6ce57 ^ (seed || 0);
    for (var i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  function norm(s) { return String(s || "").trim().replace(/\s+/g, " "); }
  function nkey(name, kl) { return (norm(kl) + "|" + norm(name)).toLowerCase(); }
  function b64u(str) { return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }

  function profiles() { try { return JSON.parse(ls("rprog:profiles") || "{}"); } catch (e) { return {}; } }
  function active() { var id = ss("rprog:active"); var p = profiles(); return id && p[id] ? Object.assign({ id: id }, p[id]) : null; }
  var USER = active();

  // Namensraum für alle gespeicherten Programme und Lösungen: jede/r hat eigenen Fortschritt (auch am gemeinsamen PC)
  window.RProg = {
    user: USER,
    k: function (key) { return USER ? "u:" + USER.id + ":" + key : "anon:" + key; }
  };

  function doneMap() {
    var d = {}, pre = window.RProg.k(PREFIX + ":");
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf(pre) === 0 && /:done$/.test(k)) {
          var rest = k.slice(pre.length, -5), j = rest.lastIndexOf(":");
          var file = rest.slice(0, j), ex = rest.slice(j + 1), L = (file.match(/^L\d+/) || [file])[0];
          (d[L] = d[L] || []).push(ex);
        }
      }
    } catch (e) {}
    Object.keys(d).forEach(function (L) { d[L].sort(); });
    return d;
  }
  // Versuche je Aufgabe: [Prüfungen bis zur Lösung, davon falsch, Tipps angesehen, Lösung angesehen 0/1]
  function statsMap() {
    var a = {}, pre = window.RProg.k(PREFIX + ":");
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf(pre) === 0 && /:st$/.test(k)) {
          var rest = k.slice(pre.length, -3), j = rest.lastIndexOf(":"), file = rest.slice(0, j), ex = rest.slice(j + 1), L = (file.match(/^L\d+/) || [file])[0];
          var s = {}; try { s = JSON.parse(localStorage.getItem(k)) || {}; } catch (e) {}
          (a[L] = a[L] || {})[ex] = [s.n || 0, s.f || 0, s.h || 0, s.s ? 1 : 0];
        }
      }
    } catch (e) {}
    return a;
  }
  function makeCode() {
    var payload = JSON.stringify({ v: 1, c: COURSE, n: USER.name, k: USER.klasse || "", p: USER.fp, t: Date.now(), d: doneMap(), a: statsMap() });
    var body = b64u(payload);
    return "ROBO1-" + body + "." + hash(SALT + body, 7);
  }

  // ---------------- Sicherung: alle gespeicherten Programme + gelösten Aufgaben (für einen anderen Computer)
  function unb64u(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return decodeURIComponent(escape(atob(s))); }
  function makeSave() {
    var data = {}, pre = window.RProg.k(PREFIX + ":");
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf(pre) === 0) data[k.slice(pre.length)] = localStorage.getItem(k); } } catch (e) {}
    var body = b64u(JSON.stringify({ v: 1, c: COURSE, p: USER.fp, t: Date.now(), s: data }));
    return "RSAVE1-" + body + "." + hash(SALT + body, 9);
  }
  // liest eine abgegebene/gespeicherte Datei (PDF oder Text) und spielt den Fortschritt ein
  function restore(text, fp, uid) {
    var re = /RSAVE1-([A-Za-z0-9_-]+)\.([a-z0-9]+)/g, m, best = null, wrong = 0;
    while ((m = re.exec(text))) {
      var d; try { d = JSON.parse(unb64u(m[1])); } catch (e) { continue; }
      if (hash(SALT + m[1], 9) !== m[2] || !d || d.c !== COURSE) { wrong++; continue; }
      if (d.p !== fp) { wrong++; continue; }
      if (!best || d.t > best.t) best = d;
    }
    if (!best) return { ok: false, msg: wrong ? "Diese Datei gehört zu einem anderen Namen/Kurs oder das Passwort stimmt nicht." : "In dieser Datei wurde kein Fortschritt gefunden. Nimm die PDF, die beim Abgeben gespeichert wurde." };
    var pre = "u:" + uid + ":" + PREFIX + ":", n = 0;
    Object.keys(best.s || {}).forEach(function (k) {
      var cur = ls(pre + k);
      if (cur === null) { ls(pre + k, best.s[k]); n++; return; }
      if (/:st$/.test(k)) { try { var A = JSON.parse(cur), B = JSON.parse(best.s[k]); ["n", "f", "h", "s"].forEach(function (x) { A[x] = Math.max(A[x] || 0, B[x] || 0); }); ls(pre + k, JSON.stringify(A)); } catch (e) {} }
    });
    return { ok: true, n: n, t: best.t };
  }
  function readFile(file, cb) { var fr = new FileReader(); fr.onload = function () { cb(String(fr.result || "")); }; fr.onerror = function () { cb(""); }; fr.readAsText(file); }
  function pickAndRestore() {
    var inp = el("input", { type: "file", accept: ".pdf,.txt,application/pdf,text/plain" });
    inp.addEventListener("change", function () { var f = inp.files[0]; if (!f) return; readFile(f, function (t) {
      var r = restore(t, USER.fp, USER.id);
      if (!r.ok) { alertBox(r.msg); return; }
      ls("rprog:restored", "1"); location.reload(); }); });
    inp.click();
  }
  function alertBox(text) { var d = el("div"); d.innerHTML = "<h2>Fortschritt laden</h2><p></p><div class='rp-row'><button class='rp-btn' type='button'>OK</button></div>"; d.querySelector("p").textContent = text; var ov = overlay(d, true); d.querySelector("button").onclick = function () { ov.remove(); }; }

  // ---------------- Oberfläche
  var css = ".rp-ov{position:fixed;inset:0;z-index:1000;background:rgba(10,16,22,.55);display:flex;align-items:center;justify-content:center;padding:16px}" +
    ".rp-box{background:var(--card,#fff);color:var(--ink,#1c2430);border-radius:14px;max-width:440px;width:100%;padding:22px;box-shadow:0 10px 40px rgba(0,0,0,.3);max-height:92vh;overflow:auto}" +
    ".rp-box h2{margin:0 0 4px;font-size:22px}.rp-box p{margin:6px 0 12px;color:var(--muted,#5b6672);font-size:14px}" +
    ".rp-box label{display:block;font-size:14px;font-weight:600;margin:10px 0 4px}" +
    ".rp-box input,.rp-box textarea{width:100%;font:inherit;font-size:16px;padding:9px 11px;border:1px solid var(--line,#d9e1e6);border-radius:8px;background:var(--bg,#f6f8f9);color:inherit}" +
    ".rp-box textarea{font-family:ui-monospace,Consolas,monospace;font-size:12px;height:110px;word-break:break-all}" +
    ".rp-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}" +
    ".rp-btn{font:inherit;font-size:15px;font-weight:600;border:0;border-radius:8px;padding:9px 16px;cursor:pointer;background:var(--pri,#1f6f78);color:#fff}" +
    ".rp-btn.sec{background:transparent;color:var(--pri,#1f6f78);border:1px solid var(--line,#d9e1e6)}" +
    ".rp-err{color:var(--red,#c0392b);font-size:14px;min-height:20px;margin-top:8px}" +
    ".rp-chip{display:inline-flex;gap:6px;align-items:center;font-size:14px;padding:4px 10px;border:1px solid var(--line,#d9e1e6);border-radius:999px;background:var(--pri-soft,#e3f0f1)}" +
    ".rp-chip button{font:inherit;font-size:13px;border:0;background:none;color:var(--pri,#1f6f78);cursor:pointer;padding:0 2px;text-decoration:underline}" +
    ".top .nav .rp-give{font-size:14px;padding:4px 10px;border-radius:999px;border:0;background:var(--pri,#1f6f78);color:#fff;cursor:pointer;font-weight:600}" +
    ".rp-sum{font-size:14px;background:var(--bg,#f6f8f9);border-radius:8px;padding:8px 10px;margin:8px 0}";
  function addCss() { var s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); }
  function el(tag, attrs, html) { var e = document.createElement(tag); if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); if (html != null) e.innerHTML = html; return e; }
  function overlay(inner, closable) {
    var ov = el("div", { "class": "rp-ov", role: "dialog", "aria-modal": "true" }); var box = el("div", { "class": "rp-box" }); box.appendChild(inner); ov.appendChild(box);
    if (closable) ov.addEventListener("click", function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov); return ov;
  }

  function loginDialog() {
    var f = el("form", { autocomplete: "off" });
    f.innerHTML = "<h2>Anmelden</h2><p>" + TITLE + ": Melde dich an, damit dein Fortschritt dir gehört. Merke dir dein Passwort – du brauchst es jedes Mal.</p>" +
      '<label for="rp-n">Vor- und Nachname</label><input id="rp-n" required maxlength="60">' +
      '<label for="rp-k">Klasse</label><input id="rp-k" maxlength="20" placeholder="z. B. 10a">' +
      '<label for="rp-p">Passwort (mind. 4 Zeichen)</label><input id="rp-p" type="password" required minlength="4" maxlength="40">' +
      '<label for="rp-f">Fortschritt von letztem Mal laden <span style="font-weight:400">(nur an einem anderen Computer nötig)</span></label>' +
      '<input id="rp-f" type="file" accept=".pdf,.txt,application/pdf,text/plain" style="font-size:14px;padding:7px">' +
      '<p style="margin:4px 0 0;font-size:12px">Wähle deine letzte Abgabe-Datei (Fortschritt_….pdf). Dann sind deine gelösten Aufgaben und Programme wieder da.</p>' +
      '<div class="rp-err" aria-live="polite"></div><div class="rp-row"><button class="rp-btn" type="submit">Anmelden</button></div>' +
      '<p style="margin-top:12px;font-size:12px">Am gleichen Computer bleibt dein Fortschritt gespeichert – einfach wieder mit Name, Klasse und Passwort anmelden. Bewahre deine Abgabe-PDF auf (z. B. in deinem OneDrive), dann kannst du an jedem Computer weitermachen.</p>';
    var ov = overlay(f, false);
    var err = f.querySelector(".rp-err");
    setTimeout(function () { f.querySelector("#rp-n").focus(); }, 50);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = norm(f.querySelector("#rp-n").value), kl = norm(f.querySelector("#rp-k").value), pw = f.querySelector("#rp-p").value;
      if (name.length < 3 || name.indexOf(" ") < 0) { err.textContent = "Bitte Vor- und Nachname eingeben."; return; }
      if (pw.length < 4) { err.textContent = "Das Passwort braucht mindestens 4 Zeichen."; return; }
      var id = hash(nkey(name, kl), 1), ph = hash(SALT + "|" + id + "|" + pw, 3), P = profiles();
      if (P[id] && P[id].ph !== ph) { err.textContent = "Falsches Passwort für diesen Namen in dieser Klasse."; return; }
      var fp = hash(nkey(name, kl) + "|" + pw, 5), file = f.querySelector("#rp-f").files[0];
      function finish() {
        if (!P[id]) P[id] = { name: name, klasse: kl, ph: ph, fp: fp, since: Date.now() };
        ls("rprog:profiles", JSON.stringify(P));
        if (ls("rprog:profiles") === null) { err.textContent = "Dieser Browser speichert nichts (privates Fenster?). Bitte normales Fenster verwenden."; return false; }
        ss("rprog:active", id); return true;
      }
      if (!file) { if (finish()) { ov.remove(); location.reload(); } return; }
      readFile(file, function (t) {
        var r = restore(t, fp, id);
        if (!r.ok) { err.textContent = r.msg; return; }
        if (finish()) { ls("rprog:restored", "1"); ov.remove(); location.reload(); }
      });
    });
  }

  // Abgabe-Link (OneDrive „Dateien anfordern“) steht in assets/abgabe.js und kann ohne die anderen Dateien geändert werden
  (function () { try { var sc = document.createElement("script"); sc.src = (me && me.src ? me.src.replace(/progress\.js(\?.*)?$/, "abgabe.js") : "assets/abgabe.js") + "?v=" + Math.floor(Date.now() / 3600000); sc.async = true; document.head.appendChild(sc); } catch (e) {} })();
  function uploadUrl() { var u = window.RPROG_UPLOAD && window.RPROG_UPLOAD[COURSE]; return /^https:\/\//.test(u || "") ? u : ""; }
  function stamp() { var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; }; return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "_" + p(d.getHours()) + p(d.getMinutes()); }
  // kleine PDF-Datei (Microsoft Forms erlaubt kein .txt). Der Code steht im Feld /Subject und lesbar auf der Seite.
  function pdfBlob(lines, code, save) {
    var latin = function (t) { return String(t).replace(/[^\x20-\x7e\xa0-\xff]/g, function (c) { return ({ "–": "-", "„": '"', "“": '"', "✓": "x" })[c] || "?"; }); };
    var pe = function (t) { return latin(t).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); };
    var y = 790, ops = ["BT /F1 18 Tf 50 " + y + " Td (" + pe(lines[0]) + ") Tj ET"]; y -= 34;
    lines.slice(1).forEach(function (l) { ops.push("BT /F1 12 Tf 50 " + y + " Td (" + pe(l) + ") Tj ET"); y -= 20; });
    y -= 14; ops.push("BT /F1 10 Tf 50 " + y + " Td (Fortschrittscode:) Tj ET"); y -= 16;
    for (var i = 0; i < code.length; i += 80) { ops.push("BT /F2 9 Tf 50 " + y + " Td (" + code.slice(i, i + 80) + ") Tj ET"); y -= 12; }
    var stream = ops.join("\n");
    var objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
      "<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream", "<< /Title (Fortschritt Robotik) /Subject (" + code + ") /Keywords (" + (save || "") + ") /Producer (Robotik-Lernplattform) >>"];
    var out = "%PDF-1.4\n", offs = [];
    objs.forEach(function (o, i) { offs.push(out.length); out += (i + 1) + " 0 obj\n" + o + "\nendobj\n"; });
    var xref = out.length;
    out += "xref\n0 " + (objs.length + 1) + "\n0000000000 65535 f \n" + offs.map(function (o) { return ("000000000" + o).slice(-10) + " 00000 n \n"; }).join("") +
      "trailer\n<< /Size " + (objs.length + 1) + " /Root 1 0 R /Info 7 0 R >>\nstartxref\n" + xref + "\n%%EOF\n";
    var bytes = new Uint8Array(out.length); for (var j = 0; j < out.length; j++) bytes[j] = out.charCodeAt(j) & 255;
    return new Blob([bytes], { type: "application/pdf" });
  }
  function giveDialog() {
    var code = makeCode(), d = doneMap(), n = 0; Object.keys(d).forEach(function (L) { n += d[L].length; });
    var clean = function (x) { return String(x || "").replace(/[^A-Za-z0-9ÄÖÜäöüß]+/g, "_").replace(/^_|_$/g, ""); };
    var fname = "Fortschritt_" + COURSE + "_" + (USER.klasse ? clean(USER.klasse) + "_" : "") + clean(USER.name) + "_" + stamp() + ".pdf";
    var url = uploadUrl();
    var f = el("div");
    f.innerHTML = "<h2>Fortschritt abgeben</h2><div class='rp-sum'><b></b><br>" + n + " Aufgabe(n) gelöst · Stand " + new Date().toLocaleString("de-DE") + "</div>" +
      (url ? "<p><b>So geht\'s:</b> Klicke auf „Abgeben“. Deine PDF-Datei wird gespeichert und das Abgabe-Formular öffnet sich (mit dem Schulkonto anmelden). Dort bei „Datei hochladen“ die Datei aus dem Download-Ordner wählen und „Absenden“ klicken.</p>"
           : "<p>Klicke auf „Datei speichern“ und gib die Datei so ab, wie es deine Lehrkraft sagt (z. B. in mebis).</p>") +
      '<div class="rp-row"><button class="rp-btn" data-a="give">' + (url ? "📤 Abgeben" : "💾 Datei speichern") + '</button><button class="rp-btn sec" data-a="close">Schließen</button></div>' +
      '<div class="rp-err" aria-live="polite" style="color:var(--green,#3b7d3a)"></div>' +
      '<p style="font-size:13px;margin-top:6px">💡 Bewahre die PDF auf (z. B. in deinem OneDrive): Mit ihr lädst du deinen Fortschritt an einem anderen Computer wieder.</p>' +
      '<details style="margin-top:8px"><summary style="cursor:pointer;font-size:14px;color:var(--muted,#5b6672)">Code anzeigen (falls die Datei nicht klappt)</summary><textarea readonly aria-label="Fortschrittscode" style="margin-top:8px"></textarea><div class="rp-row"><button class="rp-btn sec" data-a="copy">📋 Code kopieren</button></div></details>';
    f.querySelector(".rp-sum b").textContent = USER.name + (USER.klasse ? " · " + USER.klasse : "") + " · " + TITLE;
    var ta = f.querySelector("textarea"); ta.value = code;
    var msg = f.querySelector(".rp-err");
    var ov = overlay(f, true);
    f.addEventListener("click", function (e) {
      var a = e.target.getAttribute && e.target.getAttribute("data-a"); if (!a) return;
      if (a === "close") ov.remove();
      if (a === "copy") {
        ta.select(); var ok = false; try { ok = document.execCommand("copy"); } catch (x) {}
        if (navigator.clipboard) navigator.clipboard.writeText(code).then(function () { msg.textContent = "Code kopiert ✓"; }, function () { msg.textContent = ok ? "Code kopiert ✓" : "Bitte markieren und mit Strg+C kopieren."; });
        else msg.textContent = ok ? "Code kopiert ✓" : "Bitte markieren und mit Strg+C kopieren.";
      }
      if (a === "give") {
        var blob = pdfBlob(["Fortschritt " + TITLE, "Name: " + USER.name + (USER.klasse ? "   Klasse: " + USER.klasse : ""), "Stand: " + new Date().toLocaleString("de-DE"), "Gelöste Aufgaben: " + n, "", "Tipp: Diese Datei aufbewahren - damit kannst du deinen Fortschritt", "an jedem Computer wieder laden (beim Anmelden)."], code, makeSave()), u = URL.createObjectURL(blob), ln = el("a", { href: u, download: fname });
        document.body.appendChild(ln); ln.click(); ln.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
        if (url) { var w = window.open(url, "_blank"); if (w) { try { w.opener = null; } catch (x) {} } msg.textContent = "Datei „" + fname + "“ gespeichert ✓ – jetzt auf der Abgabe-Seite hochladen." + (w ? "" : " (Falls sich nichts geöffnet hat: Pop-ups erlauben und nochmal klicken.)"); }
        else msg.textContent = "Datei „" + fname + "“ gespeichert ✓";
      }
    });
  }

  function toast(t) { var d = el("div", { role: "status", style: "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:1001;background:var(--green,#3b7d3a);color:#fff;padding:10px 18px;border-radius:10px;font-size:15px;box-shadow:0 6px 20px rgba(0,0,0,.25)" }); d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 5000); }
  function header() {
    var nav = document.querySelector(".top .nav"); if (!nav) return;
    var chip = el("span", { "class": "rp-chip" }); chip.appendChild(document.createTextNode("👤 " + USER.name));
    var out = el("button", { type: "button", title: "Abmelden" }, "abmelden");
    out.addEventListener("click", function () { ss("rprog:active", null); location.reload(); });
    var load = el("button", { type: "button", title: "Fortschritt aus einer Abgabe-Datei laden" }, "laden");
    load.addEventListener("click", pickAndRestore);
    chip.appendChild(load); chip.appendChild(out);
    var give = el("button", { type: "button", "class": "rp-give" }, "📤 Fortschritt abgeben");
    give.addEventListener("click", giveDialog);
    nav.insertBefore(give, nav.firstChild); nav.insertBefore(chip, nav.firstChild);
  }

  function start() {
    addCss();
    if (/lehrer\.html$/.test(location.pathname)) return;
    if (!USER) loginDialog(); else { header(); if (ls("rprog:restored")) { ls("rprog:restored", null); toast("✓ Dein Fortschritt von letztem Mal wurde geladen."); } }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
