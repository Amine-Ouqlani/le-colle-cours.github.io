/* Le Collé — accueil : la liste des matières */
'use strict';
cadre(null);
const nbChap = m => livresDe(m.id).reduce((s, l) => s + l.chapitres.length, 0);
$('#contenu').innerHTML = `
  <h1>Les livres de cours</h1>
  <p class="intro">${LC.livres.length} livres de cours approfondis : démonstrations détaillées, intuitions, méthodes et
  schémas. Chaque chapitre se lit en ligne ou se télécharge en PDF.</p>
  <ul class="matieres">${LC.matieres.map(m => `<li><a class="carte" href="${urlMatiere(m.id)}">
    <h2>${esc(m.titre)}</h2><p>${esc(m.description)}</p>
    <span class="tag">${livresDe(m.id).map(l => esc(l.titre)).join(' · ')} — ${nbChap(m)} chapitres</span></a></li>`).join('')}
  </ul>`;
