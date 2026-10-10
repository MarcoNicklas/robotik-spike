/* widgets.js – interaktive Simulationen und Rechner für die Lektionen.
   Aufruf: WIDGETS[name](root, cfg, onState)
   - cfg: Startwerte (optional)
   - onState(state): wird bei jeder Änderung mit dem aktuellen Zustand aufgerufen (für Ziele/Beobachtungen)
   Alle Widgets funktionieren mit Maus, Touch und Tastatur. */
(function () {
"use strict";
function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
function fmt(x, d) { return Number(x).toFixed(d == null ? 1 : d).replace(".", ","); }
function cssv(v, fb) { var x = getComputedStyle(document.documentElement).getPropertyValue(v).trim(); return x || fb; }
function noop() {}
function num(v, d) { var x = parseFloat(String(v).replace(",", ".")); return isNaN(x) ? d : x; }
function bind(root, fn) { root.querySelectorAll("input,select").forEach(function (i) { i.addEventListener("input", fn); i.addEventListener("change", fn); }); }
function sel(opts, val) { return opts.map(function (o) { var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return '<option value="' + v + '"' + (String(v) === String(val) ? " selected" : "") + ">" + l + "</option>"; }).join(""); }
var W = {};

/* ---------- Verbindungs-Labor: kraftschlüssig, formschlüssig, beweglich ---------- */
W.joint = function (root, cfg, on) {
  cfg = cfg || {}; on = on || noop;
  var C = { schwarz: { l: "schwarzer Verbinder (mit Reibung)", hold: 3.5, form: false }, grau: { l: "grauer Verbinder (ohne Reibung)", hold: 0.2, form: false },
            kreuz: { l: "Kreuzachse im Kreuzloch", hold: 1e9, form: true }, rund: { l: "Kreuzachse im runden Loch", hold: 0.2, form: false } };
  root.innerHTML = '<h4>🔩 Verbindungs-Labor</h4><div class="row"><label>Verbindung am Drehpunkt: <select class="c">' + sel(Object.keys(C).map(function (k) { return [k, C[k].l]; }), cfg.c || "schwarz") + '</select></label>' +
    '<label>Kraft am Balkenende <input type="range" class="f" min="0" max="10" step="0.5" value="' + (cfg.f || 0) + '"> <b class="vf"></b> N</label></div>' +
    '<canvas width="640" height="220" aria-label="Zwei Lochbalken, verbunden am Drehpunkt"></canvas><div class="row wout" aria-live="polite"></div>';
  var q = function (c) { return root.querySelector(c); }, cv = q("canvas"), ang = 0, raf = null;
  function state() { var c = C[q(".c").value], f = num(q(".f").value, 0); var turns = f > c.hold; return { c: q(".c").value, f: f, dreht: turns, form: c.form, hold: c.hold >= 1e8 ? null : c.hold }; }
  function draw() {
    var s = state(), g = cv.getContext("2d"); q(".vf").textContent = fmt(s.f, 1);
    var target = s.dreht ? Math.min(1.1, 0.12 + (s.f - (s.hold || 0)) * 0.12) : 0;
    ang += (target - ang) * 0.2;
    g.clearRect(0, 0, cv.width, cv.height);
    var cx = 300, cy = 120, hole = 22;
    function beam(x0, y0, n, a, col) { g.save(); g.translate(x0, y0); g.rotate(a); g.fillStyle = col; g.beginPath(); g.rect(-11, -11, (n - 1) * hole + 22, 22); g.fill(); g.fillStyle = "#fff"; for (var i = 0; i < n; i++) { g.beginPath(); g.arc(i * hole, 0, 6, 0, 7); g.fill(); } g.restore(); }
    beam(cx - 9 * hole, cy, 10, 0, "#9aa5ad");
    beam(cx, cy, 10, -ang, "#c14bb4");
    var c = s.c; g.fillStyle = c === "schwarz" ? "#222" : c === "grau" ? "#b8bfc5" : "#3a3a3a";
    if (c === "kreuz" || c === "rund") { g.fillRect(cx - 7, cy - 2, 14, 4); g.fillRect(cx - 2, cy - 7, 4, 14); } else { g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill(); }
    var ex = cx + Math.cos(-ang) * 9 * hole, ey = cy + Math.sin(-ang) * 9 * hole;
    if (s.f > 0) { g.strokeStyle = "#c0392b"; g.lineWidth = 3; g.beginPath(); g.moveTo(ex, ey + 12); g.lineTo(ex, ey + 12 + s.f * 7); g.stroke(); g.beginPath(); g.moveTo(ex, ey + 8); g.lineTo(ex - 6, ey + 18); g.lineTo(ex + 6, ey + 18); g.closePath(); g.fillStyle = "#c0392b"; g.fill(); g.font = "13px system-ui"; g.fillText("F = " + fmt(s.f, 1) + " N", ex + 10, ey + 30); }
    if (Math.abs(target - ang) > 0.005) raf = requestAnimationFrame(draw); else raf = null;
  }
  function upd() {
    var s = state();
    q(".wout").innerHTML = s.f === 0 ? "Erhöhe die Kraft und beobachte den Drehpunkt." :
      (s.dreht ? (s.c === "schwarz" ? '<b style="color:var(--red)">Die Verbindung rutscht durch</b> – die Reibung reicht nicht mehr.' : '<b>Der Balken dreht sich frei</b> – die Verbindung ist beweglich.') :
        (s.form ? '<b style="color:var(--green)">Hält – egal wie groß die Kraft ist</b> (die Form verhindert das Drehen).' : '<b style="color:var(--green)">Hält</b> – die Reibung reicht (noch).'));
    if (!raf) draw(); on(s);
  }
  bind(root, upd); upd();
};

/* ---------- Hebelgesetz ---------- */
W.lever = function (root, cfg, on) {
  cfg = cfg || {}; on = on || noop;
  root.innerHTML = '<h4>⚖️ Hebel-Labor: F₁ · a₁ = F₂ · a₂</h4>' +
    '<div class="row"><label>Links: Kraft F₁ <input type="range" class="f1" min="1" max="10" value="' + (cfg.f1 || 4) + '"> <b class="vf1"></b> N</label>' +
    '<label>Hebelarm a₁ <input type="range" class="a1" min="1" max="10" value="' + (cfg.a1 || 6) + '"> <b class="va1"></b> Löcher</label></div>' +
    '<div class="row"><label>Rechts: Kraft F₂ <input type="range" class="f2" min="1" max="12" value="' + (cfg.f2 || 2) + '"> <b class="vf2"></b> N</label>' +
    '<label>Hebelarm a₂ <input type="range" class="a2" min="1" max="10" value="' + (cfg.a2 || 3) + '"> <b class="va2"></b> Löcher</label></div>' +
    '<canvas width="640" height="210" aria-label="Hebel mit zwei Gewichten"></canvas><div class="row wout" aria-live="polite"></div>';
  var q = function (c) { return root.querySelector(c); }, cv = q("canvas");
  function draw() {
    var f1 = +q(".f1").value, a1 = +q(".a1").value, f2 = +q(".f2").value, a2 = +q(".a2").value;
    q(".vf1").textContent = f1; q(".va1").textContent = a1; q(".vf2").textContent = f2; q(".va2").textContent = a2;
    var m1 = f1 * a1, m2 = f2 * a2, tilt = Math.max(-0.25, Math.min(0.25, (m1 - m2) * 0.02));
    var g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height);
    var cx = 320, cy = 120, hole = 24;
    g.fillStyle = "#9aa5ad"; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - 26, cy + 70); g.lineTo(cx + 26, cy + 70); g.closePath(); g.fill();
    g.save(); g.translate(cx, cy); g.rotate(tilt);
    g.fillStyle = "#1c2430"; g.fillRect(-11 * hole, -8, 22 * hole, 16);
    g.fillStyle = "#fff"; for (var i = -10; i <= 10; i++) { g.beginPath(); g.arc(i * hole, 0, 5, 0, 7); g.fill(); }
    function weight(x, f, col) { var h = 14 + f * 5; g.fillStyle = col; g.fillRect(x - 14, -8 - h, 28, h); g.fillStyle = "#fff"; g.font = "bold 12px system-ui"; g.fillText(f + " N", x - 12, -12); }
    weight(-a1 * hole, f1, "#0090F5"); weight(a2 * hole, f2, "#FF4CB8");
    g.restore();
    var eq = m1 === m2;
    var st = eq ? '<b style="color:var(--green)">Gleichgewicht!</b>' : (m1 > m2 ? "Links überwiegt" : "Rechts überwiegt");
    q(".wout").innerHTML = 'Drehmoment links: ' + f1 + ' N · ' + a1 + ' = <span class="resl">' + m1 + '</span> &nbsp; rechts: ' + f2 + ' N · ' + a2 + ' = <span class="resl">' + m2 + '</span> &nbsp; → ' + st;
    on({ f1: f1, a1: a1, f2: f2, a2: a2, m1: m1, m2: m2, eq: eq });
  }
  bind(root, draw); draw();
};

