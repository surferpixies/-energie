(function (root) {
  "use strict";
  const dateKey = value => {
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d.toLocaleDateString("en-CA") : null;
  };
  function merge(snapshot, {db, today, ensureDay, normalizeActivity, Metrics, sleepingHours}) {
    const changed = new Set();
    const recent = new Date(`${today}T12:00:00`);
    recent.setDate(recent.getDate() - 7);
    const cutoff = dateKey(recent);
    const allowed = key => /^\d{4}-\d{2}-\d{2}$/.test(key || "") && key <= today && dateKey(`${key}T12:00:00`) === key;
    for (const row of snapshot.days || []) {
      const key = row.date, steps = Number(row.steps);
      if (!allowed(key) || !Number.isFinite(steps) || steps < 0) continue;
      const old = db.days[key];
      if (old?.stepsSource === "manual" || old?.stepsSource === "healthkit") continue;
      if (old?.steps > 0 && !old.stepsSource && key < cutoff) continue;
      if (!old && steps === 0) continue;
      const day = ensureDay(db, key);
      if (day.steps === Math.round(steps) && day.stepsSource === "healthconnect") continue;
      day.steps = Math.round(steps);
      day.stepsSource = "healthconnect";
      if (!(Number(day.stepsGoal) > 0)) day.stepsGoal = Number(db.settings.stepsGoal) || 8000;
      changed.add(key);
    }
    const sleepDays = new Set((snapshot.samples || []).map(row => dateKey(row.endDate)).filter(allowed));
    for (const key of sleepDays) {
      const old = db.days[key];
      if (old?.sleepHours > 0 && old.sleepSource !== "healthconnect") continue;
      const hours = sleepingHours(snapshot.samples, key);
      if (!(hours > 0)) continue;
      const day = ensureDay(db, key);
      if (day.sleepHours === hours && day.sleepSource === "healthconnect") continue;
      day.sleepHours = hours;
      day.sleepSource = "healthconnect";
      changed.add(key);
    }
    for (const row of snapshot.workouts || []) {
      const key = dateKey(row.startDate), minutes = Number(row.durationMinutes);
      if (!allowed(key) || !row.uuid || !Number.isFinite(minutes) || minutes <= 0) continue;
      const id = `healthconnect:${row.sourceApp || "unknown"}:${row.uuid}`;
      const day = ensureDay(db, key);
      if (day.activities.some(a => a.id === id)) continue;
      // Pas de calories mesurées : les estimations restent identifiées comme telles.
      const type = row.energieType && row.energieType !== "Autre" ? row.energieType : `Autre — ${row.activityName || "Health Connect"}`;
      day.activities.push(normalizeActivity({id, type, minutes, intensity: "moderate", actualCalories: null,
        at: row.startDate, source: "healthconnect", sourceApp: row.sourceApp || "",
        originalType: row.originalType || "", originalTitle: row.activityName || ""}));
      changed.add(key);
    }
    for (const row of snapshot.measurements || []) {
      const key = dateKey(row.date), kg = Number(row.kg);
      if (!allowed(key) || !(kg > 0) || !Number.isFinite(kg)) continue;
      const day = ensureDay(db, key), previous = Metrics.weightRecord(day.weightMeasurement);
      const next = Metrics.mergeWeight(day.weightMeasurement, {kg, updatedAt: row.date});
      if (next && (!previous || previous.kg !== next.kg || previous.updatedAt !== next.updatedAt)) {
        day.weightMeasurement = next;
        changed.add(key);
      }
    }
    return changed;
  }
  root.EnergieHealthConnect = {merge};
})(typeof window === "undefined" ? globalThis : window);
