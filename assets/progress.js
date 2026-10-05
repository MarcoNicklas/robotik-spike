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
  function makeCode() {
    var payload = JSON.stringify({ v: 1, c: COURSE, n: USER.name, k: USER.klasse || "", p: USER.fp, t: Date.now(), d: doneMap() });
    var body = b64u(payload);
    return "ROBO1-" + body + "." + hash(SALT + body, 7);
  }

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
      '<div class="rp-err" aria-live="polite"></div><div class="rp-row"><button class="rp-btn" type="submit">Anmelden</button></div>' +
      '<p style="margin-top:12px;font-size:12px">Name und Fortschritt bleiben nur in diesem Browser. Erst wenn du „Fortschritt abgeben“ wählst, entsteht ein Code für deine Lehrkraft.</p>';
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
      if (!P[id]) P[id] = { name: name, klasse: kl, ph: ph, fp: hash(nkey(name, kl) + "|" + pw, 5), since: Date.now() };
      ls("rprog:profiles", JSON.stringify(P));
      if (ls("rprog:profiles") === null) { err.textContent = "Dieser Browser speichert nichts (privates Fenster?). Bitte normales Fenster verwenden."; return; }
      ss("rprog:active", id);
      ov.remove(); location.reload();
    });
  }

  function giveDialog() {
    var code = makeCode(), d = doneMap(), n = 0; Object.keys(d).forEach(function (L) { n += d[L].length; });
    var f = el("div");
    var fname = "Fortschritt_" + COURSE + "_" + USER.name.replace(/[^A-Za-z0-9ÄÖÜäöüß]+/g, "_") + ".txt";
    f.innerHTML = "<h2>Fortschritt abgeben</h2><div class='rp-sum'><b></b><br>" + n + " Aufgabe(n) gelöst · Stand " + new Date().toLocaleString("de-DE") + "</div>" +
      "<p>Kopiere den Code oder speichere ihn als Datei und gib ihn so ab, wie es deine Lehrkraft sagt (z. B. als Abgabe in mebis).</p>" +
      '<textarea readonly aria-label="Fortschrittscode"></textarea><div class="rp-err" aria-live="polite" style="color:var(--green,#3b7d3a)"></div>' +
      '<div class="rp-row"><button class="rp-btn" data-a="copy">📋 Code kopieren</button><button class="rp-btn" data-a="file">💾 Als Datei speichern</button><button class="rp-btn sec" data-a="close">Schließen</button></div>';
    f.querySelector(".rp-sum b").textContent = USER.name + (USER.klasse ? " · " + USER.klasse : "") + " · " + TITLE;
    var ta = f.querySelector("textarea"); ta.value = code;
    var msg = f.querySelector(".rp-err");
    var ov = overlay(f, true);
    f.addEventListener("click", function (e) {
      var a = e.target.getAttribute && e.target.getAttribute("data-a"); if (!a) return;
      if (a === "close") ov.remove();
      if (a === "copy") {
        ta.select();
        var ok = false; try { ok = document.execCommand("copy"); } catch (x) {}
        if (navigator.clipboard) navigator.clipboard.writeText(code).then(function () { msg.textContent = "Kopiert ✓"; }, function () { msg.textContent = ok ? "Kopiert ✓" : "Bitte markieren und mit Strg+C kopieren."; });
        else msg.textContent = ok ? "Kopiert ✓" : "Bitte markieren und mit Strg+C kopieren.";
      }
      if (a === "file") {
        var blob = new Blob([code + "\n"], { type: "text/plain" }), url = URL.createObjectURL(blob), ln = el("a", { href: url, download: fname });
        document.body.appendChild(ln); ln.click(); ln.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
        msg.textContent = "Datei „" + fname + "“ gespeichert ✓";
      }
    });
  }

  function header() {
    var nav = document.querySelector(".top .nav"); if (!nav) return;
    var chip = el("span", { "class": "rp-chip" }); chip.appendChild(document.createTextNode("👤 " + USER.name));
    var out = el("button", { type: "button", title: "Abmelden" }, "abmelden");
    out.addEventListener("click", function () { ss("rprog:active", null); location.reload(); });
    chip.appendChild(out);
    var give = el("button", { type: "button", "class": "rp-give" }, "📤 Fortschritt abgeben");
    give.addEventListener("click", giveDialog);
    nav.insertBefore(give, nav.firstChild); nav.insertBefore(chip, nav.firstChild);
  }

  function start() {
    addCss();
    if (/lehrer\.html$/.test(location.pathname)) return;
    if (!USER) loginDialog(); else header();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
