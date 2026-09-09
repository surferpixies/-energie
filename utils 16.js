(() => {
  "use strict";
  const normalize = value => String(value ?? "")
    .toLocaleLowerCase("fr-CA")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ").replace(/&/g, " and ")
    .replace(/[^a-z0-9%+\s-]/g, " ").replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ").trim();
  const unique = values => [...new Set((values || []).filter(Boolean))];
  const words = value => normalize(value).split(" ").filter(Boolean);
  const containsTerm = (text, term) => (` ${normalize(text)} `).includes(` ${normalize(term)} `);
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number(value) || 0));
  window.EnergieBrainModules = window.EnergieBrainModules || {};
  window.EnergieBrainModules.utils = Object.freeze({ normalize, unique, words, containsTerm, clamp });
})();
