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

/* Bloc « hors ligne » : télécharger les livres et les fiches dans l'appareil */
(async () => {
  const etat = await etatHorsLigne();
  if (!etat || !('serviceWorker' in navigator)) return;
  const bloc = document.createElement('section');
  bloc.className = 'hors-ligne';
  $('#contenu').append(bloc);
  const afficher = (e, msg) => {
    const complet = e.n === e.total;
    bloc.innerHTML = `<h2>Hors ligne</h2>
      <p>${complet ? 'Tous les livres et toutes les fiches sont enregistrés sur cet appareil : ils se lisent sans connexion.'
        : `Enregistrer les ${LC.livres.length} livres et leurs fiches sur cet appareil (environ 7 Mo) pour les lire sans connexion.`}
      ${msg ? `<br><span class="hl-msg">${msg}</span>` : ''}</p>
      ${complet ? '' : `<button class="hl-btn" type="button">Rendre disponible hors ligne</button>`}
      <p class="hl-aide">Pour l'installer comme une application : sur iPhone, Safari → Partager → « Sur l'écran d'accueil » ;
      sur Android, Chrome → menu ⋮ → « Installer l'application ».</p>`;
    const b = $('.hl-btn', bloc);
    if (b) b.onclick = lancer;
  };
  const lancer = async () => {
    const b = $('.hl-btn', bloc);
    if (b) b.disabled = true;
    const err = await telechargerHorsLigne((k, t) => { if (b) b.textContent = `Téléchargement… ${k}/${t}`; });
    afficher(await etatHorsLigne(), err ? `${err} fichier(s) n'ont pas pu être téléchargés : réessayez avec une connexion.` : '');
  };
  afficher(etat);
  if (estInstallee() && etat.n < etat.total && navigator.onLine) lancer();
})();
