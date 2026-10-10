/* spike.js – SPIKE-ähnlicher Block-Editor + Simulator für das LEGO SPIKE Prime Fahrgestell */
(function () {
"use strict";

/* =====================================================================
   1) Block-Definitionen
   ===================================================================== */
var CAT = {
  ev: { name: "Ereignisse", col: "#FFBF00", fg: "#3d2c00" },
  mv: { name: "Bewegung", col: "#FF4CB8", fg: "#fff" },
  mo: { name: "Motoren", col: "#0090F5", fg: "#fff" },
  li: { name: "Licht", col: "#9A5CFF", fg: "#fff" },
  so: { name: "Klang", col: "#CF63CF", fg: "#fff" },
  ct: { name: "Steuerung", col: "#FFAB19", fg: "#3d2600" },
  se: { name: "Sensoren", col: "#3FB5E0", fg: "#06303f" },
  va: { name: "Variablen", col: "#FF8C1A", fg: "#3d2000" },
  mb: { name: "Meine Blöcke", col: "#FF6680", fg: "#fff" }
};
var DIRS = ["vorwärts", "rückwärts"];
var UNITS_MV = ["cm", "Umdrehungen", "Sekunden"];
var UNITS_ST = ["cm", "Umdrehungen", "Grad", "Sekunden"];
var UNITS_MO = ["Grad", "Umdrehungen", "Sekunden"];
var COLORS = ["schwarz", "weiß", "rot", "grün", "blau", "gelb", "grau"];
var LIGHTS = ["aus", "weiß", "rot", "grün", "blau", "gelb", "orange", "violett"];

var BDEF = {
  mv_move:   { cat: "mv", tpl: "bewege {dir} für {n} {unit}", f: { dir: ["sel", DIRS], n: ["num"], unit: ["sel", UNITS_MV] }, d: { dir: "vorwärts", n: 10, unit: "cm" } },
  mv_steer:  { cat: "mv", tpl: "bewege mit Lenkung {s} für {n} {unit}", f: { s: ["num"], n: ["num"], unit: ["sel", UNITS_ST] }, d: { s: 0, n: 10, unit: "cm" } },
  mv_start:  { cat: "mv", tpl: "starte Bewegung {dir}", f: { dir: ["sel", DIRS] }, d: { dir: "vorwärts" } },
  mv_startst:{ cat: "mv", tpl: "starte Bewegung mit Lenkung {s}", f: { s: ["num"] }, d: { s: 0 } },
  mv_stop:   { cat: "mv", tpl: "stoppe Bewegung", f: {}, d: {} },
  mv_speed:  { cat: "mv", tpl: "setze Bewegungsgeschwindigkeit auf {n} %", f: { n: ["num"] }, d: { n: 50 } },
  mo_run:    { cat: "mo", tpl: "A  fahre {dir} für {n} {unit}", f: { dir: ["sel", ["↻ rechts", "↺ links"]], n: ["num"], unit: ["sel", UNITS_MO] }, d: { dir: "↺ links", n: 90, unit: "Grad" } },
  li_write:  { cat: "li", tpl: "schreibe {txt}", f: { txt: ["txt"] }, d: { txt: "Hallo" } },
  li_show:   { cat: "li", tpl: "schreibe Variable {v}", f: { v: ["var"] }, d: { v: "zähler" } },
  li_center: { cat: "li", tpl: "setze Mittellicht auf {c}", f: { c: ["sel", LIGHTS] }, d: { c: "grün" } },
  so_beep:   { cat: "so", tpl: "spiele Piepton für {n} Sek.", f: { n: ["num"] }, d: { n: 0.2 } },
  ct_wait:   { cat: "ct", tpl: "warte {n} Sekunden", f: { n: ["num"] }, d: { n: 1 } },
  ct_until:  { cat: "ct", tpl: "warte bis {c}", f: { c: ["cond"] }, d: { c: { k: "dist", op: "näher als", n: 10 } } },
  ct_repeat: { cat: "ct", tpl: "wiederhole {n} mal", f: { n: ["num"] }, d: { n: 4 }, shape: "c" },
  ct_forever:{ cat: "ct", tpl: "wiederhole fortlaufend", f: {}, d: {}, shape: "c" },
  ct_runtil: { cat: "ct", tpl: "wiederhole bis {c}", f: { c: ["cond"] }, d: { c: { k: "color", c: "schwarz" } }, shape: "c" },
  ct_if:     { cat: "ct", tpl: "falls {c} dann", f: { c: ["cond"] }, d: { c: { k: "color", c: "schwarz" } }, shape: "c" },
  ct_ifelse: { cat: "ct", tpl: "falls {c} dann", f: { c: ["cond"] }, d: { c: { k: "color", c: "schwarz" } }, shape: "c2" },
  ct_stopall:{ cat: "ct", tpl: "stoppe Programm", f: {}, d: {} },
  se_yaw0:   { cat: "se", tpl: "setze Gierwinkel auf 0", f: {}, d: {} },
  se_timer0: { cat: "se", tpl: "setze Timer zurück", f: {}, d: {} },
  va_set:    { cat: "va", tpl: "setze {v} auf {n}", f: { v: ["var"], n: ["num"] }, d: { v: "zähler", n: 0 } },
  va_add:    { cat: "va", tpl: "ändere {v} um {n}", f: { v: ["var"], n: ["num"] }, d: { v: "zähler", n: 1 } },
  mb_def:    { cat: "mb", tpl: "definiere {name}", f: { name: ["txt"] }, d: { name: "mein Block" }, shape: "c", def: true },
  mb_call:   { cat: "mb", tpl: "{name}", f: { name: ["txt"] }, d: { name: "mein Block" } }
};

/* Bedingungen (Sechsecke in SPIKE) */
var CDEF = {
  color:  { label: "E ist Farbe", f: { c: ["sel", COLORS] }, d: { c: "schwarz" } },
  refl:   { label: "E reflektiertes Licht", f: { op: ["sel", ["<", ">"]], n: ["num"] }, d: { op: "<", n: 50 }, suf: "%" },
  dist:   { label: "F ist", f: { op: ["sel", ["näher als", "weiter als"]], n: ["num"] }, d: { op: "näher als", n: 10 }, suf: "cm" },
  force:  { label: "B ist", f: { st: ["sel", ["gedrückt", "losgelassen"]] }, d: { st: "gedrückt" } },
  yaw:    { label: "Gierwinkel", f: { op: ["sel", [">", "<"]], n: ["num"] }, d: { op: ">", n: 90 }, suf: "°" },
  timer:  { label: "Timer >", f: { n: ["num"] }, d: { n: 5 }, suf: "s" },
  var:    { label: "Variable", f: { v: ["var"], op: ["sel", ["=", "<", ">"]], n: ["num"] }, d: { v: "zähler", op: "=", n: 3 } }
};
var CKINDS = ["color", "refl", "dist", "force", "yaw", "timer", "var"];
/* Welche Sensoren/Motoren hat der Roboter? Fahrgestell 1 = nur Hub (Gyro, Timer) + Fahrmotoren C/D */
function caps(robot) { robot = robot || {}; return { color: robot.color !== false, dist: robot.dist !== false, force: robot.force !== false, arm: !!robot.arm }; }
function condAllowed(k, cp) { return !((k === "color" || k === "refl") && !cp.color) && !(k === "dist" && !cp.dist) && !(k === "force" && !cp.force); }
var CKLABEL = { color: "Farbe", refl: "Licht %", dist: "Abstand", force: "Kraft", yaw: "Gierwinkel", timer: "Timer", var: "Variable" };

function clone(o) { return JSON.parse(JSON.stringify(o)); }
function newBlock(t, cp) {
  var d = BDEF[t], b = { t: t, a: clone(d.d) };
  if (d.shape === "c" || d.shape === "c2") b.b = [];
  if (d.shape === "c2") b.e = [];
  if (cp && b.a.c && typeof b.a.c === "object" && !condAllowed(b.a.c.k, cp)) b.a.c = { k: "timer", n: 2 };
  return b;
}
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function store(k, v) { if (window.LStore) return window.LStore.raw(k, v); if (window.RProg) k = window.RProg.k(k); try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }

/* =====================================================================
   2) Editor
   ===================================================================== */
function Editor(root, opts) {
  this.root = root; this.opts = opts || {}; this.prog = clone(opts.program || []);
  this.onChange = opts.onChange || function () {};
  var self = this;
  var wrap = el("div", "sp-editor");
  var pal = el("div", "sp-palette"); wrap.appendChild(pal);
  var ws = el("div", "sp-ws"); wrap.appendChild(ws);
  root.appendChild(wrap);
  this.pal = pal; this.ws = ws;
  this.caps = caps(opts.robot);
  this.buildPalette(opts.palette);
  this.render();
}
Editor.prototype.buildPalette = function (allowed) {
  var self = this, pal = this.pal;
  var list = allowed && allowed !== "all" ? allowed : Object.keys(BDEF), cp = this.caps;
  list = list.filter(function (t) { return !(t === "mo_run" && !cp.arm); });
  var lastCat = null;
  list.forEach(function (t) {
    var d = BDEF[t]; if (!d) return;
    if (d.cat !== lastCat) { pal.appendChild(el("div", "sp-pcat", CAT[d.cat].name)); lastCat = d.cat; }
    var b = self.blockEl(newBlock(t, self.caps), true);
    b.dataset.pt = t;
    pal.appendChild(b);
  });
  var tr = el("div", "sp-trash", "🗑 hierher ziehen = löschen"); pal.appendChild(tr);
};
Editor.prototype.setProgram = function (p) { this.prog = clone(p || []); this.render(); this.onChange(this.prog); };
Editor.prototype.render = function () {
  var ws = this.ws; ws.innerHTML = "";
  var hat = el("div", "sp-block sp-hat"); hat.style.background = CAT.ev.col; hat.style.color = CAT.ev.fg;
  hat.innerHTML = "<span>▶ Wenn Programm startet</span>"; ws.appendChild(hat);
  var stack = el("div", "sp-stack sp-main"); ws.appendChild(stack);
  this.renderList(this.prog, stack);
  if (!this.prog.length) stack.appendChild(el("div", "sp-hint", "Ziehe Blöcke hierher – oder tippe zuerst auf eine Einfügestelle und dann auf einen Block links."));
};
Editor.prototype.renderList = function (list, cont) {
  var self = this;
  cont.appendChild(this.dz(list, 0));
  list.forEach(function (b, i) {
    var be = self.blockEl(b, false, list, i);
    cont.appendChild(be);
    cont.appendChild(self.dz(list, i + 1));
  });
};
Editor.prototype.dz = function (list, idx) {
  var z = el("div", "sp-dz"); z._list = list; z._idx = idx;
  var self = this;
  z.addEventListener("click", function (e) { e.stopPropagation(); self.setCursor(z); });
  if (this.cursor && this.cursor.list === list && this.cursor.idx === idx) { z.classList.add("cur"); this.cursorEl = z; }
  return z;
};
Editor.prototype.setCursor = function (z) {
  if (this.cursorEl) this.cursorEl.classList.remove("cur");
  this.cursor = { list: z._list, idx: z._idx }; this.cursorEl = z; z.classList.add("cur");
};
Editor.prototype.fieldEl = function (b, key, spec, onch) {
  var self = this, v = b.a[key], type = spec[0];
  if (type === "sel") {
    var s = el("select", "sp-in"); spec[1].forEach(function (o) { var op = el("option", null, esc(o)); op.value = o; if (o === v) op.selected = true; s.appendChild(op); });
    s.addEventListener("change", function () { b.a[key] = s.value; onch(); }); return s;
  }
  if (type === "num") {
    var n = el("input", "sp-in sp-num"); n.type = "number"; n.step = "any"; n.value = v;
    n.addEventListener("input", function () { var x = parseFloat(n.value); b.a[key] = isNaN(x) ? 0 : x; onch(); }); return n;
  }
  if (type === "txt" || type === "var") {
    var t = el("input", "sp-in sp-txt" + (type === "var" ? " sp-var" : "")); t.type = "text"; t.value = v; t.size = Math.max(4, String(v).length);
    t.addEventListener("input", function () { b.a[key] = t.value; t.size = Math.max(4, t.value.length); onch(); }); return t;
  }
  if (type === "cond") return this.condEl(b.a, key, onch);
};
Editor.prototype.condEl = function (obj, key, onch) {
  var self = this, c = obj[key];
  var w = el("span", "sp-cond");
  var ks = el("select", "sp-in sp-ck");
  CKINDS.filter(function (k) { return condAllowed(k, self.caps) || k === c.k; }).forEach(function (k) { var op = el("option", null, CKLABEL[k]); op.value = k; if (k === c.k) op.selected = true; ks.appendChild(op); });
  w.appendChild(ks);
  var inner = el("span", "sp-cin"); w.appendChild(inner);
  function fill() {
    inner.innerHTML = ""; var cd = CDEF[c.k];
    inner.appendChild(el("span", "sp-lbl", esc(cd.label)));
    Object.keys(cd.f).forEach(function (fk) {
      if (c[fk] === undefined) c[fk] = cd.d[fk];
      inner.appendChild(self.fieldEl({ a: c }, fk, cd.f[fk], onch));
    });
    if (cd.suf) inner.appendChild(el("span", "sp-lbl", cd.suf));
  }
  ks.addEventListener("change", function () { var nk = ks.value; var nc = clone(CDEF[nk].d); nc.k = nk; obj[key] = nc; c = nc; fill(); onch(); });
  fill(); return w;
};
Editor.prototype.blockEl = function (b, inPalette, list, idx) {
  var self = this, d = BDEF[b.t], cat = CAT[d.cat];
  var be = el("div", "sp-block" + (d.shape ? " sp-c" : "") + (inPalette ? " sp-pb" : ""));
  be.style.background = cat.col; be.style.color = cat.fg;
  var line = el("div", "sp-line"); be.appendChild(line);
  var onch = function () { self.onChange(self.prog); };
  d.tpl.split(/(\{\w+\})/).forEach(function (part) {
    var m = part.match(/^\{(\w+)\}$/);
    if (m) {
      if (inPalette) { var v = b.a[m[1]]; line.appendChild(el("span", "sp-pv", esc(typeof v === "object" ? "◆" : v))); }
      else line.appendChild(self.fieldEl(b, m[1], d.f[m[1]], onch));
    } else if (part) line.appendChild(el("span", "sp-lbl", esc(part)));
  });
  if (!inPalette) {
    var x = el("button", "sp-del", "×"); x.type = "button"; x.title = "Block löschen";
    x.addEventListener("click", function (e) { e.stopPropagation(); list.splice(idx, 1); self.render(); onch(); });
    line.appendChild(x);
  }
  if (d.shape === "c" || d.shape === "c2") {
    var slot = el("div", "sp-slot"); be.appendChild(slot);
    if (!inPalette) self.renderList(b.b, slot);
    if (d.shape === "c2") {
      var mid = el("div", "sp-line sp-else"); mid.appendChild(el("span", "sp-lbl", "sonst")); be.appendChild(mid);
      var slot2 = el("div", "sp-slot"); be.appendChild(slot2);
      if (!inPalette) self.renderList(b.e, slot2);
    }
    be.appendChild(el("div", "sp-cend"));
  }
  // Ziehen
  be.addEventListener("pointerdown", function (e) {
    if (e.target.closest("input,select,button")) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();
    self.startDrag(e, inPalette ? { fresh: b.t } : { list: list, idx: idx, b: b }, be);
  });
  if (inPalette) be.addEventListener("click", function (e) {
    if (self._dragged) return;
    var nb = newBlock(b.t, self.caps), cur = self.cursor;
    if (cur) { cur.list.splice(cur.idx, 0, nb); cur.idx += 1; } else self.prog.push(nb);
    self.render(); onch();
  });
  return be;
};
Editor.prototype.startDrag = function (e, src, srcEl) {
  var self = this, sx = e.clientX, sy = e.clientY, ghost = null, target = null, started = false;
  self._dragged = false;
  function move(ev) {
    var dx = ev.clientX - sx, dy = ev.clientY - sy;
    if (!started && Math.abs(dx) + Math.abs(dy) < 6) return;
    if (!started) {
      started = true; self._dragged = true;
      ghost = srcEl.cloneNode(true); ghost.classList.add("sp-ghost"); document.body.appendChild(ghost);
      if (!src.fresh) srcEl.classList.add("sp-dragging");
      self.root.classList.add("sp-isdrag");
    }
    ev.preventDefault();
    ghost.style.left = (ev.clientX + 6) + "px"; ghost.style.top = (ev.clientY + 6) + "px";
    var best = null, bd = 1e9;
    self.ws.querySelectorAll(".sp-dz").forEach(function (z) {
      if (src.b && srcEl.contains(z)) return;
      var r = z.getBoundingClientRect(); if (!r.width) return;
      var cy = (r.top + r.bottom) / 2, cx = Math.max(r.left, Math.min(ev.clientX, r.right));
      var dd = Math.abs(ev.clientY - cy) + Math.abs(ev.clientX - cx) * 0.4;
      if (dd < bd) { bd = dd; best = z; }
    });
    var overPal = self.pal.getBoundingClientRect();
    var inPal = ev.clientX >= overPal.left && ev.clientX <= overPal.right && ev.clientY >= overPal.top && ev.clientY <= overPal.bottom;
    if (target) target.classList.remove("hot");
    target = (!inPal && bd < 90) ? best : null;
    if (target) target.classList.add("hot");
    self.pal.classList.toggle("del", inPal && !src.fresh);
  }
  function up(ev) {
    document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up);
    self.root.classList.remove("sp-isdrag"); self.pal.classList.remove("del");
    if (!started) return;
    if (ghost) ghost.remove();
    srcEl.classList.remove("sp-dragging");
    var blk = src.fresh ? newBlock(src.fresh, self.caps) : src.b;
    if (target) {
      var L = target._list, i = target._idx;
      if (!src.fresh) {
        var sl = src.list, si = sl.indexOf(src.b);
        sl.splice(si, 1);
        if (sl === L && si < i) i -= 1;
      }
      L.splice(i, 0, blk);
    } else if (!src.fresh) {
      var r = self.pal.getBoundingClientRect();
      if (ev.clientX >= r.left && ev.clientX <= r.right) src.list.splice(src.list.indexOf(src.b), 1);
    }
    self.render(); self.onChange(self.prog);
    setTimeout(function () { self._dragged = false; }, 50);
  }
  document.addEventListener("pointermove", move); document.addEventListener("pointerup", up);
};

/* Struktogramm (Nassi-Shneiderman) */
function condText(c) {
  var cd = CDEF[c.k], s = cd.label;
  Object.keys(cd.f).forEach(function (k) { s += " " + c[k]; });
  return s + (cd.suf ? " " + cd.suf : "");
}
function blockText(b) {
  var d = BDEF[b.t];
  return d.tpl.replace(/\{(\w+)\}/g, function (_, k) { var v = b.a[k]; return typeof v === "object" ? condText(v) : v; });
}
function struktogramm(list) {
  var h = '<div class="ns">';
  if (!list.length) h += '<div class="ns-s ns-empty">∅</div>';
  list.forEach(function (b) {
    var d = BDEF[b.t];
    if (b.t === "ct_if" || b.t === "ct_ifelse") {
      h += '<div class="ns-if"><div class="ns-cond">' + esc(condText(b.a.c)) + '?</div><div class="ns-tf"><span>wahr</span><span>falsch</span></div><div class="ns-cols"><div>' + struktogramm(b.b) + '</div><div>' + struktogramm(b.e || []) + '</div></div></div>';
    } else if (d.shape === "c") {
      var head = b.t === "ct_repeat" ? "wiederhole " + b.a.n + "-mal" : b.t === "ct_forever" ? "wiederhole fortlaufend" : b.t === "ct_runtil" ? "wiederhole bis " + condText(b.a.c) : "Unterprogramm „" + b.a.name + "“";
      h += '<div class="ns-loop"><div class="ns-head">' + esc(head) + '</div><div class="ns-body">' + struktogramm(b.b) + '</div></div>';
    } else h += '<div class="ns-s">' + esc(blockText(b)) + '</div>';
  });
  return h + "</div>";
}

/* =====================================================================
   3) Welt + Simulator
   ===================================================================== */
var WHEEL_CIRC = 17.6;     // cm (Rad 56 mm)
var TRACK = 11.2;          // Spurbreite cm
var MAXDEG = 1000;         // Rad-Grad/s bei 100 %
var SENS_AHEAD = 7.0;      // Farbsensor vor der Radachse (cm)
var FRONT = 9.5;           // Vorderkante

var REFL = { "schwarz": 12, "weiß": 98, "rot": 62, "grün": 34, "blau": 28, "gelb": 82, "grau": 40 };
var RGBC = { "schwarz": "#1b1b1b", "weiß": "#ffffff", "rot": "#e3242b", "grün": "#2eaa4a", "blau": "#1f6fd1", "gelb": "#f5c518", "grau": "#8f969c" };

function World(cfg) {
  cfg = cfg || {};
  this.size = cfg.size || [200, 115];
  this.lines = cfg.lines || [];       // {pts:[[x,y],...], w:2, c:"schwarz"}
  this.zones = cfg.zones || [];       // {r:[x1,y1,x2,y2], c:"rot", name:"Ziel"}
  this.walls = cfg.walls || [];       // [x1,y1,x2,y2]
  this.objs = clone(cfg.objs || []);  // {name, x, y, s:6, c:"#d98e04"}
  this.marks = cfg.marks || [];       // {x,y,label}
  this.border = cfg.border !== false; this.floor = cfg.floor || "weiß";
}
function distSeg(px, py, a, b) {
  var vx = b[0] - a[0], vy = b[1] - a[1], L = vx * vx + vy * vy;
  var t = L ? Math.max(0, Math.min(1, ((px - a[0]) * vx + (py - a[1]) * vy) / L)) : 0;
  return Math.hypot(px - (a[0] + t * vx), py - (a[1] + t * vy));
}
World.prototype.surface = function (x, y) {
  // Linien liegen über Zonen
  for (var i = this.lines.length - 1; i >= 0; i--) {
    var L = this.lines[i], w = (L.w || 2) / 2, best = 1e9;
    for (var k = 0; k + 1 < L.pts.length; k++) best = Math.min(best, distSeg(x, y, L.pts[k], L.pts[k + 1]));
    if (best <= w + 0.8) return { c: L.c || "schwarz", d: best, w: w };
  }
  for (var j = this.zones.length - 1; j >= 0; j--) {
    var z = this.zones[j].r;
    if (x >= z[0] && x <= z[2] && y >= z[1] && y <= z[3]) return { c: this.zones[j].c, d: -1 };
  }
  if (x < 0 || y < 0 || x > this.size[0] || y > this.size[1]) return { c: "schwarz", d: -1 };
  return { c: this.floor || "weiß", d: -1 };
};
World.prototype.colorAt = function (x, y) {
  var s = this.surface(x, y);
  if (s.d >= 0 && s.d > s.w) return "weiß";
  return s.c;
};
World.prototype.reflAt = function (x, y) {
  var s = this.surface(x, y);
  if (s.d >= 0) { // weicher Rand der Linie
    var inner = REFL[s.c] || 12, edge = s.w + 0.8;
    if (s.d <= s.w - 0.8) return inner;
    var t = Math.min(1, Math.max(0, (s.d - (s.w - 0.8)) / 1.6));
    return Math.round(inner + ((REFL[this.floor] || 98) - inner) * t);
  }
  return REFL[s.c] != null ? REFL[s.c] : 98;
};
World.prototype.allWalls = function () {
  var w = this.walls.slice();
  if (this.border) { var S = this.size; w.push([-5, -5, S[0] + 5, 0], [-5, S[1], S[0] + 5, S[1] + 5], [-5, -5, 0, S[1] + 5], [S[0], -5, S[0] + 5, S[1] + 5]); }
  return w;
};
function rayRect(ox, oy, dx, dy, r) {
  var tmin = 0, tmax = 1e9, ax = [[ox, dx, r[0], r[2]], [oy, dy, r[1], r[3]]];
  for (var i = 0; i < 2; i++) {
    var o = ax[i][0], d = ax[i][1], lo = ax[i][2], hi = ax[i][3];
    if (Math.abs(d) < 1e-12) { if (o < lo || o > hi) return null; }
    else { var t1 = (lo - o) / d, t2 = (hi - o) / d; if (t1 > t2) { var tt = t1; t1 = t2; t2 = tt; } tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2); if (tmin > tmax) return null; }
  }
  return tmin;
}

