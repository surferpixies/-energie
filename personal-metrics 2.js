/* Énergie 3.56.0 — dated measurements and descriptive charts. */
(function (root) {
  "use strict";
  const DAY = 86400000, LB_TO_KG = 0.45359237;
  const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function number(value) {
    if (typeof value !== "number" && typeof value !== "string") return null;
    if (typeof value === "string" && !value.trim()) return null;
    const n = Number(typeof value === "string" ? value.trim().replace(",", ".") : value);
    return Number.isFinite(n) ? n : null;
  }
  function dateTime(key) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key || "")) return null;
    const n = Date.parse(`${key}T12:00:00Z`);
    return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === key ? n : null;
  }
  function weightKg(value, unit = "kg") {
    const n = number(value), kg = n == null ? null : n * (unit === "lb" ? LB_TO_KG : 1);
    return kg != null && kg > 0 && kg <= 1000 ? Math.round(kg * 10000) / 10000 : null;
  }
  function displayWeight(kg, unit = "kg") {
    const n = number(kg);
    return n == null ? null : Math.round(n / (unit === "lb" ? LB_TO_KG : 1) * 10) / 10;
  }
  function weightRecord(record) {
    if (!record || !Number.isFinite(Date.parse(record.updatedAt))) return null;
    if (record.kg === null) return { kg: null, updatedAt: record.updatedAt };
    const kg = weightKg(record.kg);
    return kg == null ? null : { kg, updatedAt: record.updatedAt };
  }
  function mergeWeight(local, remote) {
    local = weightRecord(local); remote = weightRecord(remote);
    return !local || (remote && Date.parse(remote.updatedAt) > Date.parse(local.updatedAt)) ? remote : local;
  }
  function profileRecord(key, record) {
    if (!record || !Number.isFinite(Date.parse(record.updatedAt))) return null;
    if (key === "physiology") {
      if (!["none", "menstrual", "pregnancy", "menopause"].includes(record.value?.context)) return null;
      return { updatedAt: record.updatedAt, value: {
        context: record.value.context,
        menstrualLastStart: record.value.context === "menstrual" && dateTime(record.value.menstrualLastStart) != null ? record.value.menstrualLastStart : "",
        pregnancyDueDate: record.value.context === "pregnancy" && dateTime(record.value.pregnancyDueDate) != null ? record.value.pregnancyDueDate : "",
      }};
    }
    if (!["unspecified", "provided", "declined"].includes(record.mode)) return null;
    const out = {mode: record.mode, value: null, updatedAt: record.updatedAt};
    if (key === "weight") out.unit = record.unit === "lb" ? "lb" : "kg";
    else if (record.mode === "provided") {
      if (key === "age") {
        const age = number(record.value);
        if (age != null && Number.isInteger(age) && age >= 0 && age <= 130) out.value = age;
      } else if (key === "sex" && ["female", "male", "intersex", "other"].includes(record.value)) out.value = record.value;
    }
    return out;
  }
  function mergeProfile(local = {}, remote = {}) {
    const out = {};
    for (const key of ["age", "sex", "weight", "physiology"]) {
      const a = profileRecord(key, local?.[key]), b = profileRecord(key, remote?.[key]);
      const latest = !a || (b && Date.parse(b.updatedAt) > Date.parse(a.updatedAt)) ? b : a;
      if (latest) out[key] = latest;
    }
    return out;
  }
  function calorieSummary(meals = [], estimate = () => null) {
    let total = 0, known = 0;
    for (const meal of meals) {
      let kcal = number(meal.nutrition?.calories);
      if (kcal == null || kcal < 0) {
        try { kcal = number(estimate(meal.description || "")?.calories); }
        catch (_) { kcal = null; }
      }
      if (kcal != null && kcal >= 0) { total += kcal; known++; }
    }
    return { total: known ? Math.round(total) : null, known, count: meals.length, partial: known > 0 && known < meals.length };
  }
  function series(days, end, unit = "kg", estimate = () => null) {
    const endTime = dateTime(end);
    if (endTime == null) return { start: "", end, weights: [], calories: [] };
    const start = new Date(endTime - 29 * DAY).toISOString().slice(0, 10), weights = [], calories = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(endTime - (29 - i) * DAY).toISOString().slice(0, 10), day = days?.[date];
      const w = weightRecord(day?.weightMeasurement);
      if (w?.kg != null) weights.push({ date, value: displayWeight(w.kg, unit) });
      const summary = calorieSummary(Array.isArray(day?.meals) ? day.meals : [], estimate);
      calories.push({ date, value: summary.total, partial: summary.partial, known: summary.known, count: summary.count });
    }
    return { start, end, weights, calories };
  }
  const format = (n) => n.toLocaleString("fr-CA", {maximumFractionDigits: 1});
  const shortDate = (date) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;
  function chart(points, { start, end, kind, unit, id }) {
    const known = points.filter((p) => number(p.value) != null && dateTime(p.date) != null);
    if (!known.length) return '<p class="metrics-empty">Aucune donnée sur cette période.</p>';
    const values = known.map((p) => p.value), isWeight = kind === "weight";
    let min = isWeight ? Math.min(...values) : 0, max = Math.max(...values);
    const pad = isWeight ? Math.max((max - min) * 0.2, unit === "lb" ? 1 : 0.5) : Math.max(max * 0.1, 1);
    min = Math.max(0, min - (isWeight ? pad : 0)); max += pad;
    const left = 56, top = 12, width = 272, height = 104;
    const span = Math.max(DAY, dateTime(end) - dateTime(start));
    const x = (date) => left + (dateTime(date) - dateTime(start)) / span * width;
    const y = (value) => top + height - (value - min) / (max - min) * height;
    const axes = [min, (min + max) / 2, max].map((v) => `<line x1="${left}" x2="${left + width}" y1="${y(v)}" y2="${y(v)}" class="metrics-gridline"/><text x="${left - 7}" y="${y(v) + 4}" text-anchor="end">${escape(format(v))}</text>`).join("");
    const marks = isWeight
      ? `${known.length > 1 ? `<polyline class="metrics-line" points="${known.map((p) => `${x(p.date)},${y(p.value)}`).join(" ")}"/>` : ""}${known.map((p) => `<circle class="metrics-dot" cx="${x(p.date)}" cy="${y(p.value)}" r="3.5"><title>${escape(p.date)} : ${escape(format(p.value))} ${escape(unit)}</title></circle>`).join("")}`
      : known.map((p) => `<rect class="metrics-bar${p.partial ? " is-partial" : ""}" x="${x(p.date) - 3}" y="${p.value === 0 ? top + height - 2 : y(p.value)}" width="6" height="${Math.max(2, top + height - y(p.value))}" rx="2"><title>${escape(p.date)} : ${escape(format(p.value))} kcal${p.partial ? " — estimation partielle" : ""}</title></rect>`).join("");
    const title = isWeight ? "Évolution des mesures de poids" : "Calories estimées des repas saisis par jour";
    return `<svg class="metrics-chart" viewBox="0 0 344 146" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${title}</title><desc id="${id}-desc">Du ${start} au ${end}. ${known.length} journée(s) avec données. Détail des valeurs dans le tableau ci-dessous.</desc>${axes}${marks}<text x="${left}" y="140">${shortDate(start)}</text><text x="${left + width / 2}" y="140" text-anchor="middle">${shortDate(new Date((dateTime(start) + dateTime(end)) / 2).toISOString().slice(0, 10))}</text><text x="${left + width}" y="140" text-anchor="end">${shortDate(end)}</text></svg><details class="metrics-values"><summary>Voir les valeurs</summary><div class="metrics-table-scroll"><table><caption>${title} (${escape(unit)})</caption><thead><tr><th scope="col">Date</th><th scope="col">Valeur</th>${isWeight ? "" : '<th scope="col">Repas estimés</th>'}</tr></thead><tbody>${known.map((p) => `<tr><th scope="row">${escape(p.date)}</th><td>${escape(format(p.value))}</td>${isWeight ? "" : `<td>${p.known}/${p.count}${p.partial ? " · partiel" : ""}</td>`}</tr>`).join("")}</tbody></table></div></details>`;
  }
  const api = { number, dateTime, weightKg, displayWeight, weightRecord, mergeWeight, mergeProfile, calorieSummary, series, chart };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.EnergieMetrics = api;
})(typeof window !== "undefined" ? window : globalThis);