/* ---------- Kippstabilität ---------- */
W.tip = function (root, cfg, on) {
  cfg = cfg || {}; on = on || noop;
  root.innerHTML = '<h4>🧱 Standsicherheit: Wann kippt der Roboter?</h4>' +
    '<div class="row"><label>Spurbreite b <input type="range" class="b" min="6" max="24" value="' + (cfg.b || 12) + '"> <b class="vb"></b> cm</label>' +
    '<label>Schwerpunkthöhe h <input type="range" class="h" min="2" max="20" value="' + (cfg.h || 6) + '"> <b class="vh"></b> cm</label>' +
    '<label>Rampe <input type="range" class="r" min="0" max="70" value="' + (cfg.r || 20) + '"> <b class="vr"></b>°</label></div>' +
    '<canvas width="640" height="240" aria-label="Roboter auf einer Rampe"></canvas><div class="row wout" aria-live="polite"></div>';
  var q = function (c) { return root.querySelector(c); }, cv = q("canvas");
  function draw() {
    var b = +q(".b").value, h = +q(".h").value, r = +q(".r").value;
    q(".vb").textContent = b; q(".vh").textContent = h; q(".vr").textContent = r;
    var crit = Math.atan((b / 2) / h) * 180 / Math.PI, kippt = r > crit;
    var g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height);
    var s = 8, ox = 120, oy = 210, a = -r * Math.PI / 180;
    g.save(); g.translate(ox, oy); g.rotate(a);
    g.fillStyle = "#cfd6db"; g.fillRect(-60, 0, 520, 14);
    g.translate(220, 0);
    if (kippt) { g.translate(b / 2 * s, 0); g.rotate(-0.35); g.translate(-b / 2 * s, 0); }
    g.fillStyle = "#f5c518"; g.fillRect(-b / 2 * s, -Math.max(2 * h, 8) * s * 0.55 - 10, b * s, Math.max(2 * h, 8) * s * 0.55);
    g.fillStyle = "#222"; g.beginPath(); g.arc(-b / 2 * s + 10, -10, 10, 0, 7); g.arc(b / 2 * s - 10, -10, 10, 0, 7); g.fill();
    g.fillStyle = "#c0392b"; g.beginPath(); g.arc(0, -h * s * 0.9, 7, 0, 7); g.fill();
    g.strokeStyle = "#c0392b"; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(0, -h * s * 0.9); g.lineTo(Math.sin(r * Math.PI / 180) * 120, -h * s * 0.9 + Math.cos(r * Math.PI / 180) * 120); g.stroke(); g.setLineDash([]);
    g.restore();
    q(".wout").innerHTML = 'Kippwinkel = arctan((b/2) : h) = <span class="resl">' + fmt(crit, 1) + '°</span> → bei ' + r + '° ' + (kippt ? '<b style="color:var(--red)">kippt der Roboter!</b>' : '<b style="color:var(--green)">steht er sicher.</b>');
    on({ b: b, h: h, r: r, crit: Math.round(crit * 10) / 10, kippt: kippt });
  }
  bind(root, draw); draw();
};

