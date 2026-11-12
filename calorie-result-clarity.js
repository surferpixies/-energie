/* Keep calorie search evidence useful without exposing the raw research report.
   This only changes presentation; it never sets or recalculates calories. */
(() => {
  const report = document.getElementById('mealAiGroundedReport');
  const sources = document.getElementById('mealAiGroundedSources');
  const note = document.getElementById('mealAiGroundedClarity');
  if (!report || !sources || !note) return;

  const update = () => {
    const raw = (report.textContent || '').trim();
    const incomplete = /TOTAL\s*:\s*(?:NON[\s-]*(?:V[EÉ]RIFI[EÉ]|VERIFIE)|UNKNOWN|UNVERIFIED|INCONNU)/i.test(raw);
    const en = document.documentElement.lang?.toLowerCase().startsWith('en');
    // A component source (e.g. Big Mac alone) does not verify a complete trio.
    sources.hidden = incomplete;
    note.hidden = !incomplete;
    const message = en
      ? 'Complete meal not verified. The estimate is approximate; individual product sources may not cover the full meal.'
      : 'Repas complet non vérifié. L’estimation est approximative; les fiches individuelles ne confirment pas le total.';
    if (note.textContent !== message) note.textContent = message;
  };
  const observer = new MutationObserver(update);
  observer.observe(report, { childList: true, characterData: true, subtree: true });
  observer.observe(sources, { childList: true, characterData: true, subtree: true });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  update();
})();
