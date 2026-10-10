/* widgets.js – interaktive Rechner und Modelle für die Theorie-Lektionen */
(function () {
"use strict";
function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
function fmt(x, d) { return Number(x).toFixed(d == null ? 1 : d).replace(".", ","); }
function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "#1f6f78"; }
var W = {};

/* ---------- Zahnradgetriebe ---------- */
W.gear = function (root) {
  var Z = [8, 12, 20, 24, 28, 36, 40];
  root.innerHTML = '<h4>⚙️ Getriebe-Rechner mit SPIKE-Zahnrädern</h4>' +
    '<div class="row"><label>Antriebsrad (am Motor): <select class="z1"></select> Zähne</label>' +
    '<label>Abtriebsrad: <select class="z2"></select> Zähne</label>' +
    '<label>Motordrehzahl: <input type="number" class="n1" value="150" min="1" max="300" style="width:80px"> U/min</label></div>' +
    '<canvas width="640" height="230"></canvas><div class="row wout"></div>';
  var s1 = root.querySelector(".z1"), s2 = root.querySelector(".z2"), n1 = root.querySelector(".n1"), cv = root.querySelector("canvas"), out = root.querySelector(".wout");
  Z.forEach(function (z) { s1.add(new Option(z, z)); s2.add(new Option(z, z)); });
  s1.value = 12; s2.value = 36;
  var ang = 0, last = performance.now();
  function gearPath(g, cx, cy, z, r, a, col) {
    g.save(); g.translate(cx, cy); g.rotate(a); g.fillStyle = col; g.beginPath();
    for (var i = 0; i < z; i++) {
      var a0 = i / z * 2 * Math.PI, a1 = (i + 0.25) / z * 2 * Math.PI, a2 = (i + 0.5) / z * 2 * Math.PI, a3 = (i + 0.75) / z * 2 * Math.PI;
      var ro = r + 6, ri = r - 3;
      g.lineTo(Math.cos(a0) * ri, Math.sin(a0) * ri); g.lineTo(Math.cos(a1) * ro, Math.sin(a1) * ro); g.lineTo(Math.cos(a2) * ro, Math.sin(a2) * ro); g.lineTo(Math.cos(a3) * ri, Math.sin(a3) * ri);
    }
    g.closePath(); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill();
    g.strokeStyle = "#fff"; g.lineWidth = 3; g.beginPath(); g.moveTo(-3, 0); g.lineTo(3, 0); g.moveTo(0, -3); g.lineTo(0, 3); g.stroke();
    g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.arc(r * 0.6, 0, 4, 0, 7); g.fill();
    g.restore();
  }
  function frame(now) {
    var z1 = +s1.value, z2 = +s2.value, rpm = Math.max(0, +n1.value || 0);
    var dt = (now - last) / 1000; last = now; ang += dt * rpm / 60 * 2 * Math.PI * 0.25;
    var g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height);
    var k = 2.4, r1 = z1 * k, r2 = z2 * k, cy = 115, cx1 = 170, cx2 = cx1 + r1 + r2 + 4;
    gearPath(g, cx1, cy, z1, r1, ang, "#0090F5");
    gearPath(g, cx2, cy, z2, r2, -ang * z1 / z2 + Math.PI / z2, "#9aa5ad");
    g.fillStyle = "#1c2430"; g.font = "13px system-ui"; g.fillText("Antrieb " + z1 + " Z.", cx1 - 30, cy + r1 + 26); g.fillText("Abtrieb " + z2 + " Z.", cx2 - 30, cy + r2 + 26);
    var i = z2 / z1, n2 = rpm / i;
    out.innerHTML = 'Übersetzung i = ' + z2 + ' : ' + z1 + ' = <span class="resl">' + fmt(i, 2) + '</span> · Abtrieb: <span class="resl">' + fmt(n2, 0) + ' U/min</span> · Drehmoment ×<span class="resl">' + fmt(i, 2) + '</span> · ' +
      (i > 1 ? "<b>Untersetzung</b>: langsamer, aber kräftiger" : i < 1 ? "<b>Übersetzung ins Schnelle</b>: schneller, aber schwächer" : "gleich schnell") +
      ' · Fahrzeug mit 5,6-cm-Rad: <span class="resl">' + fmt(n2 * 17.6 / 60, 1) + ' cm/s</span>';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

/* ---------- Hebelgesetz ---------- */
W.lever = function (root) {
  root.innerHTML = '<h4>⚖️ Hebel-Labor: F₁ · a₁ = F₂ · a₂</h4>' +
    '<div class="row"><label>Links: Kraft F₁ <input type="range" class="f1" min="1" max="10" value="4"> <b class="vf1"></b> N</label>' +
    '<label>Hebelarm a₁ <input type="range" class="a1" min="1" max="10" value="6"> <b class="va1"></b> Löcher</label></div>' +
    '<div class="row"><label>Rechts: Kraft F₂ <input type="range" class="f2" min="1" max="10" value="6"> <b class="vf2"></b> N</label>' +
    '<label>Hebelarm a₂ <input type="range" class="a2" min="1" max="10" value="4"> <b class="va2"></b> Löcher</label></div>' +
    '<canvas width="640" height="210"></canvas><div class="row wout"></div>';
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
    var st = m1 === m2 ? '<b style="color:var(--green)">Gleichgewicht!</b>' : (m1 > m2 ? "Links überwiegt" : "Rechts überwiegt");
    q(".wout").innerHTML = 'Drehmoment links: ' + f1 + ' N · ' + a1 + ' = <span class="resl">' + m1 + '</span> &nbsp; rechts: ' + f2 + ' N · ' + a2 + ' = <span class="resl">' + m2 + '</span> &nbsp; → ' + st;
  }
  root.querySelectorAll("input").forEach(function (i) { i.addEventListener("input", draw); }); draw();
};

/* ---------- Kippstabilität ---------- */
W.tip = function (root) {
  root.innerHTML = '<h4>🧱 Standsicherheit: Wann kippt der Roboter?</h4>' +
    '<div class="row"><label>Spurbreite b <input type="range" class="b" min="6" max="24" value="12"> <b class="vb"></b> cm</label>' +
    '<label>Schwerpunkthöhe h <input type="range" class="h" min="2" max="20" value="6"> <b class="vh"></b> cm</label>' +
    '<label>Rampe <input type="range" class="r" min="0" max="70" value="20"> <b class="vr"></b>°</label></div>' +
    '<canvas width="640" height="240"></canvas><div class="row wout"></div>';
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
    q(".wout").innerHTML = 'Kippwinkel = arctan((b/2) / h) = <span class="resl">' + fmt(crit, 1) + '°</span> → bei ' + r + '° ' + (kippt ? '<b style="color:var(--red)">kippt der Roboter!</b>' : '<b style="color:var(--green)">steht er sicher.</b>') +
      ' Tipp: breite Spur + tiefer Schwerpunkt (schwere Teile wie den Hub nach unten) = stabil.';
  }
  root.querySelectorAll("input").forEach(function (i) { i.addEventListener("input", draw); }); draw();
};

