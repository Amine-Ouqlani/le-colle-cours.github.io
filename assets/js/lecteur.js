/* Le Collé — lecteur PDF (pdf.js) : livre complet ou un chapitre, défilement continu, rendu paresseux */
'use strict';

(async function lecteur() {
  const L = livre(params.get('livre'));
  if (!L) { location.replace('index.html'); return; }
  const C = L.chapitres.find(c => c.n === Number(params.get('n'))) || null;
  const titre = document.createElement('div'); titre.innerHTML = C ? `Ch. ${C.n} — ${C.titre}` : '';
  const nomChap = titre.textContent;
  document.title = `${C ? nomChap + ' — ' : ''}${L.titre} — Le Collé`;
  $('#rd-title').textContent = C ? `${L.titre} · ${nomChap}` : L.titre;
  $('#rd-back').href = C ? urlChapitre(L, C.n) : urlMatiere(L.matiere) + '#' + L.id;
  const fichier = C ? C.pdf : L.pdf;
  $('#rd-dl').href = fichier;
  $('#rd-dl').setAttribute('download', nomPdf(fichier));
  if (C) {
    const prec = L.chapitres.find(c => c.n === C.n - 1), suiv = L.chapitres.find(c => c.n === C.n + 1);
    $('#rd-chap').innerHTML = `${prec ? `<a href="${urlLecteur(L, prec)}" title="Chapitre précédent">← <span class="rd-hide-sm">Ch. ${prec.n}</span></a>` : ''}
      ${suiv ? `<a href="${urlLecteur(L, suiv)}" title="Chapitre suivant"><span class="rd-hide-sm">Ch. ${suiv.n} </span>→</a>` : ''}`;
  }

  // le PDF du livre est chargé une fois ; un chapitre en affiche les pages debut..fin (numérotation du livre)
  if (!window.pdfjsLib) { $('#rd-loading').innerHTML = `Le lecteur n'a pas pu démarrer. <a href="${fichier}">Ouvrir le PDF</a>`; return; }
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/vendor/pdfjs/pdf.worker.min.js';
  let pdf;
  try { pdf = await pdfjsLib.getDocument({ url: L.pdf, disableRange: true, disableStream: true }).promise; }
  catch (e) { $('#rd-loading').innerHTML = `Impossible de charger le document. <a href="${fichier}">Télécharger le PDF</a>`; return; }

  const N = pdf.numPages;
  const debut = C ? C.debut : 1, fin = C ? Math.min(C.fin, N) : N;
  let page = Math.min(fin, Math.max(debut, Number(params.get('page')) || debut));
  $('#rd-total').textContent = fin;
  $('#rd-input').min = debut; $('#rd-input').max = fin;
  $('#rd-loading').hidden = true;

  let sectionsPages = [];
  const courantSection = () => { let c = null; for (const p of sectionsPages) if (p <= page) c = p; return c; };
  const signaler = () => {
    $('#rd-input').value = page;
    $$('#rd-outline button').forEach(b => b.classList.toggle('cur', Number(b.dataset.p) === courantSection()));
  };

  /* sommaire : signets du PDF compris dans les pages affichées */
  const toggleToc = force => { const o = $('#rd-outline'); const v = force ?? !o.classList.contains('open'); o.classList.toggle('open', v); $('#rd-toc').setAttribute('aria-expanded', v); };
  $('#rd-toc').addEventListener('click', () => toggleToc());
  (async () => {
    const out = await pdf.getOutline().catch(() => null);
    const items = [];
    const walk = async (list, lvl) => {
      for (const it of list || []) {
        let p = null;
        try {
          const dest = typeof it.dest === 'string' ? await pdf.getDestination(it.dest) : it.dest;
          if (dest) p = (await pdf.getPageIndex(dest[0])) + 1;
        } catch (e) { /* signet sans destination */ }
        if (p && p >= debut && p <= fin) items.push({ t: it.title, p, lvl });
        await walk(it.items, lvl + 1);
      }
    };
    await walk(out, 0);
    if (!items.length) { $('#rd-toc').hidden = true; return; }
    const lmin = Math.min(...items.map(i => i.lvl));
    sectionsPages = [...new Set(items.map(i => i.p))].sort((a, b) => a - b);
    const nav = $('#rd-outline');
    nav.innerHTML = '<h4>Sommaire</h4>' + items.map(i => `<button class="l${Math.min(i.lvl - lmin, 2)}" data-p="${i.p}">${esc(i.t)}</button>`).join('');
    nav.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; aller(Number(b.dataset.p)); if (innerWidth < 760) toggleToc(false); });
    if (innerWidth > 1000) toggleToc(true);
    signaler();
  })();

  const scroll = $('#rd-scroll'), pagesEl = $('#rd-pages');
  scroll.hidden = false;
  let zoom = 1;
  try { zoom = Number(localStorage.getItem('lc:zoom')) || 1; } catch (e) { /* stockage indisponible */ }
  const p1 = (await pdf.getPage(debut)).getViewport({ scale: 1 });
  const ratio = p1.height / p1.width;
  const conteneurs = [];
  for (let p = debut; p <= fin; p++) {
    const div = document.createElement('div');
    div.className = 'rd-pg'; div.dataset.p = p; div.id = 'p' + p;
    div.setAttribute('aria-label', `Page ${p}`);
    pagesEl.appendChild(div); conteneurs.push(div);
  }
  const largeur = () => Math.min(scroll.clientWidth - 24, 920) * zoom;
  const dims = () => { const w = largeur(); conteneurs.forEach(d => { d.style.width = w + 'px'; d.style.height = (w * ratio) + 'px'; }); };
  const rendrePage = async div => {
    if (div.dataset.ok === String(zoom)) return;
    div.dataset.ok = String(zoom);
    const pg = await pdf.getPage(Number(div.dataset.p));
    const dpr = window.devicePixelRatio || 1;
    const v = pg.getViewport({ scale: largeur() / pg.getViewport({ scale: 1 }).width * dpr });
    const c = document.createElement('canvas');
    c.width = v.width; c.height = v.height;
    await pg.render({ canvasContext: c.getContext('2d'), viewport: v }).promise;
    div.querySelector('canvas')?.remove();
    div.prepend(c);
  };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) rendrePage(e.target); }), { root: scroll, rootMargin: '800px 0px' });
  dims(); conteneurs.forEach(d => io.observe(d));
  const majCourante = () => {
    const top = scroll.scrollTop + scroll.clientHeight * 0.35;
    let cur = debut;
    for (const d of conteneurs) { if (d.offsetTop <= top) cur = Number(d.dataset.p); else break; }
    if (cur !== page) { page = cur; signaler(); }
  };
  scroll.addEventListener('scroll', () => requestAnimationFrame(majCourante), { passive: true });
  const aller = p => { page = Math.min(fin, Math.max(debut, p)); $('#p' + page).scrollIntoView({ block: 'start' }); scroll.scrollTop -= 8; signaler(); };
  const rezoom = z => {
    const rel = page; zoom = Math.min(2.5, Math.max(0.5, z));
    try { localStorage.setItem('lc:zoom', zoom); } catch (e) { /* stockage indisponible */ }
    dims(); conteneurs.forEach(d => { d.dataset.ok = ''; io.unobserve(d); io.observe(d); }); aller(rel);
  };
  $('#rd-zin').addEventListener('click', () => rezoom(zoom * 1.2));
  $('#rd-zout').addEventListener('click', () => rezoom(zoom / 1.2));
  let tRes; new ResizeObserver(() => { clearTimeout(tRes); tRes = setTimeout(() => rezoom(zoom), 200); }).observe(scroll);
  requestAnimationFrame(() => aller(page));

  $('#rd-prev').addEventListener('click', () => aller(page - 1));
  $('#rd-next').addEventListener('click', () => aller(page + 1));
  $('#rd-input').addEventListener('change', e => aller(Number(e.target.value) || debut));
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); aller(page + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); aller(page - 1); }
    if (e.key === 'Home') aller(debut);
    if (e.key === 'End') aller(fin);
  });
})();
