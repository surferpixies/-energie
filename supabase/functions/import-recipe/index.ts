import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const response = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers });

// Première version: uniquement les domaines validés pendant les essais.
// La liste blanche empêche de transformer l'importateur en proxy vers des adresses privées.
const allowedHosts = new Set([
  "www.ricardocuisine.com", "ricardocuisine.com",
  "www.recettes.qc.ca", "recettes.qc.ca",
]);
function validateUrl(raw: unknown): URL {
  if (typeof raw !== "string" || raw.length > 2048) throw new Error("invalid-url");
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.port || url.username || url.password ||
      !allowedHosts.has(url.hostname.toLowerCase())) throw new Error("unsupported-domain");
  return url;
}
function text(value: unknown): string {
  if (typeof value === "string") return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return typeof value === "number" ? String(value) : "";
}
function findRecipe(node: unknown, depth = 0): Record<string, unknown> | null {
  if (!node || typeof node !== "object" || depth > 8) return null;
  if (Array.isArray(node)) {
    for (const item of node) { const found = findRecipe(item, depth + 1); if (found) return found; }
    return null;
  }
  const value = node as Record<string, unknown>;
  const type = value["@type"];
  if ((typeof type === "string" && /(?:^|:)Recipe$/i.test(type)) ||
      (Array.isArray(type) && type.some(v => typeof v === "string" && /(?:^|:)Recipe$/i.test(v)))) return value;
  for (const key of ["@graph", "mainEntity", "itemListElement", "hasPart"]) {
    const found = findRecipe(value[key], depth + 1);
    if (found) return found;
  }
  return null;
}
function parseRecipe(html: string) {
  const scripts = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)];
  let recipe: Record<string, unknown> | null = null;
  for (const script of scripts) {
    try { recipe = findRecipe(JSON.parse(script[1].trim().replace(/^<!--|-->$/g,""))); }
    catch (_) { continue; }
    if (recipe) break;
  }
  if (!recipe) return null;
  const title = text(recipe.name).slice(0, 140);
  const ingredients = (Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient : [])
    .map(text).filter(Boolean).slice(0, 75);
  if (!title || !ingredients.length) return null;
  const recipeYield = Array.isArray(recipe.recipeYield) ? recipe.recipeYield.map(text).find(Boolean) || "" : text(recipe.recipeYield);
  const nutrition = recipe.nutrition && typeof recipe.nutrition === "object" && !Array.isArray(recipe.nutrition)
    ? recipe.nutrition as Record<string, unknown> : null;
  const caloriesLabel = text(nutrition?.calories);
  const calorieMatch = caloriesLabel.match(/^(\d+(?:[.,]\d+)?)\s*(?:kcal|calories?)?$/i);
  const caloriesPerServing = calorieMatch ? Number(calorieMatch[1].replace(",", ".")) : null;
  const result = {
    title, recipeYield, ingredients,
    // Le format Recipe/NutritionInformation décrit normalement une portion;
    // si l'unité est indéterminée, ne pas proposer de chiffre calorique.
    caloriesPerServing: caloriesPerServing !== null &&
      Number.isFinite(caloriesPerServing) && caloriesPerServing >= 0 &&
      (recipeYield || text(nutrition?.servingSize)) ? caloriesPerServing : null,
    calorieSource: caloriesLabel || null,
  };
  return result;
}
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, {status: 204, headers});
  if (request.method !== "POST") return response(405, {error: "method-not-allowed"});
  const bearer = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(bearer)) return response(401, {error: "authentication-required"});
  const server = Deno.env.get("SUPABASE_URL");
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!server || !secret) return response(503, {error: "service-unavailable"});
  const admin = createClient(server, secret, {auth: {persistSession:false,autoRefreshToken:false}});
  const {data, error} = await admin.auth.getUser(bearer.replace(/^Bearer\s+/i, ""));
  if (error || !data.user) return response(401, {error: "authentication-required"});
  let target: URL;
  try { target = validateUrl((await request.json()).url); }
  catch (_) { return response(400, {error:"invalid-or-unsupported-url"}); }
  try {
    const upstream = await fetch(target, {
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
      headers: {"Accept": "text/html,application/xhtml+xml", "User-Agent": "EnergieRecipeImporter/1.0"},
    });
    if (!upstream.ok || upstream.status >= 300) return response(422,{error:"recipe-not-accessible"});
    const contentType = upstream.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) return response(422,{error:"unsupported-content"});
    if (Number(upstream.headers.get("content-length") || 0) > 1500000) return response(422,{error:"page-too-large"});
    const html = await upstream.text();
    if (html.length > 1500000) return response(422,{error:"page-too-large"});
    const recipe = parseRecipe(html);
    return recipe ? response(200, {recipe}) : response(422,{error:"recipe-structured-data-missing"});
  } catch (_) { return response(422, {error:"recipe-not-accessible"}); }
});
