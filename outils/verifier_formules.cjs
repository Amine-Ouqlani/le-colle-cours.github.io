// Vérifie que chaque formule des données du site est rendue par KaTeX sans erreur.
// Usage : node outils/verifier_formules.cjs <dossier du site>
const fs = require('fs'), path = require('path'), vm = require('vm');
const site = process.argv[2] || '.';
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(site, 'assets/js/macros.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(site, 'data/livres.js'), 'utf8'), ctx);
const katex = require(path.resolve(site, 'assets/vendor/katex/katex.min.js'));
const macros = ctx.window.LC_MACROS, LC = ctx.window.LC;
const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
let n = 0, err = 0;
for (const l of LC.livres) for (const c of l.chapitres) {
  for (const champ of ['titre', 'intro', 'objectifs', 'prerequis', 'essentiel']) {
    const s = c[champ] + ' ' + (champ === 'titre' ? c.sections.map(x => x.titre).join(' ') + c.methodes.map(m => m.titre).join(' ') : '');
    const re = /\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\$([^$]*?)\$/g; let m;
    while ((m = re.exec(s))) {
      const f = unesc(m[1] ?? m[2] ?? m[3]); n++;
      try { katex.renderToString(f, { throwOnError: true, displayMode: m[3] === undefined, macros: { ...macros } }); }
      catch (e) { err++; console.log(`${l.id} ch.${c.n} [${champ}] ${e.message.slice(0, 120)}\n   ${f.slice(0, 160)}`); }
    }
  }
}
console.log(`${n} formules, ${err} erreur(s)`);
process.exit(err ? 1 : 0);