function Robot(cfg) {
  cfg = cfg || {};
  this.x = cfg.x != null ? cfg.x : 20; this.y = cfg.y != null ? cfg.y : 20;
  this.th = (cfg.h != null ? cfg.h : 0) * Math.PI / 180;   // mathematisch, 0 = +x
  this.th0 = this.th;
  this.arm = cfg.arm || false; this.armAng = 0; this.carry = null;
  this.dist = cfg.dist !== false; this.force = cfg.force !== false; this.drift = cfg.drift || 1;
  this.color = cfg.color !== false; this.slip = cfg.slip || 1;   // slip < 1: abgefahrene Reifen / Schlupf
}

/* Interpreter: führt das Programm in virtueller Zeit aus und protokolliert */
function simulate(prog, cfg) {
  cfg = cfg || {};
  var W = new World(cfg.world), R = new Robot(cfg.robot);
  var T = { t: 0 }, LIM = cfg.limit || 60, frames = [], events = [], err = null;
  var vars = {}, speedPct = 50, yawOff = 0, timer0 = 0;
  var wl = 0, wr = 0, degL = 0, degR = 0, armSpeed = 0, armTarget = null;
  var collided = false, collideCount = 0, maxOps = 2000000, ops = 0;
  var display = "", center = "aus", visited = {}, lineCross = 0, lastOnLine = false;
  var defs = {};
  (function collect(list) { list.forEach(function (b) { if (b.t === "mb_def") defs[(b.a.name || "").trim()] = b.b; }); })(prog);

  function yaw() { var y = -(R.th - R.th0) * 180 / Math.PI + yawOff; y = ((y + 180) % 360 + 360) % 360 - 180; return y; }
  function sensorPos() { return [R.x + Math.cos(R.th) * SENS_AHEAD, R.y + Math.sin(R.th) * SENS_AHEAD]; }
  function readDist() {
    var ox = R.x + Math.cos(R.th) * FRONT, oy = R.y + Math.sin(R.th) * FRONT, best = 1e9;
    W.allWalls().forEach(function (r) { var d = rayRect(ox, oy, Math.cos(R.th), Math.sin(R.th), r); if (d != null && d < best) best = d; });
    W.objs.forEach(function (o) { if (o === R.carry) return; var s = (o.s || 6) / 2; var d = rayRect(ox, oy, Math.cos(R.th), Math.sin(R.th), [o.x - s, o.y - s, o.x + s, o.y + s]); if (d != null && d < best) best = d; });
    return best > 200 ? 200 : Math.round(best * 10) / 10;
  }
  function frontBlocked(nx, ny) {
    var fx = nx + Math.cos(R.th) * FRONT, fy = ny + Math.sin(R.th) * FRONT;
    var px = -Math.sin(R.th), py = Math.cos(R.th);
    var pts = [[fx, fy], [fx + px * 5, fy + py * 5], [fx - px * 5, fy - py * 5]];
    var walls = W.allWalls();
    for (var i = 0; i < pts.length; i++) for (var k = 0; k < walls.length; k++) { var r = walls[k]; if (pts[i][0] >= r[0] && pts[i][0] <= r[2] && pts[i][1] >= r[1] && pts[i][1] <= r[3]) return true; }
    return false;
  }
  function backBlocked(nx, ny) {
    var bx = nx - Math.cos(R.th) * 6, by = ny - Math.sin(R.th) * 6, walls = W.allWalls();
    for (var k = 0; k < walls.length; k++) { var r = walls[k]; if (bx >= r[0] && bx <= r[2] && by >= r[1] && by <= r[3]) return true; }
    return false;
  }
  function forcePressed() {
    var fx = R.x + Math.cos(R.th) * (FRONT + 0.6), fy = R.y + Math.sin(R.th) * (FRONT + 0.6);
    var walls = W.allWalls();
    for (var k = 0; k < walls.length; k++) { var r = walls[k]; if (fx >= r[0] - 0.3 && fx <= r[2] + 0.3 && fy >= r[1] - 0.3 && fy <= r[3] + 0.3) return true; }
    for (var j = 0; j < W.objs.length; j++) { var o = W.objs[j], s = (o.s || 6) / 2 + 0.4; if (o !== R.carry && Math.abs(fx - o.x) <= s && Math.abs(fy - o.y) <= s) return true; }
    return false;
  }
  function log(force) {
    if (!force && frames.length && T.t - frames[frames.length - 1].t < 0.05) return;
    var sp = sensorPos();
    frames.push({ t: +T.t.toFixed(3), x: +R.x.toFixed(2), y: +R.y.toFixed(2), h: +(R.th * 180 / Math.PI).toFixed(2), yaw: Math.round(yaw()),
      col: W.colorAt(sp[0], sp[1]), refl: W.reflAt(sp[0], sp[1]), dist: R.dist ? readDist() : null, force: R.force ? forcePressed() : null,
      arm: Math.round(R.armAng), mc: Math.round(degL), md: Math.round(degR), tm: +(T.t - timer0).toFixed(1), disp: display, center: center, objs: W.objs.map(function (o) { return [o.x, o.y]; }) });
  }
  function step(h) {
    // Räder
    var dl = wl * h, dr = wr * h;
    degL += Math.abs(dl); degR += Math.abs(dr);
    var sl = dl / 360 * WHEEL_CIRC * R.slip, sr = dr / 360 * WHEEL_CIRC * R.slip;
    var ds = (sl + sr) / 2, dth = (sl - sr) / TRACK;  // Rechtsdrehung = th sinkt
    var nth = R.th - dth;
    var nx = R.x + ds * Math.cos(R.th - dth / 2), ny = R.y + ds * Math.sin(R.th - dth / 2);
    var blocked = (ds > 0 && frontBlocked(nx, ny)) || (ds < 0 && backBlocked(nx, ny));
    if (blocked) { if (!collided) collideCount++; collided = true; } else { R.x = nx; R.y = ny; collided = false; }
    R.th = nth;
    // Objekte schieben (vor dem Roboter)
    W.objs.forEach(function (o) {
      if (o === R.carry) return;
      var s = (o.s || 6) / 2;
      var fx = R.x + Math.cos(R.th) * FRONT, fy = R.y + Math.sin(R.th) * FRONT;
      var relx = (o.x - R.x) * Math.cos(R.th) + (o.y - R.y) * Math.sin(R.th);
      var rely = -(o.x - R.x) * Math.sin(R.th) + (o.y - R.y) * Math.cos(R.th);
      if (ds > 0 && relx > 0 && relx < FRONT + s && Math.abs(rely) < 6 + s) {
        var push = FRONT + s - relx; o.x += Math.cos(R.th) * push; o.y += Math.sin(R.th) * push;
      }
    });
    // Anbau-Motor A (Gabel)
    if (armTarget != null) {
      var dA = armSpeed * h, rest = armTarget - R.armAng;
      if (Math.abs(rest) <= Math.abs(dA)) { R.armAng = armTarget; armTarget = null; } else R.armAng += Math.sign(rest) * Math.abs(dA);
      R.armAng = Math.max(-10, Math.min(120, R.armAng));
      if (R.arm) {
        if (!R.carry && R.armAng > 40) {
          W.objs.forEach(function (o) {
            var relx = (o.x - R.x) * Math.cos(R.th) + (o.y - R.y) * Math.sin(R.th), rely = -(o.x - R.x) * Math.sin(R.th) + (o.y - R.y) * Math.cos(R.th);
            if (!R.carry && relx > FRONT - 2 && relx < FRONT + 8 && Math.abs(rely) < 6) { R.carry = o; events.push({ t: T.t, k: "grab", n: o.name }); }
          });
        }
        if (R.carry && R.armAng < 20) { events.push({ t: T.t, k: "drop", n: R.carry.name }); R.carry = null; }
      }
    }
    if (R.carry) { R.carry.x = R.x + Math.cos(R.th) * (FRONT + 4); R.carry.y = R.y + Math.sin(R.th) * (FRONT + 4); }
    // Zonen + Linien protokollieren
    W.zones.forEach(function (z) { if (z.name && R.x >= z.r[0] && R.x <= z.r[2] && R.y >= z.r[1] && R.y <= z.r[3]) visited[z.name] = true; });
    var sp = sensorPos(), on = W.colorAt(sp[0], sp[1]) === "schwarz";
    if (on && !lastOnLine) lineCross++; lastOnLine = on;
    T.t += h; ops++;
    log(false);
  }
  function advance(sec) { var end = T.t + sec; while (T.t < end - 1e-9) { step(Math.min(0.01, end - T.t)); if (T.t > LIM) throw { limit: true }; } }
  function waitUntil(pred) { var n = 0; while (!pred()) { step(0.01); if (T.t > LIM) throw { limit: true }; } }
  function tick() { if (ops > maxOps) throw { msg: "Das Programm läuft in einer Endlosschleife ohne Wartezeit." }; step(0.002); if (T.t > LIM) throw { limit: true }; }

  function cond(c) {
    var sp = sensorPos();
    switch (c.k) {
      case "color": if (!R.color) throw { msg: "Am Port E ist kein Farbsensor angeschlossen (Fahrgestell 1 hat keine Sensoren am Hub – nur den eingebauten Gyrosensor)." }; return W.colorAt(sp[0], sp[1]) === c.c;
      case "refl": if (!R.color) throw { msg: "Am Port E ist kein Farbsensor angeschlossen (Fahrgestell 1 hat keine Sensoren am Hub – nur den eingebauten Gyrosensor)." }; var r = W.reflAt(sp[0], sp[1]); return c.op === "<" ? r < c.n : r > c.n;
      case "dist": if (!R.dist) throw { msg: "Am Port F ist kein Abstandssensor angeschlossen." }; var d = readDist(); return c.op === "näher als" ? d < c.n : d > c.n;
      case "force": if (!R.force) throw { msg: "Am Port B ist kein Kraftsensor angeschlossen." }; var p = forcePressed(); return c.st === "gedrückt" ? p : !p;
      case "yaw": var y = yaw(); return c.op === ">" ? y > c.n : y < c.n;
      case "timer": return T.t - timer0 > c.n;
      case "var": var v = vars[c.v] || 0; return c.op === "=" ? v === c.n : c.op === "<" ? v < c.n : v > c.n;
    }
    return false;
  }
  function wheelSpeeds(steer, dir) {
    var sp = Math.max(-100, Math.min(100, speedPct)) / 100 * MAXDEG * (dir === "rückwärts" ? -1 : 1);
    var s = Math.max(-100, Math.min(100, steer));
    var l = sp, r = sp;
    if (s > 0) r = sp * (100 - 2 * s) / 100; else if (s < 0) l = sp * (100 + 2 * s) / 100;
    return [l, r * R.drift];
  }
  function moveFor(steer, n, unit, dir) {
    if (n < 0) { n = -n; dir = dir === "rückwärts" ? "vorwärts" : "rückwärts"; }
    var ws = wheelSpeeds(steer, dir); wl = ws[0]; wr = ws[1];
    var outer = Math.abs(wl) >= Math.abs(wr) ? "L" : "R";
    var startL = degL, startR = degR, deg;
    if (unit === "Sekunden") advance(n);
    else {
      deg = unit === "cm" ? n / WHEEL_CIRC * 360 : unit === "Umdrehungen" ? n * 360 : n;
      if (wl === 0 && wr === 0) { /* nichts */ }
      else waitUntil(function () { return (outer === "L" ? degL - startL : degR - startR) >= deg; });
    }
    wl = 0; wr = 0;
  }
  function run(list, depth) {
    if (depth > 40) throw { msg: "Zu tiefe Verschachtelung (ruft sich ein Block selbst auf?)" };
    for (var i = 0; i < list.length; i++) {
      var b = list[i], a = b.a; tick();
      switch (b.t) {
        case "mv_move": moveFor(0, a.n, a.unit, a.dir); break;
        case "mv_steer": moveFor(a.s, a.n, a.unit, "vorwärts"); break;
        case "mv_start": var w1 = wheelSpeeds(0, a.dir); wl = w1[0]; wr = w1[1]; break;
        case "mv_startst": var w2 = wheelSpeeds(a.s, "vorwärts"); wl = w2[0]; wr = w2[1]; break;
        case "mv_stop": wl = 0; wr = 0; break;
        case "mv_speed": speedPct = Math.max(-100, Math.min(100, a.n)); break;
        case "mo_run":
          if (!R.arm) throw { msg: "Am Port A ist kein Anbau-Motor angeschlossen." };
          var sign = a.dir.indexOf("links") >= 0 ? 1 : -1;
          if (a.unit === "Sekunden") { armSpeed = 300; armTarget = R.armAng + sign * 300 * a.n; advance(a.n); armTarget = null; }
          else { var dg = a.unit === "Umdrehungen" ? a.n * 360 : a.n; armSpeed = 300; armTarget = Math.max(-10, Math.min(120, R.armAng + sign * dg)); waitUntil(function () { return armTarget == null; }); }
          break;
        case "li_write": display = String(a.txt); events.push({ t: T.t, k: "write", v: display }); break;
        case "li_show": display = String(vars[a.v] || 0); events.push({ t: T.t, k: "write", v: display }); break;
        case "li_center": center = a.c; events.push({ t: T.t, k: "light", v: center }); break;
        case "so_beep": events.push({ t: T.t, k: "beep" }); advance(Math.max(0, a.n)); break;
        case "ct_wait": advance(Math.max(0, a.n)); break;
        case "ct_until": waitUntil(function () { return cond(a.c); }); break;
        case "ct_repeat": for (var k = 0; k < Math.floor(a.n); k++) run(b.b, depth + 1); break;
        case "ct_forever": for (;;) { run(b.b, depth + 1); tick(); } break;
        case "ct_runtil": while (!cond(a.c)) { run(b.b, depth + 1); tick(); } break;
        case "ct_if": if (cond(a.c)) run(b.b, depth + 1); break;
        case "ct_ifelse": if (cond(a.c)) run(b.b, depth + 1); else run(b.e, depth + 1); break;
        case "ct_stopall": throw { stop: true };
        case "se_yaw0": yawOff = 0; R.th0 = R.th; break;
        case "se_timer0": timer0 = T.t; break;
        case "va_set": vars[a.v] = a.n; break;
        case "va_add": vars[a.v] = (vars[a.v] || 0) + a.n; break;
        case "mb_def": break;
        case "mb_call":
          var body = defs[(a.name || "").trim()];
          if (!body) throw { msg: "Den Block „" + a.name + "“ gibt es nicht. Lege ihn mit „definiere …“ an." };
          run(body, depth + 1); break;
      }
    }
  }
  var timeout = false, stopped = false;
  log(true);
  try { run(prog, 0); wl = 0; wr = 0; }
  catch (e) {
    if (e && e.limit) timeout = true;
    else if (e && e.stop) stopped = true;
    else err = (e && e.msg) || String(e);
  }
  log(true);
  return { frames: frames, events: events, err: err, timeout: timeout, stopped: stopped, t: T.t, vars: vars,
           final: { x: R.x, y: R.y, h: R.th * 180 / Math.PI, yaw: yaw(), arm: R.armAng, carry: R.carry ? R.carry.name : null },
           objs: W.objs, visited: visited, collisions: collideCount, lineCross: lineCross, display: display, world: W };
}

