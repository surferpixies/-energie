/* Énergie 3.56.401 — affichage condensé exclusivement pour Ma journée. */
(() => {
  'use strict';
  function enhance() {
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
        toggle.textContent = 'Afficher le repas complet';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.addEventListener('click', () => {
          const expanded = card.classList.toggle('journey-meal-expanded');
          toggle.textContent = expanded ? 'Réduire le repas' : 'Afficher le repas complet';
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
      if (changes.some(change => [...change.addedNodes].some(node => node.nodeType === 1 && (node.matches?.('.consultation-event--meal') || node.querySelector?.('.consultation-event--meal'))))) enhance();
    });
    observer.observe(root, {childList:true, subtree:true});
  }
})();
