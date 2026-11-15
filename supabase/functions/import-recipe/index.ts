import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};
const response = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers });

const MAX_REQUEST_BYTES = 4096;
const MAX_PAGE_BYTES = 1_500_000;
const MAX_REDIRECTS = 2;
const FETCH_TIMEOUT_MS = 10_000;

// Lire un flux sous une limite stricte : Content-Length peut être absent ou mensonger.
// Toujours annuler le lecteur dès qu'on atteint la limite.
async function readLimitedText(body: ReadableStream<Uint8Array> | null, maxBytes: number): Promise<string> {
  if (!body) throw new Error("empty-body");
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw new Error("body-too-large");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const part of chunks) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

// Liste de domaines chargée depuis public.recipe_sites; jamais depuis l'utilisateur.
type RecipeSite = {domain: string; display_name: string; status: string; enabled: boolean};
function validateUrl(raw: unknown, sites: RecipeSite[]): URL {
  if (typeof raw !== "string" || raw.length > 2048) throw new Error("invalid-url");
  const url = new URL(raw);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.port || url.username || url.password || url.hostname.endsWith(".local") ||
      !sites.some(site => site.enabled && site.status !== "blocked" &&
        (host === site.domain || host === "www." + site.domain))) {
    throw new Error("unsupported-domain");
  }
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
  if (!["GET", "POST"].includes(request.method)) return response(405, {error: "method-not-allowed"});
  const bearer = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(bearer)) return response(401, {error: "authentication-required"});
  const server = Deno.env.get("SUPABASE_URL");
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!server || !secret) return response(503, {error: "service-unavailable"});
  const admin = createClient(server, secret, {auth: {persistSession:false,autoRefreshToken:false}});
  const {data, error} = await admin.auth.getUser(bearer.replace(/^Bearer\s+/i, ""));
  if (error || !data?.user?.id) return response(401, {error: "authentication-required"});
  const {data: rows, error: settingsError} = await admin.from("recipe_sites")
    .select("domain,display_name,status,enabled");
  if (settingsError || !rows) {
    console.error("Recipe sites settings unavailable", settingsError?.message || "missing rows");
    return response(503, {error: "recipe-sites-settings-unavailable"});
  }
  const sites = (rows as RecipeSite[]).filter(site =>
    /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(site.domain));
  if (request.method === "GET") {
    return response(200, {sites: sites.filter(site => site.enabled && site.status !== "blocked")
      .map(({domain, display_name, status}) => ({domain, name: display_name, status}))});
  }
  let target: URL;
  try {
    const length = Number(request.headers.get("content-length") || "0");
    if (length > MAX_REQUEST_BYTES) return response(413, {error: "request-too-large"});
    const rawBody = await readLimitedText(request.body, MAX_REQUEST_BYTES);
    const parsed = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
        Object.keys(parsed).some(key => key !== "url")) throw new Error("invalid-body");
    target = validateUrl(parsed.url, sites);
  } catch (error) {
    return error instanceof Error && error.message === "body-too-large"
      ? response(413, {error: "request-too-large"})
      : response(400, {error: "invalid-or-unsupported-url"});
  }

  // Le quota est réservé côté SQL avant le moindre accès réseau à un site tiers.
  const { data: admitted, error: quotaError } = await admin.rpc("reserve_recipe_import_request", {
    p_user_id: data.user.id,
  });
  if (quotaError) {
    console.error("Recipe import quota unavailable", quotaError.code || "unknown");
    return response(503, {error: "recipe-import-quota-unavailable"});
  }
  if (admitted !== true) return response(429, {error: "recipe-import-rate-limit"});

  try {
    let current = target;
    let upstream: Response | null = null;
    // Suivre au maximum deux redirections, chaque destination étant revalidée.
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      upstream = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {"Accept": "text/html,application/xhtml+xml", "User-Agent": "EnergieRecipeImporter/1.0"},
      });
      if (![301,302,303,307,308].includes(upstream.status)) break;
      // Ne pas laisser le flux de la redirection occuper des ressources.
      await upstream.body?.cancel().catch(() => {});
      if (hop === MAX_REDIRECTS) return response(422, {error: "recipe-too-many-redirects"});
      const destination = upstream.headers.get("location");
      if (!destination) return response(422, {error: "recipe-redirect-missing"});
      current = validateUrl(new URL(destination, current).toString(), sites);
    }
    if (!upstream?.ok) {
      await upstream?.body?.cancel().catch(() => {});
      return response(422,{error:"recipe-site-http-error", siteStatus: upstream?.status || null});
    }
    const contentType = upstream.headers.get("content-type") || "";
    const declared = Number(upstream.headers.get("content-length") || "0");
    if (!/^(text\/html|application\/xhtml\+xml)(?:\s*;|\s*$)/i.test(contentType) ||
        (Number.isFinite(declared) && declared > MAX_PAGE_BYTES)) {
      await upstream.body?.cancel().catch(() => {});
      return response(422, {error: "unsupported-content-or-size"});
    }
    const html = await readLimitedText(upstream.body, MAX_PAGE_BYTES);
    // IGA peut renvoyer sa page générale même pour un lien vers une recette.
    // Ne jamais traiter cette page comme une fiche recette.
    if (target.hostname.endsWith("iga.ca") && target.pathname.startsWith("/fr/recettes/")) {
      const canonical = html.match(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*\bhref\s*=\s*["']([^"']+)["']/i);
      const canonicalPath = canonical ? (() => {
        try { return new URL(canonical[1], current).pathname.replace(/\/$/, ""); } catch (_) { return ""; }
      })() : "";
      if (current.pathname.replace(/\/$/, "") === "/fr/recettes" || canonicalPath === "/fr/recettes")
        return response(422, {error: "recipe-redirected-to-listing"});
    }
    const recipe = parseRecipe(html) || parseRecipeMicrodata(html);
    return recipe ? response(200, {recipe}) : response(422,{error:"recipe-structured-data-missing"});
  } catch (error) {
    if (error instanceof Error && error.message === "body-too-large") {
      return response(422, {error: "page-too-large"});
    }
    console.warn("import-recipe fetch failed", error instanceof Error ? error.name : "unknown");
    return response(422, {error:"recipe-site-connection-failed"});
  }
});