/* =====================================================================
   4) Darstellung der Matte + Abspielen
   ===================================================================== */
function Stage(root, cfg) {
  this.cfg = cfg; this.root = root; this.res = null; this.t = 0; this.timer = null;
  var hub = el("div", "sp-hub");
  hub.innerHTML = '<div class="sp-mx"><span class="sp-mxt"> </span></div><div class="sp-cl"><i></i><span>Mittellicht</span></div><div class="sp-sens"></div>';
  root.appendChild(hub); this.hub = hub;
  var cv = el("canvas", "sp-mat"); var S = (cfg.world && cfg.world.size) || [200, 115];
  cv.width = 760; cv.height = Math.round(760 * S[1] / S[0]); root.appendChild(cv); this.cv = cv;
  var pl = el("div", "sp-player");
  pl.innerHTML = '<button class="sp-btn" type="button">▶</button><input type="range" min="0" max="1000" value="0" aria-label="Zeitleiste"><span class="sp-tt">0,0 s</span><select aria-label="Tempo"><option value="1">1×</option><option value="2" selected>2×</option><option value="5">5×</option></select>';
  root.appendChild(pl);
  var self = this;
  this.pb = pl.querySelector("button"); this.rg = pl.querySelector("input"); this.tt = pl.querySelector(".sp-tt"); this.spd = pl.querySelector("select");
  this.pb.onclick = function () { if (self.timer) self.pause(); else self.play(); };
  this.rg.oninput = function () { self.pause(); if (self.res) self.show(self.res.t * self.rg.value / 1000); };
  this.world = new World(cfg.world); this.robot0 = new Robot(cfg.robot);
  this.show(0);
}
Stage.prototype.load = function (res) { this.res = res; this.t = 0; this.play(); };
Stage.prototype.play = function () {
  if (!this.res) return; var self = this; if (this.t >= this.res.t - 1e-6) this.t = 0; var last = performance.now(); this.pb.textContent = "❚❚";
  this.timer = requestAnimationFrame(function stepf(now) {
    var dt = (now - last) / 1000; last = now; self.t = Math.min(self.res.t, self.t + dt * parseFloat(self.spd.value)); self.show(self.t);
    if (self.t >= self.res.t) { self.pause(); return; } self.timer = requestAnimationFrame(stepf);
  });
};
Stage.prototype.pause = function () { if (this.timer) cancelAnimationFrame(this.timer); this.timer = null; this.pb.textContent = "▶"; };
Stage.prototype.frameAt = function (t) {
  var F = this.res ? this.res.frames : null; if (!F || !F.length) return null;
  var lo = 0, hi = F.length - 1; while (lo < hi) { var m = (lo + hi + 1) >> 1; if (F[m].t <= t) lo = m; else hi = m - 1; } return lo;
};
Stage.prototype.show = function (t) {
  var res = this.res, fi = this.frameAt(t), F = fi != null ? res.frames[fi] : null;
  var tot = res ? res.t : 0;
  this.tt.textContent = t.toFixed(1).replace(".", ",") + " s / " + tot.toFixed(1).replace(".", ",") + " s";
  if (tot > 0) this.rg.value = Math.round(1000 * t / tot);
  var mx = this.hub.querySelector(".sp-mxt"), cl = this.hub.querySelector(".sp-cl i"), se = this.hub.querySelector(".sp-sens");
  var LC = { "aus": "#3a4450", "weiß": "#fff", "rot": "#ff3b30", "grün": "#34c759", "blau": "#3fa7ff", "gelb": "#ffcc00", "orange": "#ff9500", "violett": "#b05cff" };
  if (F) {
    mx.textContent = F.disp || " "; cl.style.background = LC[F.center] || "#3a4450"; cl.style.boxShadow = F.center && F.center !== "aus" ? "0 0 10px " + LC[F.center] : "none";
    var cp = caps(this.cfg.robot);
    se.innerHTML = (cp.color ? '<span>E Farbe: <b>' + esc(F.col) + '</b></span><span>E Licht: <b>' + F.refl + ' %</b></span>' : '<span>Motor C: <b>' + (F.mc || 0) + '°</b></span><span>Motor D: <b>' + (F.md || 0) + '°</b></span>') +
      (F.dist != null ? '<span>F Abstand: <b>' + (F.dist >= 200 ? "–" : F.dist + " cm") + '</b></span>' : "") +
      (F.force != null ? '<span>B Kraft: <b>' + (F.force ? "gedrückt" : "frei") + '</b></span>' : "") +
      '<span>Gierwinkel: <b>' + F.yaw + '°</b></span>' + (!cp.color ? '<span>Timer: <b>' + String(F.tm != null ? F.tm : 0).replace(".", ",") + ' s</b></span>' : "") + (this.cfg.robot && this.cfg.robot.arm ? '<span>A Gabel: <b>' + F.arm + '°</b></span>' : "");
  } else { se.innerHTML = caps(this.cfg.robot).color ? '<span>E Farbe: –</span><span>Gierwinkel: 0°</span>' : '<span>Motor C: 0°</span><span>Motor D: 0°</span><span>Gierwinkel: 0°</span>'; }
  this.draw(fi);
};
Stage.prototype.draw = function (fi) {
  var cv = this.cv, g = cv.getContext("2d"), W = this.world, S = W.size, k = cv.width / S[0];
  function X(x) { return x * k; } function Y(y) { return cv.height - y * k; }
  g.clearRect(0, 0, cv.width, cv.height); g.fillStyle = RGBC[W.floor] || "#fff"; g.fillRect(0, 0, cv.width, cv.height);
  g.strokeStyle = "#eef1f3"; g.lineWidth = 1;
  for (var gx = 10; gx < S[0]; gx += 10) { g.beginPath(); g.moveTo(X(gx), 0); g.lineTo(X(gx), cv.height); g.stroke(); }
  for (var gy = 10; gy < S[1]; gy += 10) { g.beginPath(); g.moveTo(0, Y(gy)); g.lineTo(cv.width, Y(gy)); g.stroke(); }
  W.zones.forEach(function (z) {
    g.fillStyle = RGBC[z.c] || z.c; g.globalAlpha = z.c === "weiß" ? 1 : 0.9; g.fillRect(X(z.r[0]), Y(z.r[3]), (z.r[2] - z.r[0]) * k, (z.r[3] - z.r[1]) * k); g.globalAlpha = 1;
    if (z.name) { g.fillStyle = z.c === "gelb" || z.c === "weiß" ? "#333" : "#fff"; g.font = "bold 12px system-ui"; g.fillText(z.name, X(z.r[0]) + 4, Y(z.r[3]) + 14); }
  });
  if (this.cfg.world && this.cfg.world.start) { var st = this.cfg.world.start; g.strokeStyle = "#8a97a3"; g.setLineDash([5, 4]); g.strokeRect(X(st[0]), Y(st[3]), (st[2] - st[0]) * k, (st[3] - st[1]) * k); g.setLineDash([]); g.fillStyle = "#8a97a3"; g.font = "11px system-ui"; g.fillText("Start", X(st[0]) + 3, Y(st[1]) - 4); }
  W.lines.forEach(function (L) {
    g.strokeStyle = RGBC[L.c || "schwarz"]; g.lineWidth = (L.w || 2) * k; g.lineCap = "round"; g.lineJoin = "round";
    g.beginPath(); L.pts.forEach(function (p, i) { if (i) g.lineTo(X(p[0]), Y(p[1])); else g.moveTo(X(p[0]), Y(p[1])); }); g.stroke();
  });
  W.walls.forEach(function (r) { g.fillStyle = "#8d6e4a"; g.fillRect(X(r[0]), Y(r[3]), (r[2] - r[0]) * k, (r[3] - r[1]) * k); g.strokeStyle = "#5e4630"; g.lineWidth = 1; g.strokeRect(X(r[0]), Y(r[3]), (r[2] - r[0]) * k, (r[3] - r[1]) * k); });
  W.marks.forEach(function (m) { g.strokeStyle = "#d98e04"; g.lineWidth = 2; g.beginPath(); g.arc(X(m.x), Y(m.y), 6, 0, 7); g.stroke(); if (m.label) { g.fillStyle = "#a36a00"; g.font = "11px system-ui"; g.fillText(m.label, X(m.x) + 8, Y(m.y) - 6); } });
  var res = this.res, F = res && fi != null ? res.frames : null;
  // Spur
  if (F) {
    g.strokeStyle = "rgba(31,111,120,.55)"; g.lineWidth = 2; g.beginPath();
    for (var i = 0; i <= fi; i++) { if (i) g.lineTo(X(F[i].x), Y(F[i].y)); else g.moveTo(X(F[i].x), Y(F[i].y)); } g.stroke();
  }
  // Objekte
  var objs = (this.cfg.world && this.cfg.world.objs) || [];
  objs.forEach(function (o, j) {
    var p = F ? F[fi].objs[j] : [o.x, o.y], s = (o.s || 6);
    g.fillStyle = o.c || "#d98e04"; g.fillRect(X(p[0] - s / 2), Y(p[1] + s / 2), s * k, s * k); g.strokeStyle = "#5c3d00"; g.lineWidth = 1.2; g.strokeRect(X(p[0] - s / 2), Y(p[1] + s / 2), s * k, s * k);
    if (o.name) { g.fillStyle = "#333"; g.font = "10px system-ui"; g.fillText(o.name, X(p[0] + s / 2) + 2, Y(p[1] + s / 2)); }
  });
  // Roboter
  var r0 = this.robot0, pose = F ? F[fi] : { x: r0.x, y: r0.y, h: r0.th * 180 / Math.PI, arm: 0 };
  g.save(); g.translate(X(pose.x), Y(pose.y)); g.rotate(-pose.h * Math.PI / 180);
  var L = k;
  g.fillStyle = "#222"; g.fillRect(-3 * L, -TRACK / 2 * L - 1.6 * L, 6 * L, 1.8 * L); g.fillRect(-3 * L, TRACK / 2 * L - 0.2 * L, 6 * L, 1.8 * L); // Räder
  g.fillStyle = "#f5c518"; g.strokeStyle = "#7a6000"; g.lineWidth = 1;
  g.beginPath(); g.rect(-6 * L, -5.2 * L, 14 * L, 10.4 * L); g.fill(); g.stroke();      // Rahmen
  g.fillStyle = "#f4f6f7"; g.fillRect(-4.5 * L, -3.6 * L, 8.5 * L, 7.2 * L); g.strokeStyle = "#9aa5ad"; g.strokeRect(-4.5 * L, -3.6 * L, 8.5 * L, 7.2 * L); // Hub
  g.fillStyle = "#3a4450"; g.fillRect(-2.2 * L, -1.6 * L, 3.2 * L, 3.2 * L);             // Lichtmatrix
  if (!this.cfg.robot || this.cfg.robot.color !== false) { g.fillStyle = "#7bc8e8"; g.beginPath(); g.arc(SENS_AHEAD * L, 0, 1.3 * L, 0, 7); g.fill(); } // Farbsensor
  if (this.cfg.robot && this.cfg.robot.dist !== false) { g.fillStyle = "#cfd6db"; g.fillRect((FRONT - 1.4) * L, -3 * L, 1.4 * L, 6 * L); g.fillStyle = "#333"; g.beginPath(); g.arc((FRONT - 0.7) * L, -1.6 * L, 0.6 * L, 0, 7); g.arc((FRONT - 0.7) * L, 1.6 * L, 0.6 * L, 0, 7); g.fill(); }
  if (this.cfg.robot && this.cfg.robot.arm) { var up = (pose.arm || 0) > 40; g.fillStyle = up ? "#0090F5" : "#7cc3f5"; g.fillRect((FRONT) * L, -4 * L, 3 * L, 1.2 * L); g.fillRect((FRONT) * L, 2.8 * L, 3 * L, 1.2 * L); }
  g.fillStyle = "#D98E04"; g.beginPath(); g.moveTo(12.5 * L, 0); g.lineTo(9.8 * L, -1.6 * L); g.lineTo(9.8 * L, 1.6 * L); g.closePath(); g.fill();
  g.restore();
  g.fillStyle = "#5b6672"; g.font = "12px system-ui"; g.fillText("x=" + pose.x.toFixed(0) + " cm  y=" + pose.y.toFixed(0) + " cm", 6, cv.height - 6);
};

