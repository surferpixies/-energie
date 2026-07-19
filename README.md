# Énergie & Repas V1.5.1

Cette version part de la V1.4/V1.5 et conserve l’authentification ainsi que les repas déjà enregistrés dans Supabase.

## Nouveautés

- ⭐ Bibliothèque de repas favoris et ajout rapide;
- 🔎 Recherche instantanée par repas, type, note ou date;
- filtres sur 7 et 30 jours;
- 📊 tableau de bord;
- 🧠 Insights avec niveau de confiance;
- 👀 mode aperçu automatique lorsqu’il y a moins de 8 repas.

Les données du mode aperçu sont fictives, restent uniquement en mémoire et ne sont jamais envoyées dans Supabase.

## Mise à jour Supabase

Dans **Supabase → SQL Editor**, exécute `supabase-setup.sql` une seule fois.

Le script est non destructif : il ne contient aucun `DELETE`, `TRUNCATE` ou `DROP TABLE`. Il ajoute seulement `favorite_meals` et ses règles de sécurité. La table `meals` n’est pas modifiée.

## Publication

1. Fais d’abord un export JSON depuis **Profil → Exporter JSON**.
2. Exécute `supabase-setup.sql`.
3. Remplace les fichiers de ton dépôt GitHub Pages par ceux de cette archive.
4. Vérifie que `config.js` contient l’URL et la clé publique Supabase déjà utilisées par la V1.4.
5. Après la publication, ferme complètement la PWA et rouvre-la. Si l’ancienne version reste en cache, retire puis réinstalle l’icône depuis Safari.

## Validation conseillée

1. Connecte-toi et confirme que tes repas existants apparaissent.
2. Ajoute un repas aux favoris avec `☆`.
3. Utilise ce favori pour préremplir un nouveau repas.
4. Teste la recherche.
5. Ouvre **Tableau** pour voir le mode aperçu et les Insights.
