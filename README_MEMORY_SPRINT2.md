# Énergie V3.10.0 — Mémoire alimentaire, Sprint 2

## Objectif

Synchroniser la mémoire alimentaire personnalisée avec Supabase tout en conservant une copie locale utilisable hors ligne.

## Installation

1. Ouvrir Supabase.
2. Aller dans **SQL Editor**.
3. Copier tout le contenu de `SUPABASE_MEMORY_SPRINT2.sql`.
4. Cliquer sur **Run**.
5. Déployer ensuite tous les fichiers de ce ZIP sur GitHub Pages.
6. Se connecter à Énergie et appuyer une fois sur **Synchroniser** dans le Profil.

## Fonctionnement

- La mémoire locale du Sprint 1 est conservée.
- Après la connexion, elle est fusionnée avec la mémoire Supabase.
- Chaque utilisateur ne peut lire ou modifier que ses propres données grâce aux règles RLS.
- Les ajouts de repas continuent de fonctionner hors ligne.
- Une modification de mémoire déclenche une synchronisation différée et non bloquante.
- Au retour en ligne, la mémoire est envoyée et fusionnée automatiquement.
- Les alias, ingrédients, types de repas et identifiants de repas sont réunis.
- En cas de conflit, les compteurs les plus avancés et la version la plus récente sont conservés.

## Table créée

`public.user_food_memory`

Une ligne représente un repas personnel appris. Les ingrédients et leurs fréquences sont stockés en JSON afin de permettre les futures variantes et observations sans migration immédiate.

## Limite volontaire

Ce sprint n'ajoute pas encore l'interface « Repas appris ». Elle est prévue pour le Sprint 3.