/* ---------- Fachwerk: Viereck oder Dreieck? Zug und Druck ---------- */
W.truss = function (root, cfg, on) {
  cfg = cfg || {}; on = on || noop;
  root.innerHTML = '<h4>🌉 Fachwerk-Labor: Zug und Druck</h4><div class="row"><label>Bauform: <select class="sh">' +
    sel([["viereck", "Viereck-Felder (ohne Streben)"], ["diagonal", "Viereck-Felder mit Diagonalen (Dreiecke)"]], cfg.sh || "viereck") + '</select></label>' +
    '<label>Last in der Mitte <input type="range" class="l" min="0" max="10" value="' + (cfg.l || 0) + '"> <b class="vl"></b> N</label>' +
    '<label><input type="checkbox" class="fz"' + (cfg.fz ? " checked" : "") + '> Kräfte farbig anzeigen</label></div>' +
    '<canvas width="640" height="230" aria-label="Brücke aus Balken"></canvas><div class="row wout" aria-live="polite"></div>' +
    '<p style="font-size:13px;color:var(--muted);margin:4px 0 0">Farben: <b style="color:#c0392b">rot = Zug</b> (Stab wird auseinandergezogen), <b style="color:#1f6fd1">blau = Druck</b> (Stab wird zusammengedrückt).</p>';
  var q = function (c) { return root.querySelector(c); }, cv = q("canvas");
  function draw() {
    var sh = q(".sh").value, L = +q(".l").value, fz = q(".fz").checked; q(".vl").textContent = L;
    var g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height);
    var x0 = 80, w = 120, y0 = 70, hgt = 80, n = 4, shear = sh === "viereck" ? Math.min(60, L * 7) : 0, sag = sh === "viereck" ? L * 3 : L * 0.6;
    function P(i, top) { var x = x0 + i * w, mid = 1 - Math.abs(i - n / 2) / (n / 2); return [x + (top ? shear * (i < n / 2 ? 1 : -1) * mid * 0.5 : 0), (top ? y0 : y0 + hgt) + sag * mid]; }
    g.fillStyle = "#9aa5ad"; g.beginPath(); g.moveTo(x0 - 20, y0 + hgt + 30); g.lineTo(x0, y0 + hgt + 2); g.lineTo(x0 + 20, y0 + hgt + 30); g.fill();
    g.beginPath(); g.moveTo(x0 + n * w - 20, y0 + hgt + 30); g.lineTo(x0 + n * w, y0 + hgt + 2); g.lineTo(x0 + n * w + 20, y0 + hgt + 30); g.fill();
    function bar(a, b, kind) { g.strokeStyle = fz && L > 0 ? (kind === "z" ? "#c0392b" : kind === "d" ? "#1f6fd1" : "#5b6672") : "#5b6672"; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    for (var i = 0; i < n; i++) { bar(P(i, true), P(i + 1, true), "d"); bar(P(i, false), P(i + 1, false), "z"); }
    for (var j = 0; j <= n; j++) bar(P(j, true), P(j, false), "o");
    if (sh === "diagonal") for (var k = 0; k < n; k++) { if (k < n / 2) bar(P(k, true), P(k + 1, false), "d"); else bar(P(k, false), P(k + 1, true), "d"); }
    var m = P(n / 2, false);
    if (L > 0) { g.fillStyle = "#d98e04"; g.fillRect(m[0] - 18, m[1] + 8, 36, 14 + L * 3); g.fillStyle = "#fff"; g.font = "bold 12px system-ui"; g.fillText(L + " N", m[0] - 12, m[1] + 22); }
    var collapsed = sh === "viereck" && L >= 6;
    q(".wout").innerHTML = L === 0 ? "Hänge eine Last an die Brücke." : (collapsed ? '<b style="color:var(--red)">Die Viereck-Felder verschieben sich zum Parallelogramm – die Brücke versagt.</b>' :
      (sh === "viereck" ? 'Die Felder verformen sich schon deutlich (Durchbiegung ≈ ' + fmt(sag, 0) + ' px).' : '<b style="color:var(--green)">Die Dreiecke behalten ihre Form</b> – Durchbiegung nur ≈ ' + fmt(sag, 0) + ' px.'));
    on({ sh: sh, l: L, fz: fz, collapsed: collapsed });
  }
  bind(root, draw); draw();
};

/* ---------- Zahnradgetriebe ---------- */
W.gear = function (root, cfg, on) {
  cfg = cfg || {}; on = on || noop;
  var Z = [8, 12, 20, 24, 28, 36, 40];
  root.innerHTML = '<h4>⚙️ Getriebe-Simulator mit SPIKE-Zahnrädern</h4>' +
    '<div class="row"><label>Antriebsrad (am Motor): <select class="z1">' + sel(Z, cfg.z1 || 24) + '</select> Zähne</label>' +
    '<label>Abtriebsrad: <select class="z2">' + sel(Z, cfg.z2 || 24) + '</select> Zähne</label>' +
    '<label>Motordrehzahl: <input type="number" class="n1" value="' + (cfg.n1 || 150) + '" min="1" max="300" style="width:80px"> U/min</label></div>' +
    '<canvas width="640" height="230" aria-label="Zwei Zahnräder"></canvas><div class="row wout" aria-live="polite"></div>';
  var s1 = root.querySelector(".z1"), s2 = root.querySelector(".z2"), n1 = root.querySelector(".n1"), cv = root.querySelector("canvas"), out = root.querySelector(".wout");
  var ang = 0, last = performance.now(), alive = true;
  function gearPath(g, cx, cy, z, r, a, col) {
    g.save(); g.translate(cx, cy); g.rotate(a); g.fillStyle = col; g.beginPath();
    for (var i = 0; i < z; i++) {
      var a0 = i / z * 2 * Math.PI, a1 = (i + 0.25) / z * 2 * Math.PI, a2 = (i + 0.5) / z * 2 * Math.PI, a3 = (i + 0.75) / z * 2 * Math.PI, ro = r + 6, ri = r - 3;
      g.lineTo(Math.cos(a0) * ri, Math.sin(a0) * ri); g.lineTo(Math.cos(a1) * ro, Math.sin(a1) * ro); g.lineTo(Math.cos(a2) * ro, Math.sin(a2) * ro); g.lineTo(Math.cos(a3) * ri, Math.sin(a3) * ri);
    }
    g.closePath(); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill();
    g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.arc(r * 0.6, 0, 4, 0, 7); g.fill(); g.restore();
  }
  function info() {
    var z1 = +s1.value, z2 = +s2.value, rpm = Math.max(0, num(n1.value, 0)), i = z2 / z1, n2 = rpm / i;
    out.innerHTML = 'Übersetzung i = ' + z2 + ' : ' + z1 + ' = <span class="resl">' + fmt(i, 2) + '</span> · Abtrieb: <span class="resl">' + fmt(n2, 0) + ' U/min</span> · Drehmoment ×<span class="resl">' + fmt(i, 2) + '</span> · ' +
      (i > 1 ? "<b>Untersetzung</b>: langsamer, aber kräftiger" : i < 1 ? "<b>Übersetzung ins Schnelle</b>: schneller, aber schwächer" : "gleich schnell");
    on({ z1: z1, z2: z2, n1: rpm, i: Math.round(i * 100) / 100, n2: Math.round(n2 * 10) / 10 });
  }
  function frame(now) {
    if (!alive || !document.body.contains(cv)) return;
    var z1 = +s1.value, z2 = +s2.value, rpm = Math.max(0, num(n1.value, 0));
    var dt = (now - last) / 1000; last = now; ang += dt * rpm / 60 * 2 * Math.PI * 0.25;
    var g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height);
    var k = 2.4, r1 = z1 * k, r2 = z2 * k, cy = 115, cx1 = 170, cx2 = cx1 + r1 + r2 + 4;
    gearPath(g, cx1, cy, z1, r1, ang, "#0090F5"); gearPath(g, cx2, cy, z2, r2, -ang * z1 / z2 + Math.PI / z2, "#9aa5ad");
    g.fillStyle = "#1c2430"; g.font = "13px system-ui"; g.fillText("Antrieb " + z1 + " Z.", cx1 - 30, cy + r1 + 26); g.fillText("Abtrieb " + z2 + " Z.", cx2 - 30, Math.min(225, cy + r2 + 26));
    requestAnimationFrame(frame);
  }
  bind(root, info); info(); requestAnimationFrame(frame);
};

