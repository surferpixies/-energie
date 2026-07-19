# Énergie & Repas V1.3

Cette version remplace le stockage local comme seule source de vérité par une synchronisation Supabase sécurisée.

## Avant de publier

1. Dans Supabase, ouvre **SQL Editor**.
2. Crée une nouvelle requête, colle tout le contenu de `supabase-setup.sql`, puis clique **Run**.
3. Dans **Authentication → URL Configuration** :
   - Site URL : `https://surferpixies.github.io/-energie/`
   - Redirect URLs : ajoute `https://surferpixies.github.io/-energie/**`
4. Vérifie dans **Authentication → Providers → Email** que le fournisseur Email est activé.
5. Téléverse tous les fichiers de ce dossier à la racine de ton dépôt GitHub Pages. Le dossier `assets` doit conserver son nom.
6. Attends une ou deux minutes, ouvre l'application dans Safari, puis reconnecte-toi avec ton courriel.

## Test de sécurité recommandé

1. Connecte-toi.
2. Ajoute un repas test et attends que le badge affiche **Sauvegardé ☁️**.
3. Ouvre Supabase → Table Editor → `meals` et confirme que le repas est présent.
4. Ouvre l'app dans une fenêtre privée ou sur le Mac, reconnecte-toi, puis confirme que le repas revient.
5. Seulement après ce test, utilise l'application pour tes vraies données.

## Changements V1.3

- connexion par lien magique;
- repas, journées et photos dans Supabase;
- RLS : chaque compte ne voit que ses propres données;
- file d'attente hors ligne et resynchronisation automatique;
- import automatique possible de la copie locale après la première connexion;
- retrait de « catégorie principale » et « quantité approximative »;
- uniquement « fatigue avant » et « fatigue après », sur une échelle de 1 à 5;
- gouttes d'eau directement interactives;
- export/import JSON conservé.

## Important

La clé `sb_publishable_...` du fichier `config.js` est une clé publique destinée au navigateur. Ne place jamais une clé secrète ou `service_role` dans ce projet. La protection dépend des politiques RLS installées par `supabase-setup.sql`.
