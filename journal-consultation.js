/* Ordre des événements du journal. Ne modifie jamais les données enregistrées. */
(function (root) {
  'use strict';
  function eventTime(value, date) {
    if (typeof value !== 'string' || !value.trim()) return null;
    const clock = value.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
    if (clock && (Number(clock[1]) > 23 || Number(clock[2]) > 59)) return null;
    const parsed = new Date(clock ? `${date}T${value}` : value);
    return Number.isFinite(parsed.getTime()) ? parsed.getTime() : null;
  }
  function events(day, date, scoresFor) {
    const items = [];
    for (const meal of day.meals || []) {
      const at = eventTime(meal.time, date);
      const beforeScores = scoresFor(meal, 'before');
      // Le repas reste un seul bloc logique même si les ressentis ont été saisis plus tard.
      const before = Object.keys(beforeScores).length
        ? {kind:'before', meal, scores:beforeScores, at:eventTime(meal.feelingsBeforeQuality?.recordedAt || meal.feeling?.beforeQuality?.recordedAt, date), nested:true}
        : null;
      const after = meal.feeling
        ? {kind:'after', meal, scores:scoresFor(meal, 'after'), at:eventTime(meal.feeling.recordedAt, date), nested:true}
        : null;
      items.push({kind:'meal', meal, at, sortAt:at, rank:1, before, after});
    }
    for (const activity of day.activities || []) {
      const at = eventTime(activity.at || activity.recorded_at, date);
      items.push({kind:'activity', activity, at, sortAt:at, rank:1});
    }
    for (const observation of day.observations || []) {
      const at = eventTime(observation.time, date);
      items.push({kind:'observation', observation, at, sortAt:at, rank:1});
    }
    for (const beverage of day.beverages || []) {
      const at = eventTime(beverage.time, date);
      items.push({kind:'beverage', beverage, at, sortAt:at, rank:1});
    }
    return items.sort((a,b) => (a.sortAt ?? Infinity) - (b.sortAt ?? Infinity) || a.rank - b.rank);
  }
  const api = Object.freeze({eventTime, events});
  root.ENERGIE_CONSULTATION = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