/* ---------- Rad und Strecke ---------- */
W.wheel = function (root, cfg, on) {
  cfg = cfg || {}; on = on || noop;
  root.innerHTML = '<h4>🛞 Rad-Rechner</h4><div class="row"><label>Raddurchmesser <input type="number" class="d" value="' + (cfg.d || 5.6) + '" step="0.1" style="width:70px"> cm</label>' +
    '<label>Strecke <input type="number" class="s" value="' + (cfg.s || 50) + '" style="width:80px"> cm</label></div><div class="row wout" aria-live="polite"></div>';
  var q = function (c) { return root.querySelector(c); };
  function calc() {
    var d = num(q(".d").value, 0), s = num(q(".s").value, 0), U = Math.PI * d, rev = U ? s / U : 0, deg = Math.round(rev * 360);
    q(".wout").innerHTML = 'Umfang U = π · d = <span class="resl">' + fmt(U, 2) + ' cm</span> · Umdrehungen = s : U = <span class="resl">' + fmt(rev, 2) + '</span> · Radgrad = <span class="resl">' + deg + '°</span>';
    on({ d: d, s: s, U: Math.round(U * 100) / 100, rev: Math.round(rev * 100) / 100, deg: deg });
  }
  bind(root, calc); calc();
};

/* ---------- Akku ---------- */
W.battery = function (root, cfg, on) {
  cfg = cfg || {}; on = on || noop;
  root.innerHTML = '<h4>🔋 Akku-Simulator für den SPIKE-Hub</h4>' +
    '<div class="row"><label>Kapazität <input type="number" class="cap" value="' + (cfg.cap || 2100) + '" style="width:90px"> mAh</label>' +
    '<label>Spannung <input type="number" class="u" value="7.3" step="0.1" style="width:70px"> V</label></div>' +
    '<div class="row"><label><input type="checkbox" class="m1"' + (cfg.m1 === false ? "" : " checked") + '> 2 Fahrmotoren (je ≈ 250 mA)</label>' +
    '<label><input type="checkbox" class="s"' + (cfg.s === false ? "" : " checked") + '> Hub (≈ 120 mA)</label><label><input type="checkbox" class="l"' + (cfg.l ? " checked" : "") + '> Lichtmatrix hell (≈ 60 mA)</label>' +
    '<label><input type="checkbox" class="x"' + (cfg.x ? " checked" : "") + '> Lautsprecher dauernd (≈ 370 mA)</label></div>' +
    '<div class="row wout" aria-live="polite"></div><p style="font-size:13px;color:var(--muted)">Die Stromwerte sind grobe Schätzwerte für Übungszwecke.</p>';
  var q = function (c) { return root.querySelector(c); };
  function calc() {
    var cap = num(q(".cap").value, 0), u = num(q(".u").value, 0);
    var I = (q(".m1").checked ? 500 : 0) + (q(".s").checked ? 120 : 0) + (q(".l").checked ? 60 : 0) + (q(".x").checked ? 370 : 0);
    var t = I ? cap / I : 0, E = u * cap / 1000;
    q(".wout").innerHTML = 'Gesamtstrom ≈ <span class="resl">' + I + ' mA</span> · Laufzeit t = Kapazität : Strom ≈ <span class="resl">' + fmt(t, 1) + ' h</span> (' + Math.round(t * 60) + ' min) · Energie E = U · Q ≈ <span class="resl">' + fmt(E, 1) + ' Wh</span>';
    on({ cap: cap, u: u, I: I, t: Math.round(t * 100) / 100, E: Math.round(E * 10) / 10 });
  }
  bind(root, calc); calc();
};

/* ---------- Verkabelung: Welche Ports braucht das Fahrgestell? ---------- */
W.ports = function (root, cfg, on) {
  cfg = cfg || {}; on = on || noop;
  var P = ["A", "B", "C", "D", "E", "F"];
  root.innerHTML = '<h4>🔌 Verkabelungs-Simulator (Fahrgestell 1)</h4>' +
    '<div class="row"><label>Kabel linker Motor → Port <select class="pl">' + sel(P, cfg.pl || "C") + '</select></label>' +
    '<label>Kabel rechter Motor → Port <select class="pr">' + sel(P, cfg.pr || "D") + '</select></label></div>' +
    '<div class="row"><span>Programm: <code>setze Bewegungsmotoren auf <select class="ql">' + sel(P, "C") + '</select> + <select class="qr">' + sel(P, "D") + '</select></code> · <code>bewege vorwärts für 20 cm</code></span>' +
    '<button type="button" class="btn run go">▶ Programm starten</button></div>' +
    '<canvas width="640" height="230" aria-label="Fahrgestell von oben"></canvas><div class="row wout" aria-live="polite"></div>';
  var q = function (c) { return root.querySelector(c); }, cv = q("canvas"), pose = null, raf = null;
  function result() {
    var pl = q(".pl").value, pr = q(".pr").value, ql = q(".ql").value, qr = q(".qr").value;
    // Bewegungsmotoren: erster Port = links (dreht für "vorwärts" so, dass das linke Rad vorwärts läuft), zweiter = rechts
    function wheel(port, side) { if (port === ql) return side === "L" ? 1 : -1; if (port === qr) return side === "R" ? 1 : -1; return 0; }
    var vl = wheel(pl, "L"), vr = wheel(pr, "R");
    if (pl === pr) return { vl: 0, vr: 0, txt: "Zwei Motoren können nicht am selben Port hängen.", r: "fehler" };
    var r = vl === 1 && vr === 1 ? "vorwärts" : vl === -1 && vr === -1 ? "rückwärts" : vl === 0 && vr === 0 ? "steht" : vl === 0 || vr === 0 ? "dreht im Kreis" : "dreht auf der Stelle";
    var txt = { "vorwärts": "Der Roboter fährt 20 cm geradeaus vorwärts. ✓", "rückwärts": "Der Roboter fährt rückwärts statt vorwärts!", "steht": "Nichts bewegt sich – das Programm spricht andere Ports an.", "dreht im Kreis": "Nur ein Rad dreht sich – der Roboter dreht im Kreis.", "dreht auf der Stelle": "Die Räder drehen gegeneinander – der Roboter dreht auf der Stelle." }[r];
    return { vl: vl, vr: vr, txt: txt, r: r };
  }
  function draw() {
    var g = cv.getContext("2d"), k = 3; g.clearRect(0, 0, cv.width, cv.height);
    g.strokeStyle = "#eef1f3"; for (var x = 0; x < 640; x += 30) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 230); g.stroke(); }
    var p = pose || { x: 260, y: 115, h: 0 };
    g.save(); g.translate(p.x, p.y); g.rotate(-p.h);
    g.fillStyle = "#222"; g.fillRect(-9 * k, -8 * k, 18 * k, 3 * k); g.fillRect(-9 * k, 5 * k, 18 * k, 3 * k);
    g.fillStyle = "#f5c518"; g.fillRect(-12 * k, -5 * k, 26 * k, 10 * k); g.fillStyle = "#f4f6f7"; g.fillRect(-8 * k, -4 * k, 14 * k, 8 * k);
    g.fillStyle = "#D98E04"; g.beginPath(); g.moveTo(17 * k, 0); g.lineTo(14 * k, -2 * k); g.lineTo(14 * k, 2 * k); g.fill();
    g.fillStyle = "#1c2430"; g.font = "bold 12px system-ui"; g.fillText("L:" + q(".pl").value, -10 * k, -9 * k); g.fillText("R:" + q(".pr").value, -10 * k, 13 * k);
    g.restore();
  }
  function run() {
    var r = result(); if (raf) cancelAnimationFrame(raf);
    pose = { x: 260, y: 115, h: 0 }; var t0 = performance.now();
    (function step(now) {
      var t = Math.min(1.6, (now - t0) / 1000), v = 60;                // px/s
      var vl = r.vl * v, vr = r.vr * v, w = (vr - vl) / 48;          // Spur 48 px
      var dt = 1 / 60; pose.h += w * dt; pose.x += (vl + vr) / 2 * Math.cos(pose.h) * dt; pose.y -= (vl + vr) / 2 * Math.sin(pose.h) * dt;
      draw(); if (t < 1.6) raf = requestAnimationFrame(step); else { raf = null; q(".wout").innerHTML = '<b>' + r.txt + '</b>'; on(st(true)); }
    })(t0);
  }
  function st(ran) { var r = result(); return { pl: q(".pl").value, pr: q(".pr").value, ql: q(".ql").value, qr: q(".qr").value, r: r.r, ran: !!ran }; }
  q(".go").addEventListener("click", run);
  bind(root, function () { pose = null; draw(); q(".wout").textContent = "Starte das Programm, um die Wirkung zu sehen."; on(st(false)); });
  draw(); q(".wout").textContent = "Starte das Programm, um die Wirkung zu sehen."; on(st(false));
};

