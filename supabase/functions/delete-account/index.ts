import { createClient } from "npm:@supabase/supabase-js@2";

// Cette fonction ne reçoit jamais d'identifiant de compte à supprimer.
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const reply = (status, body) => new Response(JSON.stringify(body), {status, headers});

export async function handleDeleteAccount(request) {
  if (request.method === "OPTIONS") return new Response(null, {status:204, headers});
  if (request.method !== "POST") return reply(405, {error:"method-not-allowed"});
  const bearer = request.headers.get("Authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(bearer)) return reply(401, {error:"authentication-required"});
  const url = Deno.env.get("SUPABASE_URL"), secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !secret) return reply(503, {error:"service-unavailable"});
  const admin = createClient(url, secret, {auth:{persistSession:false,autoRefreshToken:false}});
  const {data:identity,error:authError} = await admin.auth.getUser(bearer.replace(/^Bearer\s+/i,""));
  if (authError || !identity?.user?.id) return reply(401, {error:"authentication-required"});
  const userId = identity.user.id;
  let body;
  try { body = await request.json(); } catch (_) { return reply(400, {error:"confirmation-required"}); }
  if (body?.confirmation !== "DELETE" || Object.keys(body).some(key => key !== "confirmation")) return reply(400, {error:"confirmation-required"});
  try {
    // Retirer les vrais fichiers via l'API Storage, jamais leurs métadonnées SQL seules.
    const {data:buckets,error:bucketError} = await admin.storage.listBuckets();
    if (bucketError) throw bucketError;
    for (const bucket of buckets || []) {
      const storage = admin.storage.from(bucket.id), paths = [];
      async function collect(prefix, depth = 0) {
        if (depth > 12) throw new Error("storage-depth-limit");
        for (let offset = 0;; offset += 100) {
          const {data:items,error} = await storage.list(prefix,{limit:100,offset,sortBy:{column:"name",order:"asc"}});
          if (error) throw error;
          for (const item of items || []) {
            const path = `${prefix}/${item.name}`;
            if (!path.startsWith(`${userId}/`) || item.name.includes("/") || [".",".."].includes(item.name)) throw new Error("invalid-storage-path");
            if (item.id) paths.push(path); else await collect(path,depth+1);
          }
          if ((items || []).length < 100) break;
        }
      }
      await collect(userId);
      for (let offset = 0; offset < paths.length; offset += 100) {
        const {error} = await storage.remove(paths.slice(offset,offset+100));
        if (error) throw error;
      }
    }
    // Les commentaires pilotes peuvent avoir un lien nullable : les retirer explicitement.
    const {error:feedbackError} = await admin.from("pilot_feedback").delete().eq("user_id",userId);
    if (feedbackError && feedbackError.code !== "42P01" && feedbackError.code !== "PGRST205") throw feedbackError;
    // Les tables du journal, favoris, mémoire, profil et suivi ont des FK ON DELETE CASCADE.
    const {error:deleteError} = await admin.auth.admin.deleteUser(userId, false);
    if (deleteError) throw deleteError;
    return reply(200, {deleted:true,userId});
  } catch (_) {
    // Une erreur ne doit jamais être présentée comme une suppression réussie.
    return reply(500, {error:"deletion-not-confirmed"});
  }
}

Deno.serve(handleDeleteAccount);
