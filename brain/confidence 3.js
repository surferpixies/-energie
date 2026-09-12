(() => {
  "use strict";
  function describe(value, locale="fr-CA") {
    const score = Math.max(0, Math.min(1, Number(value)||0));
    const labels = locale === "en"
      ? [[.9,"Very high"],[.75,"High"],[.6,"Moderate"],[.4,"Low"],[0,"Very low"]]
      : [[.9,"Très élevée"],[.75,"Élevée"],[.6,"Modérée"],[.4,"Faible"],[0,"Très faible"]];
    const label = labels.find(([min]) => score >= min)?.[1] || labels.at(-1)[1];
    return { score, percent:Math.round(score*100), label, level:score>=.75?"high":score>=.5?"medium":"low" };
  }
  window.EnergieBrainModules = window.EnergieBrainModules || {};
  window.EnergieBrainModules.confidence = Object.freeze({ describe });
})();