/* ---------- Gyrosensor im Hub ---------- */
W.gyro = function (root, cfg, on) {
  cfg = cfg || {}; on = on || noop;
  root.innerHTML = '<h4>🧭 Gyrosensor im Hub (Gierwinkel)</h4><div class="row">' +
    '<button type="button" class="btn" data-d="-90">↺ 90° links</button><button type="button" class="btn" data-d="-15">↺ 15°</button>' +
    '<button type="button" class="btn" data-d="15">15° ↻</button><button type="button" class="btn" data-d="90">90° rechts ↻</button>' +
    '<button type="button" class="btn z">setze Gierwinkel auf 0</button></div>' +
    '<canvas width="640" height="240" aria-label="Roboter von oben mit Gierwinkel-Anzeige"></canvas><div class="row wout" aria-live="polite"></div>';
  var q = function (c) { return root.querySelector(c); }, cv = q("canvas"), head = 0, off = 0, shown = 0, raf = null, resets = 0;
  function yaw() { var y = head - off; return ((y + 180) % 360 + 360) % 360 - 180; }
  function draw() {
    shown += (head - shown) * 0.2; if (Math.abs(head - shown) < 0.3) shown = head;
    var g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height);
    var cx = 220, cy = 120; g.strokeStyle = "#d9e1e6"; g.beginPath(); g.arc(cx, cy, 95, 0, 7); g.stroke();
    g.fillStyle = "#5b6672"; g.font = "12px system-ui"; g.fillText("0°", cx - 6, cy - 100); g.fillText("90°", cx + 100, cy + 4); g.fillText("−90°", cx - 130, cy + 4); g.fillText("±180°", cx - 16, cy + 112);
    g.save(); g.translate(cx, cy); g.rotate(shown * Math.PI / 180);
    g.fillStyle = "#222"; g.fillRect(-36, -18, 10, 36); g.fillRect(26, -18, 10, 36);
    g.fillStyle = "#f5c518"; g.fillRect(-26, -40, 52, 74); g.fillStyle = "#f4f6f7"; g.fillRect(-18, -28, 36, 44);
    g.fillStyle = "#D98E04"; g.beginPath(); g.moveTo(0, -56); g.lineTo(-8, -42); g.lineTo(8, -42); g.fill(); g.restore();
    g.fillStyle = "#1c2430"; g.font = "bold 28px system-ui"; g.fillText("Gierwinkel: " + yaw() + "°", 380, 110);
    g.font = "13px system-ui"; g.fillStyle = "#5b6672"; g.fillText("(im Uhrzeigersinn positiv)", 380, 134);
    if (shown !== head) raf = requestAnimationFrame(draw); else raf = null;
  }
  function upd() { q(".wout").innerHTML = 'Der Roboter hat sich seit dem letzten Zurücksetzen um <span class="resl">' + yaw() + '°</span> gedreht.'; if (!raf) draw(); on({ yaw: yaw(), head: head, resets: resets }); }
  root.querySelectorAll("[data-d]").forEach(function (b) { b.addEventListener("click", function () { head += +b.getAttribute("data-d"); upd(); }); });
  q(".z").addEventListener("click", function () { off = head; resets++; upd(); });
  upd();
};