/* ---------- Akku ---------- */
W.battery = function (root) {
  root.innerHTML = '<h4>🔋 Akku-Rechner für den SPIKE-Hub</h4>' +
    '<div class="row"><label>Kapazität <input type="number" class="cap" value="2100" style="width:90px"> mAh</label>' +
    '<label>Spannung <input type="number" class="u" value="7.3" step="0.1" style="width:70px"> V</label></div>' +
    '<div class="row"><label><input type="checkbox" class="m1" checked> 2 Fahrmotoren (je ≈ 250 mA)</label><label><input type="checkbox" class="m2"> Anbau-Motor (≈ 250 mA)</label>' +
    '<label><input type="checkbox" class="s" checked> Sensoren + Hub (≈ 120 mA)</label><label><input type="checkbox" class="l"> Lichtmatrix hell (≈ 60 mA)</label></div>' +
    '<div class="row wout"></div><p style="font-size:13px;color:var(--muted)">Die Stromwerte sind grobe Schätzwerte für Übungszwecke – je nach Last schwankt der Strom stark.</p>';
  var q = function (c) { return root.querySelector(c); };
  function calc() {
    var cap = +q(".cap").value || 0, u = +q(".u").value || 0;
    var I = (q(".m1").checked ? 500 : 0) + (q(".m2").checked ? 250 : 0) + (q(".s").checked ? 120 : 0) + (q(".l").checked ? 60 : 0);
    var t = I ? cap / I : 0, E = u * cap / 1000;
    q(".wout").innerHTML = 'Gesamtstrom ≈ <span class="resl">' + I + ' mA</span> · Laufzeit t = Kapazität ÷ Strom ≈ <span class="resl">' + fmt(t, 1) + ' h</span> (' + Math.round(t * 60) + ' min) · gespeicherte Energie E = U · Q = <span class="resl">' + fmt(E, 1) + ' Wh</span>';
  }
  root.querySelectorAll("input").forEach(function (i) { i.addEventListener("input", calc); }); calc();
};

/* ---------- Rad und Strecke ---------- */
W.wheel = function (root) {
  root.innerHTML = '<h4>🛞 Rad-Rechner</h4><div class="row"><label>Raddurchmesser <input type="number" class="d" value="5.6" step="0.1" style="width:70px"> cm</label>' +
    '<label>Strecke <input type="number" class="s" value="50" style="width:70px"> cm</label></div><div class="row wout"></div>';
  var q = function (c) { return root.querySelector(c); };
  function calc() {
    var d = +q(".d").value || 0, s = +q(".s").value || 0, U = Math.PI * d;
    q(".wout").innerHTML = 'Umfang U = π · d = <span class="resl">' + fmt(U, 2) + ' cm</span> · Umdrehungen = s ÷ U = <span class="resl">' + fmt(U ? s / U : 0, 2) + '</span> · Radgrad = <span class="resl">' + Math.round(U ? s / U * 360 : 0) + '°</span>';
  }
  root.querySelectorAll("input").forEach(function (i) { i.addEventListener("input", calc); }); calc();
};

