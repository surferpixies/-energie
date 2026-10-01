(function ProfileAvatarModule() {
  "use strict";
  const BUCKET = "profile-avatars";
  const MAX_INPUT_BYTES = 12 * 1024 * 1024;
  const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
  }

  function initials(name) {
    const words = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "👤";
    return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2))
      .toLocaleUpperCase("fr-CA");
  }

  function avatarHtml(name, url = null, modifier = "") {
    const safeName = escapeHtml(name || "Utilisateur Énergie");
    const content = url
      ? `<img src="${escapeHtml(url)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
      : `<span aria-hidden="true">${escapeHtml(initials(name))}</span>`;
    return `<span class="profile-avatar ${escapeHtml(modifier)}" role="img" aria-label="Avatar de ${safeName}">${content}</span>`;
  }

  async function compressAvatar(file) {
    if (!file || !/^image\//.test(file.type) || file.size > MAX_INPUT_BYTES)
      throw new Error("Choisis une image de 12 Mo ou moins.");
    const source = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("Ce format d’image n’est pas pris en charge."));
        image.src = source;
      });
      const maxSide = 512;
      const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Impossible de préparer la photo sur cet appareil.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
      if (!blob || blob.size > MAX_AVATAR_BYTES) throw new Error("Impossible de compresser cette photo.");
      return blob;
    } finally {
      URL.revokeObjectURL(source);
    }
  }

  function create({ getClient, getSession, getName }) {
    let avatarPath = null;
    let avatarUrl = null;
    let showSelf = false;
    let shareWithProfessionals = false;
    const currentUserId = () => getSession()?.user?.id || null;

    async function signedUrl(path, duration = 3600) {
      if (!path || !getClient()) return null;
      const { data, error } = await getClient().storage.from(BUCKET).createSignedUrl(path, duration);
      if (error) {
        console.info("Photo de profil non disponible:", error.message);
        return null;
      }
      return data?.signedUrl || null;
    }

    function renderHeader() {
      const target = document.getElementById("headerAccountAvatar");
      if (!target) return;
      const name = currentUserId() ? getName() : "";
      target.innerHTML = avatarHtml(name, currentUserId() && showSelf ? avatarUrl : null, "profile-avatar--header");
      target.title = currentUserId() ? "Compte connecté : " + name : "Compte non connecté";
    }

    async function loadOwn() {
      const userId = currentUserId();
      avatarPath = null;
      avatarUrl = null;
      showSelf = false;
      shareWithProfessionals = false;
      renderHeader();
      if (!userId || !getClient()) return;
      const { data, error } = await getClient().from("profiles")
        .select("avatar_path,show_avatar_self,share_avatar_with_professionals")
        .eq("id", userId).maybeSingle();
      if (userId !== currentUserId()) return;
      if (error) {
        console.info("Préférences de photo de profil non configurées:", error.message);
        return;
      }
      const path = data?.avatar_path || null;
      const imageUrl = path ? await signedUrl(path) : null;
      if (userId !== currentUserId()) return;
      avatarPath = path;
      avatarUrl = imageUrl;
      showSelf = data?.show_avatar_self === true;
      shareWithProfessionals = data?.share_avatar_with_professionals === true;
      renderHeader();
    }

    function clear() {
      avatarPath = null;
      avatarUrl = null;
      showSelf = false;
      shareWithProfessionals = false;
      renderHeader();
    }

    function editorHtml() {
      if (!currentUserId()) return "";
      const name = getName();
      return `<div class="profile-account-avatar-editor">
        ${avatarHtml(name, avatarUrl, "profile-avatar--editor")}
        <div class="profile-account-avatar-actions">
          <strong>Ma photo de profil</strong>
          <div class="profile-account-avatar-buttons">
            <input id="profileAvatarFile" type="file" accept="image/*" hidden>
            <button class="secondary small" id="changeProfileAvatar" type="button">${avatarPath ? "Modifier ma photo" : "Ajouter ma photo"}</button>
            ${avatarPath ? '<button class="text-button" id="removeProfileAvatar" type="button">Supprimer</button>' : ""}
          </div>
          <small class="muted">Facultative · photo compressée automatiquement.</small>
          <p class="muted tiny" id="profileAvatarStatus" role="status" aria-live="polite"></p>
        </div>
      </div>`;
    }

    function settingsHtml() {
      if (!currentUserId()) return "";
      return `<section class="card profile-avatar-settings-card">
        <h3>📷 Photo de profil</h3>
        <p class="muted small">Tu décides où ta photo apparaît. Les deux autorisations sont indépendantes.</p>
        <label class="toggle-row"><span><strong>Afficher ma photo</strong><small>Dans l’en-tête de mon journal Énergie.</small></span><input type="checkbox" id="settingShowProfileAvatar" ${showSelf ? "checked" : ""}></label>
        <label class="toggle-row"><span><strong>Autoriser mes professionnels à voir ma photo</strong><small>Dans leur liste de clients et le bandeau de ton dossier, uniquement si le partage est actif.</small></span><input type="checkbox" id="settingShareProfileAvatar" ${shareWithProfessionals ? "checked" : ""}></label>
        <p class="muted tiny">Désactivés par défaut. Sinon, seules tes initiales sont affichées.</p>
      </section>`;
    }

    async function upload(file) {
      const userId = currentUserId();
      if (!userId || !getClient()) throw new Error("Connecte-toi avant d’ajouter une photo.");
      if (!file) return false;
      const blob = await compressAvatar(file);
      if (userId !== currentUserId()) throw new Error("Le compte connecté a changé.");
      const storage = getClient().storage.from(BUCKET);
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await storage.upload(path, blob, {
        upsert: false, cacheControl: "3600", contentType: "image/jpeg",
      });
      if (uploadError) throw uploadError;
      const { error } = await getClient().from("profiles")
        .update({ avatar_path: path, updated_at: new Date().toISOString() })
        .eq("id", userId).select("id").single();
      if (error || userId !== currentUserId()) {
        await storage.remove([path]).catch(() => {});
        throw error || new Error("Le compte connecté a changé.");
      }
      const previous = avatarPath;
      avatarPath = path;
      avatarUrl = await signedUrl(path);
      renderHeader();
      if (previous && previous !== path) storage.remove([previous]).catch(() => {});
      return true;
    }

    async function remove() {
      const userId = currentUserId();
      if (!userId || !getClient()) throw new Error("Connecte-toi pour supprimer ta photo.");
      const previous = avatarPath;
      if (!previous) return false;
      const { error } = await getClient().from("profiles")
        .update({ avatar_path: null, updated_at: new Date().toISOString() })
        .eq("id", userId).select("id").single();
      if (error) throw error;
      avatarPath = null;
      avatarUrl = null;
      renderHeader();
      getClient().storage.from(BUCKET).remove([previous]).catch(() => {});
      return true;
    }

    async function setVisibility(column, enabled) {
      if (!["show_avatar_self", "share_avatar_with_professionals"].includes(column))
        throw new Error("Préférence inconnue.");
      const userId = currentUserId();
      if (!userId || !getClient()) throw new Error("Compte non connecté.");
      const { error } = await getClient().from("profiles")
        .update({ [column]: enabled === true, updated_at: new Date().toISOString() })
        .eq("id", userId).select("id").single();
      if (error) throw error;
      if (column === "show_avatar_self") showSelf = enabled === true;
      else shareWithProfessionals = enabled === true;
      renderHeader();
    }

    async function withProfessionalPhotos(links) {
      const professionalId = currentUserId();
      const cleanLinks = (links || []).map((link) => ({ ...link, avatarUrl: null }));
      if (!professionalId || !getClient() || !cleanLinks.length) return cleanLinks;
      const { data, error } = await getClient().rpc("get_professional_client_avatar_paths");
      if (error) {
        console.info("Photos de clients non disponibles:", error.message);
        return cleanLinks;
      }
      const byLink = new Map((data || []).map((item) => [String(item.link_id), item.avatar_path]));
      const storage = getClient().storage.from(BUCKET);
      const paths = [...new Set(cleanLinks
        .filter((link) => link.status === "active" && link.client_user_id)
        .map((link) => byLink.get(String(link.id)))
        .filter(Boolean))];
      const signedByPath = new Map();
      // Une seule requête pour une longue liste de clients, si l'API le permet.
      if (paths.length && typeof storage.createSignedUrls === "function") {
        try {
          const { data: urls, error: urlsError } = await storage.createSignedUrls(paths, 60);
          if (!urlsError) (urls || []).forEach((item) => {
            if (!item.error && item.path && item.signedUrl)
              signedByPath.set(item.path, item.signedUrl);
          });
        } catch (error) {
          console.info("Signature groupée indisponible:", error?.message || error);
        }
      }
      const result = await Promise.all(cleanLinks.map(async (link) => {
        const path = byLink.get(String(link.id));
        if (link.status !== "active" || !link.client_user_id || !path) return link;
        return { ...link, avatarUrl: signedByPath.get(path) || await signedUrl(path, 60) };
      }));
      if (professionalId !== currentUserId()) return cleanLinks;
      return result;
    }

    return Object.freeze({
      avatarHtml, renderHeader, loadOwn, clear, editorHtml, settingsHtml,
      upload, remove, setVisibility, withProfessionalPhotos,
    });
  }

  window.EnergieProfileAvatars = Object.freeze({ create });
})();