/* ---------- Ultraschall: Echo-Laufzeit ---------- */
W.echo = function (root, cfg, on) {
  cfg = cfg || {}; on = on || noop;
  root.innerHTML = '<h4>🔊 Ultraschall-Simulator: Echo und Abstand</h4><div class="row"><label>Abstand zum Hindernis <input type="range" class="d" min="4" max="200" value="' + (cfg.d || 60) + '"> <b class="vd"></b> cm</label>' +
    '<button type="button" class="btn run go">📡 Impuls senden</button></div><canvas width="640" height="170" aria-label="Schallimpuls zwischen Sensor und Wand"></canvas><div class="row wout" aria-live="polite"></div>';
  var q = function (c) { return root.querySelector(c); }, cv = q("canvas"), raf = null, pulse = null, measured = null;
  function geo() { var d = +q(".d").value; return { d: d, x: 70 + d * 2.6 }; }
  function draw() {
    var g = cv.getContext("2d"), G = geo(); g.clearRect(0, 0, cv.width, cv.height);
    g.fillStyle = "#cfd6db"; g.fillRect(20, 60, 50, 50); g.fillStyle = "#333"; g.beginPath(); g.arc(70, 75, 7, 0, 7); g.arc(70, 97, 7, 0, 7); g.fill();
    g.fillStyle = "#8d6e4a"; g.fillRect(Math.min(G.x, 620), 20, 14, 130);
    if (pulse) { g.strokeStyle = pulse.back ? "#1f6fd1" : "#d98e04"; g.lineWidth = 3; g.beginPath(); g.arc(pulse.x, 86, 16, -0.8, 0.8); g.stroke(); }
    g.fillStyle = "#5b6672"; g.font = "12px system-ui"; g.fillText("Sensor", 22, 128);
  }
  function fire() {
    if (raf) cancelAnimationFrame(raf); var G = geo(), t0 = performance.now(), dur = 300 + G.d * 8;
    (function st(now) {
      var f = (now - t0) / dur; if (f >= 1) { pulse = null; measured = G.d; draw(); res(); return; }
      pulse = f < 0.5 ? { x: 76 + (G.x - 76) * f * 2, back: false } : { x: G.x - (G.x - 76) * (f - 0.5) * 2, back: true };
      draw(); raf = requestAnimationFrame(st);
    })(t0);
  }
  function res() {
    var d = measured, t = d != null ? 2 * d / 100 / 343 * 1000 : null;
    q(".wout").innerHTML = d == null ? "Sende einen Impuls und miss die Zeit bis zum Echo." : 'Echo nach <span class="resl">' + fmt(t, 2) + ' ms</span> → Abstand = 343 m/s · ' + fmt(t, 2) + ' ms : 2 = <span class="resl">' + fmt(d, 0) + ' cm</span>';
    on({ d: +q(".d").value, t: t != null ? Math.round(t * 100) / 100 : null, measured: d });
  }
  q(".go").addEventListener("click", fire);
  q(".d").addEventListener("input", function () { q(".vd").textContent = q(".d").value; measured = null; draw(); res(); });
  q(".vd").textContent = q(".d").value; draw(); res();
};

/* ---------- Lenkung: Was macht „bewege mit Lenkung …“? ---------- */
W.steer = function (root, cfg, on) {
  cfg = cfg || {}; on = on || noop;
  root.innerHTML = '<h4>🛞 Lenkungs-Simulator</h4><div class="row"><label>Lenkung <input type="range" class="s" min="-100" max="100" step="10" value="' + (cfg.s || 0) + '"> <b class="vs"></b></label>' +
    '<label>Fahrzeit <input type="range" class="t" min="1" max="4" step="0.5" value="2"> <b class="vt"></b> s</label></div>' +
    '<canvas width="640" height="260" aria-label="Fahrspur je nach Lenkung"></canvas><div class="row wout" aria-live="polite"></div>';
  var q = function (c) { return root.querySelector(c); }, cv = q("canvas");
  function speeds(s) { var l = 100, r = 100; if (s > 0) r = 100 - 2 * s; else if (s < 0) l = 100 + 2 * s; return [l, r]; }
  function draw() {
    var s = +q(".s").value, T = +q(".t").value; q(".vs").textContent = s; q(".vt").textContent = fmt(T, 1);
    var v = speeds(s), g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height);
    var x = 320, y = 210, h = -Math.PI / 2, sc = 0.55, dt = 0.02, track = 11.2;
    g.strokeStyle = "rgba(31,111,120,.8)"; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y);
    for (var t = 0; t < T; t += dt) { var vl = v[0] * 0.5, vr = v[1] * 0.5, w = (vl - vr) / track; h += w * dt; x += (vl + vr) / 2 * Math.cos(h) * dt * sc * 3; y += (vl + vr) / 2 * Math.sin(h) * dt * sc * 3; g.lineTo(x, y); }
    g.stroke();
    g.save(); g.translate(x, y); g.rotate(h + Math.PI / 2); g.fillStyle = "#f5c518"; g.fillRect(-12, -16, 24, 32); g.fillStyle = "#D98E04"; g.beginPath(); g.moveTo(0, -24); g.lineTo(-6, -16); g.lineTo(6, -16); g.fill(); g.restore();
    function barv(xx, val, lab) { g.fillStyle = "#e3f0f1"; g.fillRect(xx, 30, 26, 160); g.fillStyle = val >= 0 ? "#3b7d3a" : "#c0392b"; var hh = Math.abs(val) * 0.8; g.fillRect(xx, val >= 0 ? 110 - hh : 110, 26, hh); g.fillStyle = "#1c2430"; g.font = "12px system-ui"; g.fillText(lab, xx - 4, 206); g.fillText(Math.round(val) + " %", xx - 4, 222); }
    barv(30, v[0], "links"); barv(80, v[1], "rechts");
    var kind = s === 0 ? "geradeaus" : Math.abs(s) === 100 ? "Drehung auf der Stelle " + (s > 0 ? "rechts" : "links") : Math.abs(s) === 50 ? "Drehung um das stehende " + (s > 0 ? "rechte" : "linke") + " Rad" : "Kurve " + (s > 0 ? "rechts" : "links");
    q(".wout").innerHTML = 'Linkes Rad <span class="resl">' + v[0] + ' %</span> · rechtes Rad <span class="resl">' + v[1] + ' %</span> → <b>' + kind + '</b>';
    on({ s: s, vl: v[0], vr: v[1], kind: kind });
  }
  bind(root, draw); draw();
};

/* ---------- Vielecke fahren ---------- */
W.polygon = function (root, cfg, on) {
  cfg = cfg || {}; on = on || noop;
  root.innerHTML = '<h4>🔷 Vieleck-Planer</h4><div class="row"><label>Anzahl Ecken n <input type="range" class="n" min="3" max="12" value="' + (cfg.n || 4) + '"> <b class="vn"></b></label>' +
    '<label>Drehwinkel je Ecke <input type="number" class="w" value="' + (cfg.w || 90) + '" style="width:70px">°</label></div>' +
    '<canvas width="640" height="260" aria-label="Gefahrene Figur"></canvas><div class="row wout" aria-live="polite"></div>';
  var q = function (c) { return root.querySelector(c); }, cv = q("canvas");
  function draw() {
    var n = +q(".n").value, w = num(q(".w").value, 0); q(".vn").textContent = n;
    var g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height);
    var side = Math.min(90, 520 / n), x = 260, y = 230, h = 0;
    g.strokeStyle = "#1f6f78"; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y);
    for (var i = 0; i < n; i++) { x += side * Math.cos(h); y -= side * Math.sin(h); g.lineTo(x, y); h += w * Math.PI / 180; }
    g.stroke(); g.fillStyle = "#c0392b"; g.beginPath(); g.arc(260, 230, 5, 0, 7); g.fill();
    var closed = Math.hypot(x - 260, y - 230) < 2, ideal = 360 / n;
    q(".wout").innerHTML = 'n = ' + n + ' · Drehwinkel ' + fmt(w, 1) + '° · Radgrad je Drehung (Lenkung 100) = Drehwinkel · 2 = <span class="resl">' + fmt(w * 2, 0) + '</span> · ' + (closed ? '<b style="color:var(--green)">Die Figur schließt sich!</b>' : 'Die Figur schließt sich nicht.');
    on({ n: n, w: w, closed: closed, ideal: ideal, rg: w * 2 });
  }
  bind(root, draw); draw();
};

