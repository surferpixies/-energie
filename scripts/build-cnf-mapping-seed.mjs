import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const auditPath = path.join(root, "data", "cnf-2026", "mapping-audit.json");
const outPath = path.join(root, "data", "cnf-2026", "mapping-seed.json");

const audit = JSON.parse(await readFile(auditPath, "utf8"));

const rows = audit
  .filter(row => ["high", "medium"].includes(row.confidence) && row.candidates?.length)
  .map(row => ({
    legacyIndex: row.legacyIndex,
    energieAlias: row.alias,
    aliases: row.aliases,
    status: row.confidence === "high" ? "candidate-high" : "candidate-medium",
    cnfFoodId: row.candidates[0].cnfFoodId,
    cnfNameFr: row.candidates[0].fr,
    cnfNameEn: row.candidates[0].en,
    score: row.candidates[0].score,
    nutritionPer100g: row.candidates[0].nutritionPer100g,
    portions: row.candidates[0].portions || [],
    verified: false,
    note: "Candidat généré automatiquement — à valider avant utilisation dans les calculs."
  }));

await writeFile(outPath, JSON.stringify(rows, null, 2) + "\n");

const counts = rows.reduce((acc, row) => {
  acc[row.status] = (acc[row.status] || 0) + 1;
  return acc;
}, {});

console.log(`Seed créé: ${rows.length} candidats (${JSON.stringify(counts)}).`);
console.log("Aucun candidat n'est marqué verified=true automatiquement.");
console.log("Fichier: data/cnf-2026/mapping-seed.json");
