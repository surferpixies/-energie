import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const response = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers });

// Domaines de recettes pris en charge (leur accessibilité reste dépendante du site).
// La liste blanche empêche de transformer l'importateur en proxy vers des adresses privées.
const allowedHosts = new Set([
  "www.ricardocuisine.com", "ricardocuisine.com",
  "www.recettes.qc.ca", "recettes.qc.ca",
  "www.iga.ca", "iga.ca",
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
  if ((typeof type === "string" && /(?:^|[:/])Recipe$/i.test(type)) ||
      (Array.isArray(type) && type.some(v => typeof v === "string" && /(?:^|[:/])Recipe$/i.test(v)))) return value;
  for (const key of ["@graph", "mainEntity", "itemListElement", "hasPart", "mainEntityOfPage"]) {
    const found = findRecipe(value[key], depth + 1);
    if (found) return found;
  }
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") {
      const found = findRecipe(child, depth + 1);
      if (found) return found;
    }
  }
  return null;
}
function decodeRecipeEntities(value: string): string {
  return value.replace(/&(?:nbsp|amp|quot|apos|lt|gt|#39|#x27|#(\d+)|#x([0-9a-f]+));/gi,
    (found, decimal, hex) => {
      const named: Record<string, string> = {nbsp:" ", amp:"&", quot:'"', apos:"'", lt:"<", gt:">", "#39":"'", "#x27":"'"};
      const key = found.slice(1,-1).toLowerCase();
      if (named[key]) return named[key];
      const code = decimal ? Number(decimal) : hex ? parseInt(hex,16) : NaN;
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : found;
    });
}
function htmlRecipeText(value: string): string {
  return decodeRecipeEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}
// Secours pour les sites qui utilisent les microdonnées HTML plutôt que JSON-LD.
function parseRecipeMicrodata(html: string) {
  const ingredientMatches = [...html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*\bitemprop\s*=\s*["']?recipeIngredient["']?[^>]*)>([\s\S]*?)<\/\1\s*>/gi)];
  const ingredients = ingredientMatches.map(m => {
    const content = m[2].match(/\bcontent\s*=\s*["']([^"']+)["']/i);
    return htmlRecipeText(content?.[1] || m[3]);
  }).filter(Boolean).slice(0,75);
  if (!ingredients.length) return null;
  const nameMatch = html.match(/<meta\b[^>]*\bproperty\s*=\s*["']og:title["'][^>]*\bcontent\s*=\s*["']([^"']+)["']/i)
    || html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = nameMatch ? htmlRecipeText(nameMatch[1]).replace(/\s*[\|\-]\s*IGA.*$/i,"").slice(0,140) : "";
  if (!title) return null;
  const yieldMatch = html.match(/<[^>]*\bitemprop\s*=\s*["']?recipeYield["']?[^>]*>([\s\S]*?)<\//i);
  return {title, ingredients, recipeYield: yieldMatch ? htmlRecipeText(yieldMatch[1]) : "", caloriesPerServing: null, calorieSource:null};
}
function parseRecipe(html: string) {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .filter(m => /\btype\s*=\s*["']?application\/ld\+json\b/i.test(m[1]));
  let recipe: Record<string, unknown> | null = null;
  for (const script of scripts) {
    try { recipe = findRecipe(JSON.parse(script[2].trim().replace(/^<!--|-->$/g,""))); }
    catch (_) { continue; }
    if (recipe) break;
  }
  if (!recipe) return null;
  const title = text(recipe.name).slice(0, 140);
  const ingredientValues = recipe.recipeIngredient || recipe.ingredients;
  const ingredients = (Array.isArray(ingredientValues) ? ingredientValues : typeof ingredientValues === "string" ? [ingredientValues] : [])
    .map(text).filter(Boolean).slice(0, 75);
  if (!title || !ingredients.length) return null;
  const yieldValue = recipe.recipeYield;
  const recipeYield = Array.isArray(yieldValue) ? yieldValue.map(text).find(Boolean) || ""
    : yieldValue && typeof yieldValue === "object" ? text((yieldValue as Record<string, unknown>).value) + " portions" : text(yieldValue);
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
    let current = target;
    let upstream: Response | null = null;
    for (let hop = 0; hop < 3; hop++) {
      upstream = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(10000),
        headers: {"Accept": "text/html,application/xhtml+xml", "User-Agent": "EnergieRecipeImporter/1.0"},
      });
      if (![301,302,303,307,308].includes(upstream.status)) break;
      const destination = upstream.headers.get("location");
      if (!destination) return response(422, {error:"recipe-redirect-missing"});
      current = validateUrl(new URL(destination, current).toString());
    }
    if (!upstream?.ok) return response(422,{error:"recipe-site-http-error", siteStatus: upstream?.status || null});
    const contentType = upstream.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) return response(422,{error:"unsupported-content"});
    if (Number(upstream.headers.get("content-length") || 0) > 1500000) return response(422,{error:"page-too-large"});
    const html = await upstream.text();
    if (html.length > 1500000) return response(422,{error:"page-too-large"});
    const recipe = parseRecipe(html) || parseRecipeMicrodata(html);
    return recipe ? response(200, {recipe}) : response(422,{error:"recipe-structured-data-missing"});
  } catch (error) {
    console.warn("import-recipe fetch failed", String(error).slice(0, 250));
    return response(422, {error:"recipe-site-connection-failed"});
  }
});