/* ---------- Gyro-Regelung (P-Regler) ---------- */
W.pcontrol = function (root, cfg, on) {
  cfg = cfg || {}; on = on || noop;
  root.innerHTML = '<h4>📈 Regel-Simulator: geradeaus trotz ungleicher Motoren</h4><div class="row"><label>Abweichung der Motoren <input type="range" class="dr" min="0" max="10" value="' + (cfg.dr != null ? cfg.dr : 4) + '"> <b class="vdr"></b> %</label>' +
    '<label>Verstärkung k <input type="range" class="k" min="0" max="6" step="0.5" value="' + (cfg.k || 0) + '"> <b class="vk"></b></label></div>' +
    '<canvas width="640" height="220" aria-label="Fahrspur von oben"></canvas><div class="row wout" aria-live="polite"></div>';
  var q = function (c) { return root.querySelector(c); }, cv = q("canvas");
  function sim(dr, k) {   // mit 0,2 s Mess- und Reaktionsverzögerung wie beim echten Roboter
    var x = 0, y = 0, yaw = 0, pts = [[0, 0]], maxdev = 0, sw = 0, lastSign = 0, buf = [];
    for (var t = 0; t < 6; t += 0.02) {
      buf.push(yaw); var meas = buf.length > 10 ? buf[buf.length - 11] : 0;
      var steer = Math.max(-100, Math.min(100, (0 - meas) * k));
      var vl = 30, vr = 30 * (1 - dr / 100);
      if (steer > 0) vr *= (100 - 2 * steer) / 100; else if (steer < 0) vl *= (100 + 2 * steer) / 100;
      var w = (vl - vr) / 11.2; yaw += w * 0.02 * 180 / Math.PI;
      var hd = yaw * Math.PI / 180; x += (vl + vr) / 2 * Math.cos(hd) * 0.02; y += (vl + vr) / 2 * Math.sin(hd) * 0.02;
      pts.push([x, y]); maxdev = Math.max(maxdev, Math.abs(y));
      var sg = Math.sign(Math.round(yaw)); if (sg && lastSign && sg !== lastSign) sw++; if (sg) lastSign = sg;
    }
    return { pts: pts, dev: Math.abs(y), maxdev: maxdev, sw: sw, yaw: yaw, x: x };
  }
  function draw() {
    var dr = +q(".dr").value, k = +q(".k").value; q(".vdr").textContent = dr; q(".vk").textContent = fmt(k, 1);
    var r = sim(dr, k), g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height);
    var X = function (x) { return 20 + x * 3.3; }, Y = function (y) { return 110 + y * 3.3; };
    g.strokeStyle = "#cfd6db"; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(20, 110); g.lineTo(620, 110); g.stroke(); g.setLineDash([]);
    g.fillStyle = "rgba(31,111,120,.15)"; g.fillRect(560, Y(-3), 60, 6 * 3.3);
    g.strokeStyle = "#1f6f78"; g.lineWidth = 3; g.beginPath(); r.pts.forEach(function (p, i) { if (i) g.lineTo(X(p[0]), Y(p[1])); else g.moveTo(X(p[0]), Y(p[1])); }); g.stroke();
    var ok = r.dev <= 3.5 && r.sw <= 2 && r.x >= 160;
    q(".wout").innerHTML = 'Lenkung = (0 − Gierwinkel) · k · Seitliche Abweichung am Ende: <span class="resl">' + fmt(r.dev, 1) + ' cm</span> · Schlenker: ' + r.sw + ' · ' + (k === 0 ? "ohne Regelung" : ok ? '<b style="color:var(--green)">fährt geradeaus ins Ziel</b>' : r.sw > 2 ? '<b style="color:var(--amber)">zu stark: der Roboter schlingert hin und her</b>' : "noch zu schwach – die Abweichung ist zu groß") +
      '<br><small style="color:var(--muted)">Wie beim echten Roboter reagiert die Regelung mit etwa 0,2 s Verzögerung.</small>';
    on({ dr: dr, k: k, dev: Math.round(r.dev * 10) / 10, sw: r.sw, x: Math.round(r.x), ok: ok });
  }
  bind(root, draw); draw();
};

/* ---------- Verschleiß: abgefahrene Reifen ---------- */
W.wear = function (root, cfg, on) {
  cfg = cfg || {}; on = on || noop;
  root.innerHTML = '<h4>🛞 Verschleiß-Simulator: abgefahrene Reifen</h4><div class="row"><label>Tatsächlicher Raddurchmesser <input type="range" class="d" min="48" max="56" step="0.5" value="' + (cfg.d || 56) + '"> <b class="vd"></b> mm</label>' +
    '<label>Programm: bewege vorwärts für <input type="number" class="s" value="' + (cfg.s || 50) + '" style="width:70px"> cm</label></div>' +
    '<canvas width="640" height="120" aria-label="Gefahrene Strecke auf dem Lineal"></canvas><div class="row wout" aria-live="polite"></div>';
  var q = function (c) { return root.querySelector(c); }, cv = q("canvas");
  function draw() {
    var d = +q(".d").value / 10, s = num(q(".s").value, 0); q(".vd").textContent = fmt(d * 10, 1);
    var real = s * d / 5.6, g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height);
    var X = function (cm) { return 20 + cm * 8; };
    g.strokeStyle = "#5b6672"; g.lineWidth = 1; g.beginPath(); g.moveTo(20, 80); g.lineTo(620, 80); g.stroke();
    g.fillStyle = "#5b6672"; g.font = "11px system-ui"; for (var c = 0; c <= 75; c += 5) { g.beginPath(); g.moveTo(X(c), 74); g.lineTo(X(c), 86); g.stroke(); if (c % 10 === 0) g.fillText(c + "", X(c) - 6, 100); }
    g.fillStyle = "rgba(192,57,43,.8)"; g.fillRect(X(50) - 1, 20, 3, 60); g.fillText("Ziel 50 cm", X(50) + 4, 30);
    g.fillStyle = "#f5c518"; g.fillRect(X(Math.min(75, real)) - 24, 48, 24, 22); g.fillStyle = "#D98E04"; g.beginPath(); g.moveTo(X(Math.min(75, real)) + 6, 59); g.lineTo(X(Math.min(75, real)), 52); g.lineTo(X(Math.min(75, real)), 66); g.fill();
    q(".wout").innerHTML = 'Der Hub zählt Radgrad für ' + fmt(s, 1) + ' cm mit Ø 56 mm – gefahren wird aber <span class="resl">' + fmt(real, 1) + ' cm</span> (Abweichung ' + fmt(real - 50, 1) + ' cm vom Ziel).';
    on({ d: Math.round(d * 100) / 10, s: s, real: Math.round(real * 10) / 10 });
  }
  bind(root, draw); draw();
};

