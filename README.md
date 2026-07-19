# Énergie & Repas V1.4

## Changement principal

La connexion se fait maintenant avec **courriel + mot de passe directement dans l’application installée**.

Cette méthode évite le problème des sessions séparées entre Safari et la PWA iPhone.

## Mise à jour GitHub

Remplace les fichiers à la racine du dépôt par ceux de ce dossier :

- `index.html`
- `styles.css`
- `app.js`
- `config.js`
- `manifest.webmanifest`
- `sw.js`
- `supabase-setup.sql`
- `README.md`

Remplace également les fichiers du dossier `assets`.

## Configuration Supabase

Dans **Authentication → URL Configuration** :

- Site URL : `https://surferpixies.github.io/-energie/`
- Redirect URL autorisée : `https://surferpixies.github.io/-energie/**`

Aucune modification des modèles de courriel et aucun SMTP personnalisé ne sont nécessaires.

## Première connexion

### Nouveau compte

1. Ouvre l’application installée.
2. Va dans **Profil → Se connecter**.
3. Choisis **Créer un compte**.
4. Entre ton courriel et un mot de passe d’au moins 8 caractères.
5. Confirme le courriel envoyé par Supabase si demandé.
6. Reviens dans l’application installée et connecte-toi avec le même mot de passe.

### Compte déjà créé avec le lien magique

1. Dans **Connexion**, entre ton courriel.
2. Touche **Mot de passe oublié ou compte créé avec un lien magique?**
3. Ouvre le courriel de récupération dans Safari.
4. Choisis un nouveau mot de passe sur la page qui s’ouvre.
5. Reviens dans l’application installée et connecte-toi avec ce mot de passe.

## Icône iPhone

Si l’ancienne icône reste affichée, retire seulement l’icône de l’écran d’accueil puis ajoute de nouveau l’application depuis Safari. Cela ne supprime pas les données Supabase.
