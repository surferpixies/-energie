# Énergie 3.13.0 — Sprint 6

## Ajouts

- Trois profils fictifs de 180 jours : Marie, Alex et Sophie.
- Parcours réalistes avec journées oubliées, fins de semaine, variations et progression non linéaire.
- Sélecteur privé dans Profil, visible uniquement lorsque `profiles.has_demo_access = true`.
- Mode strictement lecture seule.
- Sauvegarde du journal réel avant l'entrée en démo et restauration en quittant.
- Aucune synchronisation Supabase pendant la consultation d'une démo.

## Installation

1. Exécuter `SUPABASE_DEMO_PROFILES_SPRINT6.sql` dans Supabase.
2. Remplacer les deux adresses de courriel dans le script SQL.
3. Publier tous les fichiers, y compris `demo-profiles.js`.
4. Vider le cache du site ou recharger complètement la PWA.

## Profils

- **Marie** : horaires variables, produits laitiers et maux de tête en diminution graduelle.
- **Alex** : habitudes stables et variées, sans association problématique forcée.
- **Sophie** : fibres et hydratation en hausse, inconfort digestif en diminution.