/* ---------- Strategie: Punkte pro Sekunde ---------- */
W.strategy = function (root, cfg, on) {
  cfg = cfg || {}; on = on || noop;
  var M = cfg.missions || [["Kiste ins Lager schieben", 30, 20], ["Ball ins Tor schieben", 20, 8], ["Parken in der Basis", 10, 6], ["Hebel umlegen", 15, 12], ["Brücke überqueren", 25, 24]];
  var LIM = cfg.limit || 40;
  root.innerHTML = '<h4>🏁 Strategie-Planer (Zeitlimit ' + LIM + ' s)</h4><p style="font-size:14px;margin:4px 0">Wähle die Missionen für deinen Lauf. Zeiten sind Testfahrten inkl. Ausrichten.</p><div class="ms"></div><div class="row wout" aria-live="polite"></div>';
  var box = root.querySelector(".ms");
  M.forEach(function (m, i) { var r = el("label", null, '<input type="checkbox" data-i="' + i + '"> ' + m[0] + ' – ' + m[1] + ' Punkte, ' + m[2] + ' s <small style="color:var(--muted)">(' + fmt(m[1] / m[2], 2) + ' Punkte/s)</small>'); r.style.display = "block"; r.style.margin = "4px 0"; box.appendChild(r); });
  function calc() {
    var p = 0, t = 0, ch = [];
    box.querySelectorAll("input").forEach(function (c) { if (c.checked) { var m = M[+c.getAttribute("data-i")]; p += m[1]; t += m[2]; ch.push(+c.getAttribute("data-i")); } });
    var ok = t <= LIM;
    root.querySelector(".wout").innerHTML = 'Punkte: <span class="resl">' + p + '</span> · Zeit: <span class="resl">' + t + ' s</span> von ' + LIM + ' s · ' + (ok ? '<b style="color:var(--green)">schaffbar</b>' : '<b style="color:var(--red)">Zeitlimit überschritten – diese Punkte zählen nicht alle!</b>');
    on({ p: ok ? p : 0, t: t, ok: ok, ch: ch });
  }
  bind(root, calc); calc();
};

/* ---------- Wartungs-Checkliste ---------- */
W.check = function (root, cfg, on) {
  cfg = cfg || {}; on = on || noop;
  var items = cfg.items || JSON.parse(root.getAttribute("data-items") || "[]"), st = {};
  root.innerHTML = '<h4>🔧 ' + (cfg.title || root.getAttribute("data-title") || "Checkliste") + '</h4>';
  var ul = el("div"); root.appendChild(ul);
  items.forEach(function (t, i) {
    var lab = el("label"); lab.style.display = "block"; lab.style.margin = "4px 0";
    var cb = el("input"); cb.type = "checkbox";
    cb.addEventListener("change", function () { st[i] = cb.checked; upd(); });
    lab.appendChild(cb); lab.appendChild(document.createTextNode(" " + t)); ul.appendChild(lab);
  });
  var out = el("div", "row wout"); root.appendChild(out);
  function upd() { var n = items.filter(function (_, i) { return st[i]; }).length; out.innerHTML = 'Geprüft: <span class="resl">' + n + ' / ' + items.length + '</span>' + (n === items.length ? ' – Roboter einsatzbereit ✅' : ''); on({ n: n, total: items.length }); }
  upd();
};

/* ---------- Interessen-Check Berufe ---------- */
W.jobs = function (root, cfg, on) {
  on = on || noop;
  var Q = [["Ich baue gern Dinge zusammen und schraube.", { mech: 2, mechatr: 1 }], ["Ich finde Strom, Kabel und Schaltungen spannend.", { elek: 2, mechatr: 1 }],
           ["Ich programmiere gern und suche Fehler im Code.", { inf: 2, mechatr: 1 }], ["Ich organisiere gern und rechne mit Zahlen und Preisen.", { kfm: 2 }],
           ["Ich zeichne und plane gern am Computer (CAD).", { tz: 2, mech: 1 }], ["Mich interessiert, wie ganze Anlagen zusammenarbeiten.", { mechatr: 2, elek: 1 }]];
  var J = { mechatr: ["Mechatroniker/in", "Mechanik + Elektronik + Steuerung, Industrieroboter einrichten und warten"],
            elek: ["Elektroniker/in für Automatisierungstechnik", "Steuerungen, Sensoren und Antriebe installieren und programmieren"],
            inf: ["Fachinformatiker/in (Anwendungsentwicklung)", "Software und Steuerprogramme entwickeln und testen"],
            mech: ["Industriemechaniker/in", "Maschinen und Bauteile bauen, montieren und instand halten"],
            tz: ["Technische/r Produktdesigner/in", "Bauteile und Baugruppen am Computer (CAD) konstruieren"],
            kfm: ["Industriekaufmann/-frau", "Einkauf, Vertrieb und Kalkulation von Robotik-Produkten"] };
  var moved = false;
  root.innerHTML = '<h4>🧭 Mein Interessen-Check</h4><p style="font-size:14px">0 = trifft nicht zu · 3 = trifft voll zu</p>';
  var sl = [];
  Q.forEach(function (q) { var r = el("div", "row"); r.innerHTML = '<label style="flex:1;min-width:220px">' + q[0] + '</label><input type="range" min="0" max="3" value="1" aria-label="' + q[0] + '"><b>1</b>'; root.appendChild(r);
    var inp = r.querySelector("input"), b = r.querySelector("b"); inp.addEventListener("input", function () { moved = true; b.textContent = inp.value; calc(); }); sl.push(inp); });
  var out = el("div"); root.appendChild(out);
  function calc() {
    var sc = {}; Object.keys(J).forEach(function (k) { sc[k] = 0; });
    Q.forEach(function (q, i) { Object.keys(q[1]).forEach(function (k) { sc[k] += q[1][k] * +sl[i].value; }); });
    var top = Object.keys(sc).sort(function (a, b) { return sc[b] - sc[a]; }).slice(0, 3);
    out.innerHTML = '<p><b>Passende Berufe für dich:</b></p><ol>' + top.map(function (k) { return '<li><b>' + J[k][0] + '</b> – ' + J[k][1] + '</li>'; }).join("") + '</ol><p style="font-size:13px">Informiere dich genauer auf <a href="https://web.arbeitsagentur.de/berufenet/" target="_blank" rel="noopener">BERUFENET</a> (Suchbegriff = Berufsname).</p>';
    on({ top: top.map(function (k) { return J[k][0]; }), moved: moved });
  }
  calc();
};
window.WIDGETS = W;
})();