/* =====================================================================
   5) Aufgaben-Widget
   ===================================================================== */
var EX = window.SPIKE_EX || {};
function helpers(res) {
  var F = res.frames, last = F[F.length - 1];
  return {
    R: res, F: F, last: last,
    near: function (x, y, tol) { return Math.hypot(last.x - x, last.y - y) <= tol; },
    passed: function (x, y, tol) { return F.some(function (f) { return Math.hypot(f.x - x, f.y - y) <= tol; }); },
    inRect: function (r) { return last.x >= r[0] && last.x <= r[2] && last.y >= r[1] && last.y <= r[3]; },
    yawNear: function (v, tol) { var d = ((res.final.yaw - v + 540) % 360) - 180; return Math.abs(d) <= tol; },
    writes: function () { return res.events.filter(function (e) { return e.k === "write"; }).map(function (e) { return e.v; }); },
    beeps: function () { return res.events.filter(function (e) { return e.k === "beep"; }).length; },
    lights: function () { return res.events.filter(function (e) { return e.k === "light"; }).map(function (e) { return e.v; }); },
    obj: function (name) { for (var i = 0; i < res.objs.length; i++) if (res.objs[i].name === name) return res.objs[i]; return null; },
    uses: function (prog, t) { var f = false; (function w(L) { L.forEach(function (b) { if (b.t === t) f = true; if (b.b) w(b.b); if (b.e) w(b.e); }); })(prog); return f; },
    count: function (prog, t) { var n = 0; (function w(L) { L.forEach(function (b) { if (b.t === t) n++; if (b.b) w(b.b); if (b.e) w(b.e); }); })(prog); return n; },
    total: function (prog) { var n = 0; (function w(L) { L.forEach(function (b) { n++; if (b.b) w(b.b); if (b.e) w(b.e); }); })(prog); return n; }
  };
}
function stUpd(key, fn) { if (store(key + ":done")) return; var s = {}; try { s = JSON.parse(store(key + ":st") || "{}") || {}; } catch (e) {} s.n = s.n || 0; s.f = s.f || 0; s.h = s.h || 0; fn(s); store(key + ":st", JSON.stringify(s)); }
function buildExercise(box, dIn, opts) {
  opts = opts || {};
  var id = box.getAttribute("data-ex"), d = dIn || EX[id]; if (!d) return;
  var key = opts.key || ("spike:" + location.pathname.split("/").pop() + ":" + id);
  var solAfter = opts.solAfter || 0;          // Musterlösung erst nach so vielen erfolglosen Prüfungen
  var saved = null; try { saved = JSON.parse(store(key) || "null"); } catch (e) {}
  var grid = el("div", "sp-grid"); box.appendChild(grid);
  var left = el("div", "sp-left"); grid.appendChild(left);
  var right = el("div", "sp-right"); grid.appendChild(right);
  var ed = new Editor(left, { program: saved || d.starter || [], palette: d.palette || "all", robot: d.robot,
    onChange: function (p) { store(key, JSON.stringify(p)); if (nsBox.classList.contains("show")) nsBox.innerHTML = struktogramm(p); if (opts.onChange) opts.onChange(p); } });
  var btns = el("div", "sp-btns"); left.appendChild(btns);
  function mk(lbl, cls) { var b = el("button", "sp-btn " + (cls || ""), lbl); b.type = "button"; btns.appendChild(b); return b; }
  var bRun = mk("▶ Start", "run"), bChk = d.check ? mk("✓ Prüfen", "chk") : null, bNs = mk("Struktogramm"), bHint = (d.hints || []).length ? mk("💡 Tipp") : null,
      bSol = d.solution ? mk("Lösung") : null, bReset = mk("↺");
  bReset.title = "Programm zurücksetzen";
  var out = el("div", "sp-out"); out.setAttribute("aria-live", "polite"); left.appendChild(out);
  var nsBox = el("div", "sp-ns"); left.appendChild(nsBox);
  var hintBox = el("div", "sp-hintbox"); left.appendChild(hintBox);
  var stage = new Stage(right, d);
  var hintIdx = 0, tShown = Date.now();
  function stObj() { var st = {}; try { st = JSON.parse(store(key + ":st") || "{}") || {}; } catch (e) {} return st; }
  function solState() {
    if (!bSol) return;
    var st = stObj(), ok = !solAfter || (st.f || 0) >= solAfter || store(key + ":done");
    bSol.disabled = !ok;
    bSol.title = ok ? "Musterlösung laden" : "Die Musterlösung gibt es nach " + solAfter + " erfolglosen Prüfungen – probiere es zuerst selbst.";
  }
  function exec(withCheck) {
    var res = simulate(ed.prog, d);
    var msgs = [];
    if (res.err) msgs.push('<div class="sp-err"><b>Fehler:</b> ' + esc(res.err) + '</div>');
    if (res.timeout) msgs.push('<div class="sp-info">⏱ Simulation nach ' + (d.limit || 60) + ' s beendet.</div>');
    if (res.collisions) msgs.push('<div class="sp-info">💥 Der Roboter ist ' + res.collisions + '× angestoßen.</div>');
    if (withCheck && d.check) {
      var checks = [];
      try { (new Function("H", "P", "ok", "with(H){" + d.check + "}"))(helpers(res), ed.prog, function (c, good, bad) { checks.push({ ok: !!c, m: c ? good : (bad || good) }); }); }
      catch (e) { checks.push({ ok: false, m: "Prüfung nicht möglich: " + e.message }); }
      var all = !!(checks.length && checks.every(function (c) { return c.ok; }) && !res.err);
      var wasDone = !!store(key + ":done");
      msgs.push('<ul class="sp-checks">' + checks.map(function (c) { return '<li class="' + (c.ok ? "ok" : "no") + '">' + esc(c.m) + '</li>'; }).join("") + (all ? '<li class="ok"><b>Super – Aufgabe gelöst!</b></li>' : "") + '</ul>');
      stUpd(key, function (st) { st.n++; if (!st.t0) st.t0 = Date.now(); if (!all) st.f++; else st.t1 = Date.now(); });
      if (all) { store(key + ":done", "1"); mark(); }
      if (!all && opts.hintAfterFail && d.hints && d.hints.length) {
        var stf = stObj(); var hi = Math.min(d.hints.length, Math.max(0, (stf.f || 0) - 1));
        if (hi > 0) { hintBox.classList.add("show"); hintBox.innerHTML = d.hints.slice(0, hi).map(function (h, i) { return "<div>💡 <b>Tipp " + (i + 1) + ":</b> " + h + "</div>"; }).join(""); }
      }
      showTries(box, key); solState();
      if (opts.onCheck) opts.onCheck({ ok: all, wasDone: wasDone, checks: checks, prog: ed.prog, latency: Date.now() - tShown, res: res });
      tShown = Date.now();
    }
    out.innerHTML = msgs.join("") || '<span class="sp-muted">Programm ausgeführt (' + res.t.toFixed(1).replace(".", ",") + ' s).</span>';
    stage.load(res);
    if (opts.onRun) opts.onRun(res);
  }
  bRun.onclick = function () { exec(false); };
  if (bChk) bChk.onclick = function () { exec(true); };
  bNs.onclick = function () { nsBox.classList.toggle("show"); if (nsBox.classList.contains("show")) nsBox.innerHTML = struktogramm(ed.prog); };
  if (bHint) bHint.onclick = function () { stUpd(key, function (st) { st.h++; }); hintBox.classList.add("show"); hintBox.innerHTML = d.hints.slice(0, hintIdx + 1).map(function (h, i) { return "<div>💡 <b>Tipp " + (i + 1) + ":</b> " + h + "</div>"; }).join("") + (d.ref ? '<div class="sp-ref">📘 ' + esc(d.ref) + '</div>' : ""); hintIdx = Math.min(hintIdx + 1, d.hints.length - 1); if (opts.onHint) opts.onHint(); };
  if (bSol) bSol.onclick = function () {
    if (bSol.disabled) return;
    if (!bSol._armed) { bSol._armed = true; bSol.textContent = "Lösung wirklich laden? (ersetzt dein Programm)"; setTimeout(function () { bSol._armed = false; bSol.textContent = "Lösung"; }, 5000); return; }
    bSol._armed = false; bSol.textContent = "Lösung";
    stUpd(key, function (st) { st.s = 1; }); ed.setProgram(d.solution);
    out.innerHTML = '<div class="sp-info">Musterlösung geladen. Schau sie dir genau an, starte sie und drücke dann <b>✓ Prüfen</b>.</div>';
    if (opts.onSolution) opts.onSolution();
  };
  bReset.onclick = function () { ed.setProgram(d.starter || []); };
  function mark() { var h = box.querySelector(".exh .lvl"); if (h && h.textContent.indexOf("✓") < 0) h.textContent = "✓ gelöst · " + h.textContent; }
  if (store(key + ":done")) mark();
  showTries(box, key); solState();
  return { editor: ed, stage: stage, exec: exec };
}

