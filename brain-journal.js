(function (root) {
  'use strict';
  const DAY = 86400000, TYPES = ['Déjeuner', 'Dîner', 'Souper'];
  const key = date => date.toISOString().slice(0, 10);
  const dateFor = value => new Date(`${value}T12:00:00Z`);
  const hasScores = value => value && typeof value === 'object' && Object.values(value).some(score => Number.isFinite(Number(score)) && score != null && score !== '');
  const hasMeal = meal => !!(String(meal?.description || '').trim() || meal?.photo || meal?.photos?.length || meal?.nutrition);
  const documented = day => (day?.meals || []).some(hasMeal) || day?.sleepHours != null || Number(day?.water) > 0 || day?.steps != null || day?.activities?.length || day?.observations?.length;
  const ratio = (count, total) => total ? Math.min(1, count / total) : 0;
  function analyze(database, anchorKey) {
    const anchor = dateFor(anchorKey), monday = new Date(anchor);
    monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
    const start = new Date(monday); start.setUTCDate(start.getUTCDate() - 21);
    const recorded = Object.entries(database.days || {}).filter(([date, day]) => date <= anchorKey && documented(day)).sort(([a], [b]) => a.localeCompare(b));
    const firstRecord = recorded[0]?.[0];
    const firstKey = firstRecord && firstRecord > key(start) ? firstRecord : key(start);
    const rows = [];
    if (firstRecord) for (let day = dateFor(firstKey); day <= anchor; day = new Date(day.getTime() + DAY)) {
      const date = key(day), entry = database.days?.[date] || {}, meals = (entry.meals || []).filter(hasMeal);
      rows.push({date, meals, entry});
    }
    function coverage(items) {
      const meals = items.flatMap(row => row.meals), days = items.length;
      const types = TYPES.map(type => ({type, count: items.filter(row => row.meals.some(meal => meal.type === type)).length, total: days}));
      const before = meals.filter(meal => hasScores(meal.feelingsBefore)).length;
      const after = meals.filter(meal => hasScores(meal.feeling?.scores)).length;
      const sleep = items.filter(row => row.entry.sleepHours != null).length;
      const water = items.filter(row => Number(row.entry.water) > 0).length;
      const steps = items.filter(row => row.entry.steps != null && Number.isFinite(Number(row.entry.steps))).length;
      const activities = items.filter(row => row.entry.activities?.length).length;
      const mealSlots = types.reduce((sum, type) => sum + type.count, 0);
      const core = ratio(mealSlots, days * 3) * 40 + ratio(before, meals.length) * 20 + ratio(after, meals.length) * 20;
      const secondary = [ratio(water, days), ratio(sleep, days)];
      if (database.settings?.stepsTracking === true) secondary.push(ratio(steps, days));
      const score = days ? Math.round(core + secondary.reduce((a, b) => a + b, 0) / secondary.length * 20) : 0;
      return {days, mealTotal: meals.length, types, before, after, sleep, water, steps, activities, score,
        documentedDays: items.filter(row => documented(row.entry)).length};
    }
    const weeks = [];
    for (let index = 0; index < 4; index++) {
      const from = new Date(start.getTime() + index * 7 * DAY), to = new Date(from.getTime() + 6 * DAY);
      const items = rows.filter(row => row.date >= key(from) && row.date <= key(to));
      weeks.push({from: key(from), to: key(to), partial: index === 3 || (items.length > 0 && items.length < 7), ...coverage(items)});
    }
    const total = coverage(rows);
    const candidates = [
      {id: 'meals', coverage: ratio(total.types.reduce((sum, type) => sum + type.count, 0), total.days * 3)},
      {id: 'before', coverage: ratio(total.before, total.mealTotal)},
      {id: 'after', coverage: ratio(total.after, total.mealTotal)},
    ].sort((a, b) => a.coverage - b.coverage);
    return {...total, weeks, anchor: anchorKey, first: rows[0]?.date || null, stepsEnabled: database.settings?.stepsTracking === true,
      suggestion: !total.mealTotal ? 'start' : candidates[0].coverage >= .85 ? 'continue' : candidates[0].id};
  }
  root.EnergieJournalLearning = {analyze};
})(typeof window !== 'undefined' ? window : globalThis);
