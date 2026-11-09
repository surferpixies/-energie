/* Énergie 3.56.401 — affichage condensé exclusivement pour Ma journée. */
(() => {
  'use strict';
  function moveEditLinks() {
    document.querySelectorAll('.journal-consultation .consultation-event').forEach(card => {
      if (card.dataset.journeyActionMoved === '1') return;
      const header = card.matches('.consultation-event--meal')
        ? card.querySelector('.consultation-meal-header')
        : card.querySelector(':scope > .consultation-event-heading');
      const action = card.matches('.consultation-event--meal')
        ? card.querySelector(':scope > .consultation-meal-footer > .consultation-entry-open')
        : card.querySelector(':scope > .consultation-entry-open');
      if (!header || !action) return;
      // Déplace le bouton réel afin de conserver ses gestionnaires d'événements.
      const right = document.createElement('span');
      right.className = 'journey-header-actions';
      const clock = header.querySelector(':scope > time, :scope > strong');
      if (clock) right.appendChild(clock);
      right.appendChild(action);
      header.appendChild(right);
      card.dataset.journeyActionMoved = '1';
    });
  }
  function enhance() {
    moveEditLinks();
    document.querySelectorAll('.journal-consultation .consultation-event--meal').forEach(card => {
      if (card.dataset.journeyEnhanced === '1') return;
      const title = card.querySelector('.consultation-meal-header h2');
      if (/collation/i.test(title?.textContent || '')) card.classList.add('consultation-event--snack');
      const paragraph = card.querySelector('.consultation-meal-content > p');
      if (paragraph && paragraph.textContent.trim().length > 150) {
        paragraph.classList.add('journey-meal-description');
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'journey-meal-expand';
        toggle.textContent = window.ENERGIE_I18N?.t?.('Afficher le repas complet') || 'Afficher le repas complet';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.addEventListener('click', () => {
          const expanded = card.classList.toggle('journey-meal-expanded');
          toggle.textContent = window.ENERGIE_I18N?.t?.(expanded ? 'Réduire le repas' : 'Afficher le repas complet') || (expanded ? 'Réduire le repas' : 'Afficher le repas complet');
          toggle.setAttribute('aria-expanded', String(expanded));
        });
        paragraph.insertAdjacentElement('afterend', toggle);
      }
      card.dataset.journeyEnhanced = '1';
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once:true });
  } else start();
  function start() {
    enhance();
    const root = document.querySelector('main') || document.body;
    const observer = new MutationObserver(changes => {
      if (changes.some(change => [...change.addedNodes].some(node => node.nodeType === 1 && (node.matches?.('.journal-consultation, .consultation-event') || node.querySelector?.('.consultation-event'))))) enhance();
    });
    observer.observe(root, {childList:true, subtree:true});
  }
})();
