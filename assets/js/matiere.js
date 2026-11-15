/* Le Collé — page d'une matière : ses livres et leurs chapitres */
'use strict';
const M = matiere(params.get('id'));
if (!M) { location.replace('index.html'); throw new Error('matière inconnue'); }
cadre(M.id);
document.title = `${M.titre} — Le Collé`;
const chapitres = l => {
  let partie = null;
  return l.chapitres.map(c => {
    const tete = c.partie && c.partie !== partie ? `<li><span class="partie">${esc(titrePartie(c.partie))}</span></li>` : '';
    partie = c.partie;
    return `${tete}<li><span class="n">${c.n}</span><a href="${urlChapitre(l, c.n)}">${c.titre}</a><span class="tag">${c.fin - c.debut + 1} p.</span></li>`;
  }).join('');
};
$('#contenu').innerHTML = `
  <p class="kicker"><a href="index.html">Matières</a></p>
  <h1>${esc(M.titre)}</h1>
  <p class="intro">${esc(M.description)}</p>
  ${livresDe(M.id).map(l => `<section class="livre" id="${l.id}">
    <h2>${esc(l.titre)}</h2>
    <p>${esc(l.description)}</p>
    <p class="links" style="margin-top:10px"><a href="${urlLecteur(l)}">Lire le livre complet</a>${lienPdf(l.pdf, 'Télécharger le PDF')}<span class="tag">${l.pages} pages</span></p>
    <ul class="chapitres formules">${chapitres(l)}</ul>
  </section>`).join('')}`;
renderMath($('#contenu'));
