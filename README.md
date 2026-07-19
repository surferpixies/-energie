# Énergie & Repas V1.3.1

Cette version corrige la connexion sur l’application iPhone installée et ajoute la nouvelle icône pomme + éclair.

## 1. Étape obligatoire dans Supabase

Dans **Authentication → Email Templates**, ouvre le modèle **Magic Link** (ou Magic link / OTP) et remplace son contenu par :

```html
<h2>Ton code Énergie & Repas</h2>
<p>Entre ce code directement dans l’application :</p>
<p style="font-size:32px;font-weight:700;letter-spacing:6px;">{{ .Token }}</p>
<p>Ce code est temporaire.</p>
```

Le modèle doit utiliser `{{ .Token }}` et non `{{ .ConfirmationURL }}`. Après l’enregistrement, Supabase enverra un code au lieu d’un lien Safari.

## 2. Mise à jour GitHub

Téléverse à la racine : `index.html`, `styles.css`, `app.js`, `config.js`, `manifest.webmanifest`, `sw.js`, `supabase-setup.sql` et `README.md`.

Dans `assets`, téléverse :

- `icon.svg`
- `icon-192.png`
- `icon-512.png`
- `apple-touch-icon.png`

## 3. Important pour voir la nouvelle icône sur iPhone

L’icône d’une PWA déjà installée peut rester en cache. Après le déploiement :

1. vérifie que la nouvelle app fonctionne dans Safari;
2. supprime uniquement l’ancienne icône de l’écran d’accueil;
3. dans Safari, utilise **Partager → Sur l’écran d’accueil** pour la réinstaller.

Les données officielles restent dans Supabase. Supprimer l’icône ne supprime pas les données du compte en ligne.

## 4. Test de connexion

1. Ouvre **Profil → Se connecter**.
2. Entre ton courriel.
3. Reçois le code.
4. Reviens dans la même application et saisis le code.
5. Le badge doit afficher **Sauvegardé ☁️**.
