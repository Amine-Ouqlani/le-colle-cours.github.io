"""Ouvre chaque page du site dans Chrome (desktop et mobile), relève erreurs JS, liens morts, débordements et formules KaTeX en erreur."""
import json, re, sys
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/'
s = open('/home/claude/site/data/livres.js').read(); D = json.loads(s[s.index('{'):s.rindex('}') + 1])
pages = ['index.html', '404.html'] + [f"matiere.html?id={m['id']}" for m in D['matieres']]
pages += [f"chapitre.html?livre={l['id']}&n={c['n']}" for l in D['livres'] for c in l['chapitres']]
probl, liens = [], set()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for vp in [{'width': 1280, 'height': 900}, {'width': 375, 'height': 740}]:
        ctx = b.new_context(viewport=vp); ctx.route(re.compile(r'fonts\.(googleapis|gstatic)'), lambda r: r.abort()); pg = ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'net::ERR_FAILED' not in m.text else None)
        for u in pages:
            errs.clear()
            pg.goto(BASE + u, wait_until='networkidle')
            if errs: probl.append((vp['width'], u, 'JS', errs[:3]))
            r = pg.evaluate('''() => ({
              katexErr: document.querySelectorAll('.katex-error').length,
              brut: (document.querySelector('main')?.innerText.match(/\\\\[a-zA-Z]+|\\$[^$\\s]/g) || []).slice(0,5),
              deborde: document.documentElement.scrollWidth > innerWidth + 1,
              liens: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'))
            })''')
            if r['katexErr']: probl.append((vp['width'], u, 'katex-error', r['katexErr']))
            if r['brut']: probl.append((vp['width'], u, 'LaTeX brut', r['brut']))
            if r['deborde']: probl.append((vp['width'], u, 'débordement horizontal', ''))
            liens.update(x for x in r['liens'] if not x.startswith(('http', '#', 'mailto')))
        ctx.close()
    # lecteur : un chapitre par livre et un livre complet
    ctx = b.new_context(viewport={'width': 1280, 'height': 900}); ctx.route(re.compile(r'fonts\.(googleapis|gstatic)'), lambda r: r.abort()); pg = ctx.new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    for l in D['livres']:
        for u in [f"lecteur.html?livre={l['id']}&n={l['chapitres'][-1]['n']}", f"lecteur.html?livre={l['id']}"]:
            errs.clear(); pg.goto(BASE + u, wait_until='networkidle'); pg.wait_for_timeout(1500)
            n = pg.evaluate("document.querySelectorAll('.rd-pg canvas').length")
            toc = pg.evaluate("document.querySelectorAll('#rd-outline button').length")
            if errs or n == 0: probl.append(('lecteur', u, errs[:2], f'{n} pages rendues'))
            liens.update(pg.evaluate("[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))"))
    b.close()
import urllib.request
for x in sorted(liens):
    if x.startswith('http'): continue
    try:
        with urllib.request.urlopen(BASE + x) as r: code = r.status
    except Exception as e: code = e
    if code != 200: probl.append(('lien', x, code, ''))
print(len(pages), 'pages,', len(liens), 'liens vérifiés')
for x in probl: print(x)
print('OK' if not probl else f'{len(probl)} problème(s)')