/* ---------- Wartungs-Checkliste ---------- */
W.check = function (root) {
  var items = JSON.parse(root.getAttribute("data-items") || "[]"), key = "spike-wartung:" + (root.getAttribute("data-key") || "x");
  var st = {}; try { st = JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) {}
  root.innerHTML = '<h4>🔧 ' + (root.getAttribute("data-title") || "Checkliste") + '</h4>';
  var ul = el("div"); root.appendChild(ul);
  items.forEach(function (t, i) {
    var lab = el("label"); lab.style.display = "block"; lab.style.margin = "4px 0";
    var cb = el("input"); cb.type = "checkbox"; cb.checked = !!st[i];
    cb.addEventListener("change", function () { st[i] = cb.checked; try { localStorage.setItem(key, JSON.stringify(st)); } catch (e) {} upd(); });
    lab.appendChild(cb); lab.appendChild(document.createTextNode(" " + t)); ul.appendChild(lab);
  });
  var out = el("div", "row wout"); root.appendChild(out);
  function upd() { var n = items.filter(function (_, i) { return st[i]; }).length; out.innerHTML = 'Geprüft: <span class="resl">' + n + ' / ' + items.length + '</span>' + (n === items.length ? ' – Roboter einsatzbereit ✅' : ''); }
  upd();
};

/* ---------- Interessen-Check Berufe ---------- */
W.jobs = function (root) {
  var Q = [["Ich baue gern Dinge zusammen und schraube.", { mech: 2, mechatr: 1 }], ["Ich finde Strom, Kabel und Schaltungen spannend.", { elek: 2, mechatr: 1 }],
           ["Ich programmiere gern und suche Fehler im Code.", { inf: 2, mechatr: 1 }], ["Ich organisiere gern und rechne mit Zahlen und Preisen.", { kfm: 2 }],
           ["Ich zeichne und plane gern am Computer (CAD).", { tz: 2, mech: 1 }], ["Mich interessiert, wie ganze Anlagen zusammenarbeiten.", { mechatr: 2, elek: 1 }]];
  var J = { mechatr: ["Mechatroniker/in", "Mechanik + Elektronik + Steuerung, Industrieroboter einrichten und warten"],
            elek: ["Elektroniker/in für Automatisierungstechnik", "Steuerungen, Sensoren und Antriebe installieren und programmieren"],
            inf: ["Fachinformatiker/in (Anwendungsentwicklung)", "Software und Steuerprogramme entwickeln und testen"],
            mech: ["Industriemechaniker/in", "Maschinen und Bauteile bauen, montieren und instand halten"],
            tz: ["Technische/r Produktdesigner/in", "Bauteile und Baugruppen am Computer (CAD) konstruieren"],
            kfm: ["Industriekaufmann/-frau", "Einkauf, Vertrieb und Kalkulation von Robotik-Produkten"] };
  root.innerHTML = '<h4>🧭 Mein Interessen-Check</h4><p style="font-size:14px">0 = trifft nicht zu · 3 = trifft voll zu</p>';
  var sl = [];
  Q.forEach(function (q, i) { var r = el("div", "row"); r.innerHTML = '<label style="flex:1;min-width:220px">' + q[0] + '</label><input type="range" min="0" max="3" value="1"><b>1</b>'; root.appendChild(r);
    var inp = r.querySelector("input"), b = r.querySelector("b"); inp.addEventListener("input", function () { b.textContent = inp.value; calc(); }); sl.push(inp); });
  var out = el("div"); root.appendChild(out);
  function calc() {
    var sc = {}; Object.keys(J).forEach(function (k) { sc[k] = 0; });
    Q.forEach(function (q, i) { Object.keys(q[1]).forEach(function (k) { sc[k] += q[1][k] * +sl[i].value; }); });
    var top = Object.keys(sc).sort(function (a, b) { return sc[b] - sc[a]; }).slice(0, 3);
    out.innerHTML = '<p><b>Passende Berufe für dich:</b></p><ol>' + top.map(function (k) { return '<li><b>' + J[k][0] + '</b> – ' + J[k][1] + '</li>'; }).join("") + '</ol><p style="font-size:13px">Informiere dich genauer auf <a href="https://web.arbeitsagentur.de/berufenet/" target="_blank" rel="noopener">BERUFENET</a> (Suchbegriff = Berufsname).</p>';
  }
  calc();
};
window.WIDGETS = W;
})();
