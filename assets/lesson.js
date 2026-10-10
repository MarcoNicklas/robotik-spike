/* lesson.js – Lektions-Ablauf für die Robotik-Lernplattform
   1 Leseauftrag (Skript) → 2 Verständnisprüfung → 3 Vertiefung (Aufgaben + Simulationen) → 4 Abschluss
   Die Inhalte stehen in window.LESSON (erzeugt aus content/lessons/*.json – gemeinsame Grundlage für GitHub und mebis).
   Modi:  window.LESSON_MODE = "web"   (GitHub Pages, Fortschritt im Browser + Fortschrittscode)
                               "scorm" (mebis-Lernpaket, Fortschritt über SCORM 1.2 an mebis)
          window.LESSON_PART = "all"   (alle 4 Schritte)  | "deep" (mebis: Verständnisprüfung läuft im mebis-Test) */
(function () {
"use strict";
var L = window.LESSON; if (!L) return;
var MODE = window.LESSON_MODE || "web", PART = window.LESSON_PART || "all";
var PFX = "spike:" + L.file + ":", PASS = L.pass || 0.7, MAXTRY = 3, SOL_AFTER = 3;
var SKRIPT = L.skript || "material/Skript_Robotik_SPIKE.pdf";

/* =====================================================================
   Hilfsfunktionen
   ===================================================================== */
function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function fmt(x, d) { return Number(x).toFixed(d == null ? 0 : d).replace(".", ","); }
function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { var x = seed || 1; return function () { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 100000) / 100000; }; }
function shuffled(n, seed, avoidIdentity) {
  var r = rng(seed), a = []; for (var i = 0; i < n; i++) a.push(i);
  for (var t = 0; t < 8; t++) {
    for (var j = n - 1; j > 0; j--) { var k = Math.floor(r() * (j + 1)), x = a[j]; a[j] = a[k]; a[k] = x; }
    if (!avoidIdentity || n < 2 || a.some(function (v, idx) { return v !== idx; })) break;
  }
  return a;
}
function parseNum(s) { var m = String(s == null ? "" : s).replace(/\s/g, "").replace(/(\d)\.(\d{3})(?!\d)/g, "$1$2").replace(",", ".").match(/[-−]?\d+(\.\d+)?/); return m ? parseFloat(m[0].replace("−", "-")) : NaN; }
function wild(p) { return new RegExp("^" + String(p).trim().replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$", "i"); }
function normTxt(s) { return String(s || "").trim().replace(/\s+/g, " ").replace(/[„“”"]/g, ""); }
function skriptLink(page, label) { return '<a class="ls-ref" href="' + SKRIPT + (page ? "#page=" + page : "") + '" target="_blank" rel="noopener">📘 ' + esc(label || ("Skript S. " + page)) + '</a>'; }
function refHtml(ref) {
  if (!ref) return "";
  var m = String(ref).match(/S\.\s*(\d+)/);
  return skriptLink(m ? +m[1] : null, "Skript " + ref);
}
function now() { return Date.now(); }

/* =====================================================================
   Speicher (Browser oder SCORM)
   ===================================================================== */
var Scorm = null;
function webStore() {
  return { raw: function (k, v) {
    var kk = window.RProg ? window.RProg.k(k) : k;
    try { if (v === undefined) return localStorage.getItem(kk); if (v === null) localStorage.removeItem(kk); else localStorage.setItem(kk, v); } catch (e) { return null; }
  } };
}
function findAPI(w) {
  var n = 0;
  while (w && n < 12) { try { if (w.API) return w.API; } catch (e) {} if (w.parent && w.parent !== w) { w = w.parent; n++; } else break; }
  try { if (window.opener) { var o = findAPI(window.opener); if (o) return o; } } catch (e) {}
  return null;
}
function scormStore() {
  var api = findAPI(window), M = {}, dirty = false, timer = null, started = now(), connected = false;
  function get(k) { try { return api ? String(api.LMSGetValue(k)) : ""; } catch (e) { return ""; } }
  function set(k, v) { try { return api ? api.LMSSetValue(k, String(v)) : "false"; } catch (e) { return "false"; } }
  if (api) { try { connected = String(api.LMSInitialize("")) === "true"; } catch (e) { connected = false; } }
  if (connected) {
    try { M = JSON.parse(get("cmi.suspend_data") || "{}") || {}; } catch (e) { M = {}; }
    var st = get("cmi.core.lesson_status");
    if (!st || st === "not attempted") set("cmi.core.lesson_status", "incomplete");
    set("cmi.core.score.min", "0"); set("cmi.core.score.max", "100");
  }
  function short(k) { return k.indexOf(PFX) === 0 ? k.slice(PFX.length) : k; }
  function serialize() {
    var s = JSON.stringify(M);
    if (s.length > 3900) {   // SCORM 1.2: suspend_data max. 4096 Zeichen – gespeicherte Programme zuerst opfern
      var prog = Object.keys(M).filter(function (k) { return k.indexOf(":") < 0 && k.charAt(0) !== "_"; }).sort(function (a, b) { return M[b].length - M[a].length; });
      var C = JSON.parse(s);
      for (var i = 0; i < prog.length && JSON.stringify(C).length > 3900; i++) delete C[prog[i]];
      s = JSON.stringify(C);
    }
    return s;
  }
  function flush() { if (!connected || !dirty) return; dirty = false; set("cmi.suspend_data", serialize()); try { api.LMSCommit(""); } catch (e) {} }
  function schedule() { dirty = true; if (timer) clearTimeout(timer); timer = setTimeout(flush, 800); }
  function hhmmss(ms) { var s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; function p(n) { return (n < 10 ? "0" : "") + n; } return p(h) + ":" + p(m) + ":" + p(x); }
  var finished = false;
  function finish() {
    if (!connected || finished) return; finished = true;
    dirty = true; flush();
    set("cmi.core.session_time", hhmmss(now() - started));
    set("cmi.core.exit", get("cmi.core.lesson_status") === "completed" ? "" : "suspend");
    try { api.LMSCommit(""); api.LMSFinish(""); } catch (e) {}
  }
  window.addEventListener("pagehide", finish); window.addEventListener("beforeunload", finish);
  var objIdx = {};
  return {
    connected: connected, hhmmss: hhmmss, set: set, get: get, flush: flush,
    raw: function (k, v) { k = short(k); if (v === undefined) return M[k] != null ? M[k] : null; if (v === null) delete M[k]; else M[k] = String(v); schedule(); },
    interaction: function (o) {
      if (!connected) return;
      var n = parseInt(get("cmi.interactions._count"), 10); if (isNaN(n)) n = 0;
      var p = "cmi.interactions." + n + ".";
      set(p + "id", o.id); set(p + "type", o.type); set(p + "student_response", String(o.resp).slice(0, 250));
      if (o.correct != null) set(p + "correct_responses.0.pattern", String(o.correct).slice(0, 250));
      set(p + "result", o.result); set(p + "weighting", "1");
      set(p + "latency", hhmmss(o.latency || 0));
      var d = new Date(); set(p + "time", (d.getHours() < 10 ? "0" : "") + d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes() + ":" + (d.getSeconds() < 10 ? "0" : "") + d.getSeconds());
      schedule();
    },
    objective: function (id, status, raw) {
      if (!connected) return;
      if (objIdx[id] == null) { var n = parseInt(get("cmi.objectives._count"), 10); if (isNaN(n)) n = 0;
        for (var i = 0; i < n; i++) if (get("cmi.objectives." + i + ".id") === id) { objIdx[id] = i; break; }
        if (objIdx[id] == null) { objIdx[id] = n; set("cmi.objectives." + n + ".id", id); } }
      var p = "cmi.objectives." + objIdx[id] + ".";
      set(p + "status", status); if (raw != null) { set(p + "score.min", "0"); set(p + "score.max", "100"); set(p + "score.raw", String(Math.round(raw))); }
      schedule();
    },
    result: function (raw, complete) { if (!connected) return; set("cmi.core.score.raw", String(Math.round(raw))); set("cmi.core.lesson_status", complete ? "completed" : "incomplete"); schedule(); }
  };
}
var Store = MODE === "scorm" ? (Scorm = scormStore()) : webStore();
window.LStore = Store;
function sget(id) { try { return JSON.parse(Store.raw(PFX + id + ":st") || "{}") || {}; } catch (e) { return {}; } }
function sset(id, st) { Store.raw(PFX + id + ":st", JSON.stringify(st)); }
function isDone(id) { return !!Store.raw(PFX + id + ":done"); }
function setDone(id, on) { Store.raw(PFX + id + ":done", on ? "1" : null); }
function lget() { try { return JSON.parse(Store.raw(PFX + "_lesson") || "{}") || {}; } catch (e) { return {}; } }
function lset(o) { Store.raw(PFX + "_lesson", JSON.stringify(o)); }
function ascii(s) { return String(s).replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue").replace(/ß/g, "ss").replace(/[^A-Za-z0-9_.-]+/g, "-").replace(/^-|-$/g, "").slice(0, 60); }
function iaId(item) { return ascii(L.id + "_" + item.id + "_" + (item.tag || item.type)); }

/* =====================================================================
   Antwort-Typen
   ===================================================================== */
var TYPE_LABEL = { mc: "Auswahl", multi: "Mehrfachauswahl", tf: "Richtig oder falsch?", match: "Zuordnung", order: "Reihenfolge", num: "Rechnen", text: "Kurze Antwort", cloze: "Lückentext", bug: "Fehlersuche", sim: "Simulation", spike: "Programmieren" };
var IA_TYPE = { mc: "choice", multi: "choice", tf: "true-false", match: "matching", order: "sequencing", num: "numeric", text: "fill-in", cloze: "fill-in", bug: "choice", sim: "performance", spike: "performance" };

function makeInput(item, seed) {
  var t = item.type, box = el("div", "ls-in ls-" + t), api = {};
  if (t === "mc" || t === "multi") {
    var ord = shuffled(item.opts.length, seed, false), name = "r" + seed + "_" + item.id;
    ord.forEach(function (oi) {
      var lab = el("label", "ls-opt"); var inp = el("input"); inp.type = t === "mc" ? "radio" : "checkbox"; inp.name = name; inp.value = oi;
      lab.appendChild(inp); lab.appendChild(el("span", null, item.opts[oi])); box.appendChild(lab);
    });
    api.get = function () { var v = [].map.call(box.querySelectorAll("input:checked"), function (i) { return +i.value; }).sort(function (a, b) { return a - b; }); return t === "mc" ? (v.length ? v[0] : null) : (v.length ? v : null); };
    api.set = function (r) { box.querySelectorAll("input").forEach(function (i) { i.checked = t === "mc" ? +i.value === r : (r || []).indexOf(+i.value) >= 0; }); };
    api.eval = function (r) {
      if (t === "mc") return { ok: r === item.a };
      var A = item.a.slice().sort(), ok = JSON.stringify(A) === JSON.stringify(r), right = r.filter(function (x) { return A.indexOf(x) >= 0; }).length;
      return { ok: ok, part: right + " von " + A.length + " richtigen Antworten gewählt" + (r.length > right ? ", dazu " + (r.length - right) + " falsche" : "") };
    };
    api.correct = function () { return t === "mc" ? item.opts[item.a] : item.a.map(function (i) { return item.opts[i]; }).join(" · "); };
    api.text = function (r) { return t === "mc" ? (r == null ? "" : item.opts[r]) : (r || []).map(function (i) { return item.opts[i]; }).join(" | "); };
    api.pattern = function () { return t === "mc" ? String(item.a) : item.a.join(","); };
    api.resp = function (r) { return t === "mc" ? String(r) : r.join(","); };
  } else if (t === "tf") {
    item.rows.forEach(function (row, ri) {
      var r = el("div", "ls-tfrow"); r.appendChild(el("span", "ls-tfs", row[0]));
      var g = el("span", "ls-tfb");
      ["richtig", "falsch"].forEach(function (lbl, k) { var lab = el("label"); var inp = el("input"); inp.type = "radio"; inp.name = "tf" + seed + item.id + "_" + ri; inp.value = k === 0 ? "1" : "0"; lab.appendChild(inp); lab.appendChild(document.createTextNode(" " + lbl)); g.appendChild(lab); });
      r.appendChild(g); box.appendChild(r);
    });
    api.get = function () { var out = [], all = true; item.rows.forEach(function (_, ri) { var c = box.querySelector('input[name="tf' + seed + item.id + "_" + ri + '"]:checked'); if (!c) all = false; out.push(c ? c.value === "1" : null); }); return all ? out : null; };
    api.set = function (r) { item.rows.forEach(function (_, ri) { box.querySelectorAll('input[name="tf' + seed + item.id + "_" + ri + '"]').forEach(function (i) { i.checked = r && r[ri] != null && (i.value === "1") === r[ri]; }); }); };
    api.eval = function (r) { var n = 0; item.rows.forEach(function (row, ri) { if (r[ri] === row[1]) n++; }); return { ok: n === item.rows.length, part: n + " von " + item.rows.length + " Aussagen richtig beurteilt" }; };
    api.correct = function () { return item.rows.map(function (row) { return row[0] + " → " + (row[1] ? "richtig" : "falsch"); }).join("<br>"); };
    api.text = function (r) { return (r || []).map(function (x) { return x ? "R" : "F"; }).join(""); };
    api.pattern = function () { return item.rows.map(function (row) { return row[1] ? "t" : "f"; }).join(","); };
    api.resp = function (r) { return r.map(function (x) { return x ? "t" : "f"; }).join(","); };
  } else if (t === "match") {
    var opts = item.rows.map(function (r) { return r[1]; }).concat(item.extra || []).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var oo = shuffled(opts.length, seed + 7, false).map(function (i) { return opts[i]; });
    var tb = el("table", "ls-match"); var ro = shuffled(item.rows.length, seed + 3, false);
    ro.forEach(function (ri) {
      var tr = el("tr"); tr.appendChild(el("td", null, item.rows[ri][0]));
      var td = el("td"), s = el("select"); s.setAttribute("data-ri", ri); s.setAttribute("aria-label", "Zuordnung für: " + item.rows[ri][0].replace(/<[^>]+>/g, ""));
      s.appendChild(new Option("– wählen –", "")); oo.forEach(function (o) { s.appendChild(new Option(o.replace(/<[^>]+>/g, ""), o)); });
      td.appendChild(s); tr.appendChild(td); tb.appendChild(tr);
    });
    box.appendChild(tb);
    api.get = function () { var out = [], all = true; item.rows.forEach(function (_, ri) { var v = box.querySelector('select[data-ri="' + ri + '"]').value; if (!v) all = false; out.push(v); }); return all ? out : null; };
    api.set = function (r) { item.rows.forEach(function (_, ri) { box.querySelector('select[data-ri="' + ri + '"]').value = r ? r[ri] : ""; }); };
    api.eval = function (r) { var n = 0; item.rows.forEach(function (row, ri) { if (r[ri] === row[1]) n++; }); return { ok: n === item.rows.length, part: n + " von " + item.rows.length + " Zuordnungen stimmen" }; };
    api.correct = function () { return item.rows.map(function (row) { return row[0] + " → " + row[1]; }).join("<br>"); };
    api.text = function (r) { return (r || []).join(" | "); };
    api.pattern = function () { return item.rows.map(function (row, i) { return i + "." + ascii(row[1]).slice(0, 12); }).join(","); };
    api.resp = function (r) { return r.map(function (v, i) { return i + "." + ascii(v).slice(0, 12); }).join(","); };
  } else if (t === "order") {
    var cur = shuffled(item.items.length, seed + 11, true), ol = el("ol", "ls-order");
    function draw() {
      ol.innerHTML = "";
      cur.forEach(function (ii, pos) {
        var li = el("li"); li.appendChild(el("span", "ls-otx", item.items[ii]));
        var up = el("button", "ls-ob", "▲"), dn = el("button", "ls-ob", "▼"); up.type = dn.type = "button";
        up.setAttribute("aria-label", "nach oben"); dn.setAttribute("aria-label", "nach unten");
        up.disabled = pos === 0 || box._locked; dn.disabled = pos === cur.length - 1 || box._locked;
        up.onclick = function () { var x = cur[pos - 1]; cur[pos - 1] = cur[pos]; cur[pos] = x; draw(); box._touched = true; };
        dn.onclick = function () { var x = cur[pos + 1]; cur[pos + 1] = cur[pos]; cur[pos] = x; draw(); box._touched = true; };
        var bb = el("span", "ls-obs"); bb.appendChild(up); bb.appendChild(dn); li.appendChild(bb); ol.appendChild(li);
      });
    }
    box.appendChild(ol); draw();
    api.get = function () { return cur.slice(); };
    api.set = function (r) { if (r && r.length === cur.length) { cur = r.slice(); draw(); } };
    api.eval = function (r) { var n = 0; r.forEach(function (v, i) { if (v === i) n++; }); return { ok: n === r.length, part: n + " von " + r.length + " Schritten stehen an der richtigen Stelle" }; };
    api.correct = function () { return "<ol>" + item.items.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ol>"; };
    api.text = function (r) { return (r || []).map(function (i) { return i + 1; }).join("-"); };
    api.pattern = function () { return item.items.map(function (_, i) { return i + 1; }).join(","); };
    api.resp = function (r) { return r.map(function (i) { return i + 1; }).join(","); };
    api.lock = function () { box._locked = true; draw(); };
  } else if (t === "num") {
    var wrap = el("div", "ls-numrow"); var inp = el("input"); inp.type = "text"; inp.setAttribute("inputmode", "decimal"); inp.setAttribute("aria-label", "Ergebnis"); inp.autocomplete = "off";
    wrap.appendChild(el("span", null, item.pre || "Ergebnis:")); wrap.appendChild(inp); if (item.unit) wrap.appendChild(el("span", "ls-unit", item.unit)); box.appendChild(wrap);
    api.get = function () { return inp.value.trim() === "" ? null : inp.value.trim(); };
    api.set = function (r) { inp.value = r == null ? "" : r; };
    api.eval = function (r) { var x = parseNum(r), tol = item.tol != null ? item.tol : Math.max(0.01, Math.abs(item.a) * 0.01); if (isNaN(x)) return { ok: false, part: "Bitte eine Zahl eingeben." }; return { ok: Math.abs(x - item.a) <= tol + 1e-9 }; };
    api.correct = function () { return fmt(item.a, (String(item.a).split(".")[1] || "").length) + (item.unit ? " " + item.unit : ""); };
    api.text = function (r) { return r || ""; };
    api.pattern = function () { return String(item.a); };
    api.resp = function (r) { var x = parseNum(r); return isNaN(x) ? String(r).slice(0, 40) : String(x); };
    api.focus = function () { inp.focus(); };
  } else if (t === "text") {
    var ti = el("input"); ti.type = "text"; ti.autocomplete = "off"; ti.setAttribute("aria-label", "Antwort"); ti.placeholder = item.ph || "Antwort eingeben"; box.appendChild(ti);
    api.get = function () { return ti.value.trim() === "" ? null : ti.value.trim(); };
    api.set = function (r) { ti.value = r || ""; };
    api.eval = function (r) { var v = normTxt(r); return { ok: item.accept.some(function (p) { return wild(normTxt(p)).test(v); }) }; };
    api.correct = function () { return item.show || item.accept[0].replace(/\*/g, ""); };
    api.text = function (r) { return r || ""; };
    api.pattern = function () { return item.accept[0]; };
    api.resp = function (r) { return String(r).slice(0, 120); };
  } else if (t === "cloze") {
    var parts = item.text.split(/\[\[(\d+)\]\]/), p = el("p", "ls-cloze");
    parts.forEach(function (part, i) {
      if (i % 2 === 0) { p.appendChild(el("span", null, part)); return; }
      var gi = +part, gap = item.gaps[gi], s = el("select"); s.setAttribute("data-g", gi); s.setAttribute("aria-label", "Lücke " + (gi + 1));
      s.appendChild(new Option("…", "")); shuffled(gap.opts.length, seed + gi * 13, false).forEach(function (oi) { s.appendChild(new Option(gap.opts[oi], gap.opts[oi])); });
      p.appendChild(s);
    });
    box.appendChild(p);
    api.get = function () { var out = [], all = true; item.gaps.forEach(function (_, gi) { var v = box.querySelector('select[data-g="' + gi + '"]').value; if (!v) all = false; out.push(v); }); return all ? out : null; };
    api.set = function (r) { item.gaps.forEach(function (_, gi) { box.querySelector('select[data-g="' + gi + '"]').value = r ? r[gi] : ""; }); };
    api.eval = function (r) { var n = 0; item.gaps.forEach(function (g, gi) { if (r[gi] === g.opts[g.a]) n++; }); return { ok: n === item.gaps.length, part: n + " von " + item.gaps.length + " Lücken richtig" }; };
    api.correct = function () { var k = 0; return item.text.replace(/\[\[(\d+)\]\]/g, function (_, gi) { var g = item.gaps[+gi]; return "<b>" + g.opts[g.a] + "</b>"; }); };
    api.text = function (r) { return (r || []).join(" | "); };
    api.pattern = function () { return item.gaps.map(function (g) { return ascii(g.opts[g.a]); }).join(","); };
    api.resp = function (r) { return r.map(ascii).join(","); };
  } else if (t === "bug") {
    var pre = el("div", "ls-code"); item.lines.forEach(function (ln, li) {
      var b = el("button", "ls-line"); b.type = "button"; b.setAttribute("aria-pressed", "false"); b.setAttribute("data-li", li);
      b.innerHTML = '<span class="ls-lno">' + (li + 1) + '</span><span class="ls-ltx">' + esc(ln).replace(/^( +)/, function (m) { return m.replace(/ /g, "&nbsp;"); }) + '</span>';
      b.onclick = function () { if (box._locked) return; var on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on ? "true" : "false"); };
      pre.appendChild(b);
    });
    box.appendChild(pre); box.appendChild(el("p", "ls-small", "Tippe die fehlerhafte(n) Zeile(n) an. Nochmal tippen hebt die Markierung auf."));
    api.get = function () { var v = [].map.call(box.querySelectorAll('.ls-line[aria-pressed="true"]'), function (b) { return +b.getAttribute("data-li"); }); return v.length ? v.sort(function (a, b) { return a - b; }) : null; };
    api.set = function (r) { box.querySelectorAll(".ls-line").forEach(function (b) { b.setAttribute("aria-pressed", (r || []).indexOf(+b.getAttribute("data-li")) >= 0 ? "true" : "false"); }); };
    api.eval = function (r) { var A = item.a.slice().sort(), right = r.filter(function (x) { return A.indexOf(x) >= 0; }).length; return { ok: JSON.stringify(A) === JSON.stringify(r), part: right + " von " + A.length + " Fehlerzeilen gefunden" + (r.length > right ? ", " + (r.length - right) + " Zeile(n) ohne Fehler markiert" : "") }; };
    api.correct = function () { return "Fehlerhaft: Zeile " + item.a.map(function (i) { return i + 1; }).join(", "); };
    api.text = function (r) { return (r || []).map(function (i) { return i + 1; }).join(","); };
    api.pattern = function () { return item.a.map(function (i) { return i + 1; }).join(","); };
    api.resp = function (r) { return r.map(function (i) { return i + 1; }).join(","); };
    api.lock = function () { box._locked = true; };
  }
  api.node = box;
  api.disable = function (on) { box.querySelectorAll("input,select").forEach(function (x) { x.disabled = on; }); if (on && api.lock) api.lock(); };
  return api;
}

/* =====================================================================
   Aufgaben-Karte mit Versuchen, Hinweisen und Lösung
   ===================================================================== */
var STATE = { check: [], deep: [] };
function pointsFor(tries) { return tries === 1 ? 1 : tries === 2 ? 0.5 : 0; }

function questionCard(item, phase, num, round, onChange, embedded) {
  var card = el("div", "ls-item" + (embedded ? " ls-emb" : "")), st = sget(item.id);
  var seed = hashStr(L.id + item.id + "|" + (round || 1));
  if (!embedded) {
    var head = el("div", "ls-ih");
    head.innerHTML = '<span class="ls-no">' + (phase === "check" ? "Frage " : "Aufgabe ") + num + '</span><span class="ls-ty">' + esc(TYPE_LABEL[item.type] || "") + (item.opt ? " · freiwillig" : "") + '</span><span class="ls-badge"></span>';
    card.appendChild(head);
  }
  card.appendChild(el("div", "ls-q", item.q));
  if (item.fig) card.appendChild(el("div", "ls-fig", item.fig));
  var inp = makeInput(item, seed); card.appendChild(inp.node);
  var bar = el("div", "ls-bar"), btn = el("button", "btn chk", "✓ Prüfen"); btn.type = "button"; bar.appendChild(btn);
  var tries = el("span", "ls-tries"); bar.appendChild(tries); card.appendChild(bar);
  var fb = el("div", "ls-fb"); fb.setAttribute("aria-live", "polite"); card.appendChild(fb);
  var shownAt = now();
  function badge() {
    var b = card.querySelector(".ls-badge"); if (!b) return;
    var s = sget(item.id);
    b.textContent = s.d ? (s.s ? "Lösung angesehen" : "✓ gelöst") : (s.a ? "in Arbeit" : "offen");
    b.className = "ls-badge " + (s.d ? (s.s ? "sol" : "ok") : (s.a ? "wip" : ""));
  }
  function showTries() { var s = sget(item.id); tries.textContent = s.d ? "" : (s.a ? "Versuch " + (s.a + 1) + " von " + MAXTRY : "3 Versuche · nach einem Fehlversuch gibt es Hinweise"); }
  function solvedView(s) {
    inp.set(s.r); inp.disable(true); btn.disabled = true; btn.style.display = "none";
    if (s.s) fb.innerHTML = '<div class="ls-no-ok">❌ Nicht gelöst – hier ist die Lösung:</div><div class="ls-sol"><div class="ls-solr">' + inp.correct() + '</div>' + (item.sol ? '<div>' + item.sol + '</div>' : "") + (item.ref ? '<div class="ls-small">Zum Nachlesen: ' + refHtml(item.ref) + '</div>' : "") + '</div>';
    else fb.innerHTML = '<div class="ls-ok">✅ Richtig' + (s.a > 1 ? " (im " + s.a + ". Versuch)" : "") + '!</div>' + (item.sol ? '<div class="ls-sol">' + item.sol + '</div>' : "");
    if (s.s) inp.set(null);
    if (s.s && item.type !== "order") { /* richtige Antwort eintragen */ try { inp.set(correctResponse(item)); } catch (e) {} }
    if (s.s && item.type === "order") inp.set(item.items.map(function (_, i) { return i; }));
  }
  btn.onclick = function () {
    var r = inp.get();
    if (r == null) { fb.innerHTML = '<div class="ls-warn">Bitte zuerst eine Antwort geben.</div>'; return; }
    if (item.type === "order" && !inp.node._touched && !sget(item.id).a) { fb.innerHTML = '<div class="ls-warn">Bringe die Schritte zuerst mit ▲ ▼ in die richtige Reihenfolge.</div>'; return; }
    var s = sget(item.id), ev = inp.eval(r);
    s.n = (s.n || 0) + 1; s.a = (s.a || 0) + 1; if (!s.t0) s.t0 = now(); s.r = r;
    if (ev.ok) { s.d = 1; s.p = pointsFor(s.a); s.t1 = now(); setDone(item.id, true); }
    else { s.f = (s.f || 0) + 1; s.w = (s.w || 0) + 1; if (s.a >= MAXTRY) { s.d = 1; s.s = 1; s.p = 0; s.t1 = now(); setDone(item.id, true); } }
    sset(item.id, s);
    if (Scorm) Scorm.interaction({ id: iaId(item), type: IA_TYPE[item.type], resp: inp.resp(r), correct: inp.pattern(), result: ev.ok ? "correct" : "wrong", latency: now() - shownAt });
    shownAt = now();
    if (s.d) solvedView(s);
    else {
      var h = (item.hint || [])[Math.min(s.a - 1, (item.hint || []).length - 1)];
      fb.innerHTML = '<div class="ls-no-ok">❌ Noch nicht richtig.' + (ev.part ? " " + esc(ev.part) + "." : "") + '</div>' +
        (h ? '<div class="ls-hint">💡 <b>Hinweis:</b> ' + h + '</div>' : "") + (item.ref ? '<div class="ls-small">Lies noch einmal nach: ' + refHtml(item.ref) + '</div>' : "");
    }
    showTries(); badge(); onChange();
  };
  if (st.d) solvedView(st); else if (st.r != null && st.a) { inp.set(st.r); }
  showTries(); badge();
  card._resolved = function () { return !!sget(item.id).d; };
  return card;
}
function correctResponse(item) {
  switch (item.type) {
    case "mc": case "multi": return item.a;
    case "tf": return item.rows.map(function (r) { return r[1]; });
    case "match": return item.rows.map(function (r) { return r[1]; });
    case "num": return String(item.a).replace(".", ",");
    case "text": return item.show || item.accept[0].replace(/\*/g, "");
    case "cloze": return item.gaps.map(function (g) { return g.opts[g.a]; });
    case "bug": return item.a;
  }
  return null;
}

/* ---------- Simulation: Vermutung → Ausprobieren → Erklären ---------- */
function simCard(item, num, onChange) {
  var card = el("div", "ls-item ls-simcard"), sst = sget(item.id);
  var head = el("div", "ls-ih"); head.innerHTML = '<span class="ls-no">Aufgabe ' + num + '</span><span class="ls-ty">Simulation' + (item.opt ? " · freiwillig" : "") + '</span><span class="ls-badge"></span>'; card.appendChild(head);
  card.appendChild(el("div", "ls-q", item.q));
  // 1 Vermutung
  var p1 = el("div", "ls-phase"), pr = item.predict;
  if (pr.type === "num" && !pr.pre) pr.pre = "Meine Vermutung:";
  p1.innerHTML = '<div class="ls-ph">① Vermutung</div><div class="ls-q">' + pr.q + '</div>';
  var pin = makeInput(pr, hashStr(L.id + item.id + "p")); p1.appendChild(pin.node);
  var pbtn = el("button", "btn", "Vermutung festhalten"); pbtn.type = "button"; p1.appendChild(pbtn);
  var pfb = el("div", "ls-fb"); p1.appendChild(pfb); card.appendChild(p1);
  // 2 Ausprobieren
  var p2 = el("div", "ls-phase ls-lock"); p2.innerHTML = '<div class="ls-ph">② Ausprobieren</div><div class="ls-q">' + item.goal.text + '</div>';
  var wroot = el("div", "widget"); p2.appendChild(wroot);
  var gfb = el("div", "ls-fb ls-goal"); gfb.setAttribute("aria-live", "polite"); p2.appendChild(gfb); card.appendChild(p2);
  // 3 Erklären
  var p3 = el("div", "ls-phase ls-lock"); p3.appendChild(el("div", "ls-ph", "③ Ergebnis erklären")); card.appendChild(p3);
  var goalFn = new Function("s", "return (" + item.goal.cond + ");");
  var recFn = item.goal.rec ? new Function("s", "return " + item.goal.rec + ";") : null;
  var built = false, explainBuilt = false;
  function badge() { var s = sget(item.id), e = sget(item.explain.id || (item.id + "x")); var b = card.querySelector(".ls-badge"); var d = isDone(item.id); b.textContent = d ? (e.s ? "Lösung angesehen" : "✓ gelöst") : (s.g ? "Ziel erreicht" : s.v != null ? "Vermutung notiert" : "offen"); b.className = "ls-badge " + (d ? (e.s ? "sol" : "ok") : (s.g || s.v != null ? "wip" : "")); }
  function buildWidget() {
    if (built) return; built = true; p2.classList.remove("ls-lock");
    var f = window.WIDGETS && window.WIDGETS[item.widget];
    if (!f) { wroot.textContent = "Simulation nicht gefunden."; return; }
    f(wroot, item.cfg || {}, function (s) {
      var st = sget(item.id);
      var ok = false; try { ok = !!goalFn(s); } catch (e) {}
      if (ok && !st.g) { st.g = 1; st.obs = recFn ? recFn(s) : ""; st.tg = now(); sset(item.id, st); if (Scorm) Scorm.interaction({ id: ascii(L.id + "_" + item.id + "_Ziel"), type: "performance", resp: ascii(st.obs || "erreicht").slice(0, 120), result: "correct", latency: now() - (st.tp || now()) }); }
      if (st.g) { gfb.innerHTML = '<div class="ls-ok">🎯 Ziel erreicht' + (st.obs ? ": " + esc(st.obs) : "") + '</div>' + compare(st); buildExplain(); }
      badge();
    });
  }
  function compare(st) {
    if (!pr.cmp) return "";
    return '<div class="ls-small">Deine Vermutung: <b>' + esc(pin.text(st.v)) + '</b> · ' + (st.vok ? "Sie hat sich bestätigt. 👍" : "Die Simulation zeigt etwas anderes – genau dafür probiert man es aus. Erkläre unten, warum.") + '</div>';
  }
  function buildExplain() {
    if (explainBuilt) return; explainBuilt = true; p3.classList.remove("ls-lock");
    var ex = item.explain; ex.id = ex.id || (item.id + "x");
    var qc = questionCard(ex, "deep", "", 1, function () { finish(); onChange(); }, true);
    p3.appendChild(qc); finish();
  }
  function finish() {
    var ex = item.explain, e = sget(ex.id), st = sget(item.id);
    if (e.d && st.g && !isDone(item.id)) {
      st.d = 1; st.p = e.p != null ? e.p : 0; st.s = e.s ? 1 : 0; st.a = e.a; st.n = (st.n || 0) + (e.n || 0); st.f = (st.f || 0) + (e.f || 0); st.t1 = now(); sset(item.id, st); setDone(item.id, true);
    }
    badge();
  }
  pbtn.onclick = function () {
    var v = pin.get(); if (v == null) { pfb.innerHTML = '<div class="ls-warn">Notiere zuerst deine Vermutung.</div>'; return; }
    var st = sget(item.id); st.v = v; st.tp = now(); if (!st.t0) st.t0 = now(); if (pr.cmp) { try { st.vok = pin.eval(v).ok ? 1 : 0; } catch (e) { st.vok = 0; } } sset(item.id, st);
    if (Scorm) Scorm.interaction({ id: ascii(L.id + "_" + item.id + "_Vermutung"), type: IA_TYPE[pr.type] || "fill-in", resp: pin.resp(v), result: "neutral", latency: 0 });
    pin.disable(true); pbtn.disabled = true; pfb.innerHTML = '<div class="ls-small">Vermutung notiert. Jetzt ausprobieren!</div>'; buildWidget(); badge(); onChange();
  };
  if (sst.v != null) { pin.set(sst.v); pin.disable(true); pbtn.disabled = true; pfb.innerHTML = '<div class="ls-small">Vermutung notiert.</div>'; buildWidget(); }
  if (sst.g) buildExplain();
  badge();
  card._resolved = function () { return isDone(item.id); };
  return card;
}

/* ---------- Programmieraufgabe im SPIKE-Simulator ---------- */
function spikeCard(item, num, onChange) {
  var card = el("div", "ex ls-spk");
  card.innerHTML = '<div class="exh"><span class="num">Aufgabe ' + num + '</span><span class="title">' + esc(item.title || "Programmieren") + '</span><span class="lvl">' + esc(item.lvl || (item.opt ? "freiwillig" : "Pflicht")) + '</span></div><div class="task">' + item.q + '</div>';
  var cfg = JSON.parse(JSON.stringify(item.ex)); cfg.ref = item.ref;
  var shown = now();
  if (!window.SPIKE) { card.appendChild(el("p", null, "Simulator nicht geladen.")); return card; }
  window.SPIKE.mount(card, cfg, { key: PFX + item.id, solAfter: SOL_AFTER, hintAfterFail: true,
    onCheck: function (r) {
      var st = sget(item.id);
      if (r.ok && !r.wasDone) { st.p = st.s ? 0 : 1; st.a = st.n; sset(item.id, st); }
      if (Scorm) { var ok = r.ok; Scorm.interaction({ id: iaId(item), type: "performance", resp: ascii(r.checks.filter(function (c) { return !c.ok; }).map(function (c) { return c.m; }).join("; ") || "alle Kriterien erfuellt").slice(0, 200), result: ok ? "correct" : "wrong", latency: now() - shown }); }
      shown = now(); onChange();
    },
    onSolution: function () { onChange(); }
  });
  card._resolved = function () { return isDone(item.id); };
  return card;
}

/* =====================================================================
   Seitenaufbau
   ===================================================================== */
var root = document.getElementById("lesson"); if (!root) return;
var ls = lget(); if (!ls.round) { ls.round = 1; ls.t0 = now(); lset(ls); }
var checkCards = [], deepCards = [];
var reqDeep = (L.deep || []).filter(function (it) { return !it.opt; });

function stepNav() {
  var nav = el("nav", "ls-steps"); nav.setAttribute("aria-label", "Ablauf der Lektion");
  var S = [["s-lesen", "① Lesen"], ["s-check", PART === "deep" ? "② Test in mebis" : "② Verstehen"], ["s-deep", "③ Vertiefen"], ["s-fin", "④ Abschluss"]];
  S.forEach(function (s) { var a = el("a", null, s[1] + '<span class="ls-sst"></span>'); a.href = "#" + s[0]; a.setAttribute("data-s", s[0]); nav.appendChild(a); });
  return nav;
}
function sectionHead(id, title, sub) { var s = el("section", "ls-step"); s.id = id; s.appendChild(el("h2", null, title)); if (sub) s.appendChild(el("p", "ls-sub", sub)); return s; }

function buildRead() {
  var R = L.read, s = sectionHead("s-lesen", "① Leseauftrag", "Lies zuerst den passenden Abschnitt im Skript. Die Fragen in Schritt ② kannst du nur mit diesem Wissen sicher beantworten.");
  var c = el("div", "ls-read");
  c.innerHTML = '<div class="ls-rh"><div><div class="ls-kap">Skript · Kapitel ' + esc(R.kap) + ' · Seite' + (String(R.pages).indexOf("–") >= 0 ? "n " : " ") + esc(R.pages) + '</div><div class="ls-kt">' + esc(R.title) + '</div></div>' +
    '<a class="btn run" href="' + SKRIPT + '#page=' + R.page + '" target="_blank" rel="noopener">📘 Skript öffnen (S. ' + R.page + ')</a></div>' +
    '<div class="ls-rb"><b>Lies diese Abschnitte:</b><ul>' + R.sections.map(function (x) { return "<li>" + x + "</li>"; }).join("") + '</ul>' +
    (R.skip ? '<p class="ls-small">⏭ ' + R.skip + '</p>' : "") +
    '<b>Achte beim Lesen besonders auf:</b><ul>' + R.focus.map(function (x) { return "<li>" + x + "</li>"; }).join("") + '</ul>' +
    '<p class="ls-small">Tipp: Lies mit Stift und notiere Fachbegriffe und Zahlen. Du darfst das Skript bei den Fragen geöffnet lassen.</p></div>';
  if (R.note) c.appendChild(el("div", "box txt", '<div class="h">🧱 Hinweis zu unserem Roboter</div>' + R.note));
  s.appendChild(c);
  var go = el("a", "btn", PART === "deep" ? "Weiter zur Vertiefung ↓" : "Weiter zur Verständnisprüfung ↓"); go.href = PART === "deep" ? "#s-deep" : "#s-check"; s.appendChild(go);
  return s;
}

function buildCheck() {
  if (PART === "deep") {
    var sd = sectionHead("s-check", "② Verständnisprüfung im mebis-Test");
    sd.appendChild(el("div", "box merke", "Die Verständnisprüfung zu dieser Lektion bearbeitest du im mebis-Test <b>„" + esc(L.id) + " Verständnisprüfung“</b>. Erst wenn du dort mindestens " + Math.round(PASS * 100) + " % erreichst, wird diese Vertiefung in mebis freigeschaltet."));
    return sd;
  }
  var s = sectionHead("s-check", "② Verständnisprüfung", "Beantworte alle Fragen mithilfe des Skripts. Du hast je Frage 3 Versuche. Nach einem Fehlversuch bekommst du einen Hinweis, nach dem dritten die Lösung. Zum Bestehen brauchst du mindestens " + Math.round(PASS * 100) + " % der Punkte (1. Versuch = 1 Punkt, 2. Versuch = ½ Punkt).");
  var rinfo = el("div", "ls-round"); s.appendChild(rinfo);
  var list = el("div", "ls-list"); s.appendChild(list);
  (L.check || []).forEach(function (it, i) { var c = questionCard(it, "check", i + 1, ls.round, update); checkCards.push(c); list.appendChild(c); });
  var res = el("div", "ls-result"); res.setAttribute("aria-live", "polite"); s.appendChild(res);
  s._rinfo = rinfo; s._res = res;
  return s;
}
function checkScore() {
  var tot = (L.check || []).length, pts = 0, resolved = 0, weak = [];
  (L.check || []).forEach(function (it) { var st = sget(it.id); if (st.d) { resolved++; pts += st.p || 0; } if (st.d && (st.s || (st.a || 0) >= 2)) weak.push(it); });
  return { tot: tot, pts: pts, resolved: resolved, pct: tot ? pts / tot : 1, weak: weak };
}
function newRound() {
  ls = lget(); ls.round = (ls.round || 1) + 1; (ls.hist = ls.hist || []).push(Math.round(checkScore().pct * 100)); ls.done1 = 0; lset(ls);
  (L.check || []).forEach(function (it) { var st = sget(it.id); st.a = 0; st.w = 0; st.d = 0; st.s = 0; st.p = 0; st.r = null; sset(it.id, st); setDone(it.id, false); });
  location.hash = "#s-check"; location.reload();
}

function buildDeep() {
  var s = sectionHead("s-deep", "③ Vertiefung: Aufgaben und Simulationen", "Wende dein Wissen an. Bei Simulationen gehst du immer so vor: ① Vermutung notieren → ② ausprobieren → ③ Ergebnis erklären. Freiwillige Aufgaben sind für Profis und zählen nicht zum Abschluss.");
  var lock = el("div", "box warn ls-lockmsg", "🔒 Die Vertiefung wird freigeschaltet, sobald du die Verständnisprüfung bestanden hast."); s.appendChild(lock);
  var list = el("div", "ls-list"); s.appendChild(list);
  s._lock = lock; s._list = list; s._built = false;
  return s;
}
function fillDeep(s) {
  if (s._built) return; s._built = true; s._lock.style.display = "none";
  (L.deep || []).forEach(function (it, i) {
    var c = it.type === "sim" ? simCard(it, i + 1, update) : it.type === "spike" ? spikeCard(it, i + 1, update) : questionCard(it, "deep", i + 1, 1, update);
    deepCards.push(c); s._list.appendChild(c);
  });
}
function deepScore() {
  var req = reqDeep.length, done = 0, pts = 0, weak = [];
  reqDeep.forEach(function (it) { var st = sget(it.id); if (isDone(it.id)) { done++; pts += st.p != null ? st.p : (st.s ? 0 : 1); } if (isDone(it.id) && (st.s || (st.f || 0) >= 2)) weak.push(it); });
  return { req: req, done: done, pts: pts, pct: req ? pts / req : 1, weak: weak };
}

function buildFin() {
  var s = sectionHead("s-fin", "④ Abschluss und Rückmeldung");
  var sum = el("div", "ls-summary"); s.appendChild(sum);
  if (L.close && L.close.merke) s.appendChild(el("div", "box merke", '<div class="h">Das nimmst du mit</div><ul>' + L.close.merke.map(function (m) { return "<li>" + m + "</li>"; }).join("") + "</ul>"));
  if (L.goals && L.goals.length) {
    var se = el("div", "ls-self"); se.appendChild(el("h3", null, "Selbsteinschätzung (freiwillig)"));
    var tb = el("table", "ls-selft"), sv = ls.self || {};
    tb.innerHTML = "<tr><th>Ich kann …</th><th>noch nicht</th><th>teilweise</th><th>sicher</th></tr>";
    L.goals.forEach(function (g, gi) {
      var tr = el("tr"); tr.appendChild(el("td", null, g));
      [1, 2, 3].forEach(function (v) { var td = el("td"), r = el("input"); r.type = "radio"; r.name = "self" + gi; r.value = v; r.checked = sv[gi] === v; r.setAttribute("aria-label", g + ": " + ["noch nicht", "teilweise", "sicher"][v - 1]);
        r.onchange = function () { ls = lget(); ls.self = ls.self || {}; ls.self[gi] = v; lset(ls); if (Scorm) Scorm.interaction({ id: ascii(L.id + "_Selbst_" + (gi + 1)), type: "likert", resp: String(v), result: "neutral", latency: 0 }); };
        td.appendChild(r); tr.appendChild(td); });
      tb.appendChild(tr);
    });
    se.appendChild(tb); s.appendChild(se);
  }
  var act = el("div", "ls-finbar"); s.appendChild(act);
  s._sum = sum; s._act = act;
  return s;
}

var secRead = buildRead(), secCheck = buildCheck(), secDeep = buildDeep(), secFin = buildFin(), nav = stepNav();
root.appendChild(nav); root.appendChild(secRead); root.appendChild(secCheck); root.appendChild(secDeep); root.appendChild(secFin);

function update() {
  var cs = checkScore(), ds;
  ls = lget();
  var passed = PART === "deep" || !!ls.passed;
  // Runde auswerten
  if (PART !== "deep") {
    secCheck._rinfo.innerHTML = '<span>Runde ' + ls.round + (ls.hist && ls.hist.length ? " · frühere Runden: " + ls.hist.map(function (h) { return h + " %"; }).join(", ") : "") + '</span><span><b>' + cs.resolved + "</b> von " + cs.tot + " Fragen bearbeitet · Punkte " + fmt(cs.pts, cs.pts % 1 ? 1 : 0) + " / " + cs.tot + '</span>';
    if (cs.resolved === cs.tot && cs.tot) {
      if (!ls.done1) { ls.done1 = 1; ls.best = Math.max(ls.best || 0, Math.round(cs.pct * 100)); if (cs.pct >= PASS) { ls.passed = 1; ls.tp = now(); } lset(ls); passed = !!ls.passed; }
      var weak = cs.weak.map(function (it) { return "<li>" + it.q.replace(/<[^>]+>/g, "").slice(0, 90) + "… " + refHtml(it.ref) + "</li>"; }).join("");
      if (ls.passed) secCheck._res.innerHTML = '<div class="box merke"><div class="h">✅ Verständnisprüfung bestanden – ' + Math.round(cs.pct * 100) + ' %</div>Die Vertiefung ist freigeschaltet.' + (weak ? '<p>Lies diese Stellen trotzdem noch einmal nach:</p><ul>' + weak + '</ul>' : "") + ' <a class="btn run" href="#s-deep">Weiter zur Vertiefung ↓</a></div>';
      else {
        secCheck._res.innerHTML = '<div class="box warn"><div class="h">Noch nicht bestanden – ' + Math.round(cs.pct * 100) + ' % (nötig: ' + Math.round(PASS * 100) + ' %)</div><p>Lies diese Stellen im Skript noch einmal gründlich:</p><ul>' + weak + '</ul><p>Starte dann eine neue Runde. Die Antworten werden zurückgesetzt und neu gemischt.</p></div>';
        var nb = el("button", "btn run", "↻ Neue Runde starten"); nb.type = "button"; nb.onclick = newRound; secCheck._res.querySelector(".box").appendChild(nb);
      }
    } else secCheck._res.innerHTML = "";
  }
  if (passed) fillDeep(secDeep);
  ds = deepScore();
  var complete = passed && ds.done === ds.req;
  // Schritt-Status
  var stx = { "s-lesen": "", "s-check": PART === "deep" ? "" : (ls.passed ? "✓" : cs.resolved + "/" + cs.tot), "s-deep": passed ? ds.done + "/" + ds.req : "🔒", "s-fin": ls.fin || (complete && PART === "deep") ? "✓" : "" };
  nav.querySelectorAll("a").forEach(function (a) { a.querySelector(".ls-sst").textContent = stx[a.getAttribute("data-s")] ? " " + stx[a.getAttribute("data-s")] : ""; a.classList.toggle("done", /✓/.test(stx[a.getAttribute("data-s")] || "")); });
  // Zusammenfassung
  var weakAll = (PART === "deep" ? [] : cs.weak).concat(ds.weak);
  var h = '<div class="ls-sumgrid">' +
    (PART === "deep" ? "" : '<div><b>Verständnisprüfung</b><span>' + (ls.passed ? "bestanden" : "offen") + (ls.best != null ? " · beste Runde " + ls.best + " %" : "") + '</span></div>') +
    '<div><b>Pflichtaufgaben Vertiefung</b><span>' + ds.done + " von " + ds.req + " erledigt" + (ds.req ? " · " + Math.round(ds.pct * 100) + " % ohne Lösungshilfe" : "") + '</span></div>' +
    '<div><b>Status</b><span>' + (ls.fin || (complete && PART === "deep") ? "Lektion abgeschlossen ✓" : complete ? "bereit zum Abschließen" : "in Arbeit") + '</span></div></div>';
  if (weakAll.length) h += '<p><b>Hier lohnt sich Wiederholen:</b></p><ul>' + weakAll.map(function (it) { return "<li>" + (it.title || it.q.replace(/<[^>]+>/g, "").slice(0, 80) + "…") + " " + refHtml(it.ref) + "</li>"; }).join("") + "</ul>";
  else if (complete) h += "<p>Stark – du hattest bei keiner Aufgabe größere Schwierigkeiten.</p>";
  secFin._sum.innerHTML = h;
  // Abschluss
  secFin._act.innerHTML = "";
  if (MODE === "web") {
    if (ls.fin) secFin._act.appendChild(el("div", "box merke", "✅ Du hast diese Lektion am " + new Date(ls.fin).toLocaleDateString("de-DE") + " abgeschlossen." + (L.next ? ' <a class="btn run" href="' + L.next.file + '">Weiter: ' + esc(L.next.title) + ' →</a>' : "")));
    else {
      var b = el("button", "btn run", "✓ Lektion abschließen"); b.type = "button"; b.disabled = !complete;
      b.onclick = function () { ls = lget(); ls.fin = now(); lset(ls); var st = sget("fin"); st.n = 1; st.t0 = ls.t0; st.t1 = ls.fin; sset("fin", st); setDone("fin", true); update(); };
      secFin._act.appendChild(b);
      secFin._act.appendChild(el("span", "ls-small", complete ? "" : " Erst möglich, wenn die Verständnisprüfung bestanden ist und alle Pflichtaufgaben bearbeitet sind."));
    }
  } else {
    secFin._act.appendChild(el("div", "box " + (complete ? "merke" : "txt"), complete ? "✅ Alle Pflichtaufgaben sind bearbeitet. Dein Ergebnis wurde an mebis übertragen. Du kannst das Fenster schließen." : "Dein Fortschritt wird automatisch in mebis gespeichert. Du kannst jederzeit unterbrechen und später weitermachen."));
  }
  if (Scorm) {
    reqDeep.forEach(function (it) { var st = sget(it.id), d = isDone(it.id); Scorm.objective(ascii(L.id + "_" + it.id + "_" + (it.tag || it.type)), d ? (st.s ? "completed" : "passed") : (st.n || st.v != null ? "incomplete" : "not attempted"), d ? (st.p != null ? st.p * 100 : 0) : null); });
    Scorm.result(ds.pct * 100, complete);
  }
}
update();
if (MODE === "scorm" && Scorm && !Scorm.connected) root.insertBefore(el("div", "box warn", "⚠️ Keine Verbindung zu mebis gefunden – dein Fortschritt wird nicht gespeichert. Öffne die Lektion bitte direkt über die mebis-Aktivität."), root.firstChild);
if (location.hash) { var t = document.querySelector(location.hash); if (t) setTimeout(function () { t.scrollIntoView(); }, 60); }
window.LESSON_API = { update: update, checkScore: checkScore, deepScore: deepScore, store: Store };
})();
