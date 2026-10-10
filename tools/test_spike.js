// Prüft alle Programmieraufgaben: Musterlösung muss bestehen, Startprogramm darf nicht bestehen.
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const ctx = { window: {}, document: { addEventListener() {} }, console, Math, JSON };
ctx.window.window = ctx.window; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/spike.js'), 'utf8'), ctx);
const S = ctx.window.SPIKE;
function run(ex, prog) {
  const res = S.simulate(prog, ex), checks = [];
  try { (new Function('H', 'P', 'ok', 'with(H){' + ex.check + '}'))(S.helpers(res), prog, (c, g, b) => checks.push({ ok: !!c, m: c ? g : (b || g) })); }
  catch (e) { checks.push({ ok: false, m: 'EXC ' + e.message }); }
  return { all: checks.length && checks.every(c => c.ok) && !res.err, checks, res };
}
let bad = 0;
for (const f of fs.readdirSync(path.join(root, 'content/lessons')).sort()) {
  const L = JSON.parse(fs.readFileSync(path.join(root, 'content/lessons', f), 'utf8'));
  for (const it of L.deep.filter(x => x.type === 'spike')) {
    const s = run(it.ex, it.ex.solution), st = run(it.ex, it.ex.starter || []);
    const ok = s.all && !st.all;
    if (!ok) bad++;
    console.log((ok ? 'OK  ' : 'FAIL') + ' ' + L.id + ' ' + it.id + ' ' + it.title + ' | Lösung: ' + s.checks.map(c => (c.ok ? '✓' : '✗') + c.m).join('; ') + (s.res.err ? ' ERR ' + s.res.err : '') + ' | t=' + s.res.t.toFixed(1) + ' x=' + s.res.final.x.toFixed(1) + ' y=' + s.res.final.y.toFixed(1) + ' | Start besteht: ' + st.all);
  }
}
process.exit(bad ? 1 : 0);