/* =====================================================================
   6) Kleine interaktive Widgets (Quiz, Rechner, Zuordnung)
   ===================================================================== */
function showTries(box, key) {   // Versuche für die Schüler sichtbar machen
  var h = box.querySelector(".exh"); if (!h) return;
  var t = h.querySelector(".tries"); if (!t) { t = document.createElement("span"); t.className = "tries"; h.appendChild(t); }
  var st = {}; try { st = JSON.parse(store(key + ":st") || "{}") || {}; } catch (e) {}
  var done = !!store(key + ":done");
  t.textContent = st.n ? (done ? "gelöst im " + st.n + ". Versuch" : st.n + (st.n === 1 ? " Versuch" : " Versuche") + " – noch nicht gelöst") : "";
  t.className = "tries" + (done ? " ok" : (st.n ? " open" : ""));
}
function buildQuiz(q) {   // Ankreuzfragen: Reihenfolge gemischt, Versuche gezählt, gelöst/ungelöst gespeichert
  var file = location.pathname.split("/").pop() || "index.html";
  var items = [].slice.call(q.querySelectorAll(".qq")), head = q.querySelector("b");
  var sum = document.createElement("span"); sum.className = "qsum"; if (head) head.appendChild(sum);
  function updHead() { var d = items.filter(function (it) { return it._done; }).length; sum.textContent = d + " von " + items.length + " gelöst"; sum.className = "qsum" + (d === items.length ? " ok" : ""); }
  items.forEach(function (item) {
    var right = item.getAttribute("data-right"), fb = item.querySelector(".fb");
    var labels = [].slice.call(item.querySelectorAll("label"));
    var inp = labels[0] && labels[0].querySelector("input"), key = "spike" + ":" + file + ":" + (inp ? inp.name : "q");
    for (var i = labels.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = labels[i]; labels[i] = labels[j]; labels[j] = t; }
    labels.forEach(function (l) { item.insertBefore(l, fb); });
    var badge = document.createElement("span"); badge.className = "qst"; var qt = item.querySelector(".q"); if (qt) qt.appendChild(badge);
    function show() {
      var st = {}; try { st = JSON.parse(store(key + ":st") || "{}") || {}; } catch (e) {}
      item._done = !!store(key + ":done");
      badge.textContent = item._done ? "✓ gelöst" + (st.n ? " im " + st.n + ". Versuch" : "") : (st.n ? "○ ungelöst · " + st.n + (st.n === 1 ? " Versuch" : " Versuche") : "○ ungelöst");
      badge.className = "qst" + (item._done ? " ok" : "");
      updHead();
    }
    if (store(key + ":done")) labels.forEach(function (l) { if (l.getAttribute("data-k") === right) { l.classList.add("right"); var r = l.querySelector("input"); if (r) r.checked = true; } });
    labels.forEach(function (l) {
      var radio = l.querySelector("input"); if (!radio) return;
      radio.addEventListener("change", function () {
        labels.forEach(function (x) { x.classList.remove("right", "wrong"); });
        var ok = l.getAttribute("data-k") === right;
        stUpd(key, function (st) { st.n++; if (!st.t0) st.t0 = Date.now(); if (!ok) st.f++; else st.t1 = Date.now(); });
        if (ok) { store(key + ":done", "1"); l.classList.add("right"); fb.textContent = "Richtig! " + (item.getAttribute("data-why") || ""); }
        else { l.classList.add("wrong"); fb.textContent = "Leider falsch – versuche es noch einmal."; }
        show();
      });
    });
    show();
  });
}
function buildMatch(m) {   // Zuordnungsaufgabe mit Auswahlfeldern
  var btn = m.querySelector(".mcheck"), res = m.querySelector(".mres");
  btn.addEventListener("click", function () {
    var n = 0, r = 0;
    m.querySelectorAll("select[data-right]").forEach(function (s) { n++; var ok = s.value === s.getAttribute("data-right"); s.classList.toggle("ok", ok); s.classList.toggle("no", !ok); if (ok) r++; });
    res.textContent = r + " von " + n + " richtig" + (r === n ? " – super!" : "");
  });
}
window.SPIKE = { simulate: simulate, struktogramm: struktogramm, BDEF: BDEF, World: World, helpers: helpers, newBlock: newBlock, mount: buildExercise, blockText: blockText };
document.addEventListener("DOMContentLoaded", function () {
  if (window.LESSON) return;   // neue Lektionsseiten bauen ihre Aufgaben selbst (lesson.js)
  document.querySelectorAll(".ex[data-ex]").forEach(function (b) { buildExercise(b); });
  document.querySelectorAll(".quiz").forEach(buildQuiz);
  document.querySelectorAll(".match").forEach(buildMatch);
  document.querySelectorAll("[data-widget]").forEach(function (w) { var f = window.WIDGETS && window.WIDGETS[w.getAttribute("data-widget")]; if (f) f(w); });
  document.querySelectorAll("[data-lesson]").forEach(function (card) {
    var f = card.getAttribute("data-lesson"), n = parseInt(card.getAttribute("data-count") || "0", 10), done = 0;
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf((window.RProg ? window.RProg.k("spike:") : "spike:") + f + ":") === 0 && /:done$/.test(k)) done++; } } catch (e) {}
    var c = card.querySelector(".prog"); if (c && n) { c.textContent = done + "/" + n + " gelöst"; if (done >= n) c.classList.add("done"); }
  });
});
})();
