/* Le Collé — page d'un chapitre : objectifs, plan, méthodes, l'essentiel, lecture et téléchargement */
'use strict';
const L = livre(params.get('livre'));
const C = L && L.chapitres.find(c => c.n === Number(params.get('n')));
if (!C) { location.replace('index.html'); throw new Error('chapitre inconnu'); }
const M = matiere(L.matiere);
cadre(M.id);
const titreTexte = document.createElement('div'); titreTexte.innerHTML = C.titre;
document.title = `${titreTexte.textContent} — ${L.titre} — Le Collé`;
const prec = L.chapitres.find(c => c.n === C.n - 1), suiv = L.chapitres.find(c => c.n === C.n + 1);
const ligne = (num, titre, page) => `<li><span><span class="num">${num}</span><a href="${urlLecteur(L, C, page)}">${titre}</a></span><span class="tag">p. ${page}</span></li>`;
$('#contenu').innerHTML = `
  <p class="kicker"><a href="${urlMatiere(M.id)}">${esc(M.titre)}</a> · <a href="${urlMatiere(M.id)}#${L.id}">${esc(L.titre)}</a>${C.partie ? ' · ' + esc(titrePartie(C.partie)) : ''}</p>
  <h1 class="formules">Chapitre ${C.n} — ${C.titre}</h1>
  ${C.intro ? `<p class="intro formules">${C.intro}</p>` : ''}
  <div class="actions">
    <a class="btn plein" href="${urlLecteur(L, C)}">Lire le chapitre</a>
    ${lienPdf(C.pdf, 'Télécharger le chapitre (PDF)', 'btn')}
  </div>
  <p class="links" style="margin-top:10px"><span class="tag">${C.fin - C.debut + 1} pages · pages ${C.debut} à ${C.fin} du livre</span>${lienPdf(L.pdf, 'Livre complet (PDF)')}</p>
  ${C.objectifs || C.prerequis ? `<div class="cadre formules">
    ${C.objectifs ? `<div class="bloc"><h3>Objectifs</h3>${C.objectifs}</div>` : ''}
    ${C.prerequis ? `<div class="bloc"><h3>Prérequis</h3><p>${C.prerequis}</p></div>` : ''}
  </div>` : ''}
  ${C.sections.length ? `<h2>Plan du chapitre</h2><ul class="plan formules">${C.sections.map((s, i) => ligne(`${C.n}.${i + 1}`, s.titre, s.page)).join('')}</ul>` : ''}
  ${C.methodes.length ? `<h2>Méthodes</h2><ul class="plan formules">${C.methodes.map(m => ligne(m.num, m.titre, m.page)).join('')}</ul>` : ''}
  ${C.essentiel ? `<section class="essentiel formules"><h2>L'essentiel du chapitre</h2>${C.essentiel}</section>` : ''}
  <nav class="pager formules" aria-label="Chapitres">
    ${prec ? `<a href="${urlChapitre(L, prec.n)}"><span class="tag">← Chapitre ${prec.n}</span>${prec.titre}</a>` : ''}
    ${suiv ? `<a class="next" href="${urlChapitre(L, suiv.n)}"><span class="tag">Chapitre ${suiv.n} →</span>${suiv.titre}</a>` : ''}
  </nav>`;
renderMath($('#contenu'));
