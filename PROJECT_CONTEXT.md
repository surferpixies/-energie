# PROJECT_CONTEXT.md

# Énergie

Version du document : 1.0

Ce document décrit l'historique, les décisions importantes et la philosophie du projet.

Il doit être lu avant toute modification importante.

---

# Vision

Énergie est une application personnelle permettant d'observer les habitudes de vie.

L'objectif n'est PAS de diagnostiquer.

L'objectif est d'aider l'utilisateur à remarquer des tendances.

Exemples :

- énergie
- sommeil
- alimentation
- activité
- ressenti

L'application doit demeurer simple, agréable et rassurante.

---

# Public cible

L'application est conçue initialement pour son créateur.

Le code doit toutefois rester suffisamment générique pour être publié plus tard.

---

# Historique

## V1

Suivi des repas.

Énergie avant repas.

Hydratation.

Historique.

---

## V2

Migration vers Supabase.

Authentification.

Synchronisation.

Historique amélioré.

---

## V3

Scanner alimentaire.

Base alimentaire enrichie.

Recommandations.

Nutrition.

Photos.

---

## V3.5

Activité intelligente.

Calories.

Intensité.

Sommeil enrichi.

Commentaires.

---

# Décisions importantes

## Aucun diagnostic

L'application ne doit jamais dire :

"Ceci cause..."

Toujours préférer :

"Il pourrait être intéressant d'observer..."

---

## Simplicité

Le moins de clics possible.

Le moins de texte possible.

Grandes zones tactiles.

Navigation évidente.

---

## Rapidité

L'utilisateur ouvre l'application plusieurs fois par jour.

Toutes les actions doivent être rapides.

---

## Cartes

Éviter les cartes trop hautes.

Chaque carte doit avoir une utilité claire.

Une carte contenant une seule ligne ne doit pas occuper beaucoup d'espace.

---

# Repas

Chaque repas peut contenir :

- texte
- photo
- recommandations
- ressenti
- commentaire

Le ressenti doit toujours rester visible après son enregistrement.

Le ressenti doit pouvoir être modifié.

---

# Recommandations

Les recommandations doivent devenir de plus en plus intelligentes.

Ne jamais se limiter à une comparaison exacte de texte.

Utiliser :

- catégories
- synonymes
- variantes

Exemple :

"Bœuf"

"Bœuf à fondue"

"Steak"

doivent être interprétés comme la même catégorie.

Même chose pour les légumes.

---

# Foods.js

foods.js est le coeur de la logique alimentaire.

Chaque aliment devrait éventuellement contenir :

nom

catégories

protéines

fibres

glucides

lipides

sodium

sucres

potassium

calcium

etc.

Toutes les recommandations devraient utiliser ces informations.

---

# Scanner

Le scanner doit rester très rapide.

Toujours permettre à l'utilisateur de modifier les portions.

Ne jamais imposer les résultats du scanner.

---

# Activité

Une activité possède :

- type
- durée
- intensité
- calories estimées
- calories réelles (facultatif)

Les calculs sont des estimations.

---

# Sommeil

Le sommeil contient :

durée

qualité

événements

commentaire

Ces données servent uniquement à créer des observations futures.

---

# Historique

L'historique doit être agréable à parcourir.

Préférer :

plus d'information

moins d'espace perdu

---

# Journal

Le journal doit montrer rapidement :

les repas

les ressentis

l'activité

le sommeil

sans longues cartes.

---

# Dashboard

Le tableau de bord doit montrer les informations importantes en quelques secondes.

---

# Supabase

Toute nouvelle donnée doit :

être sauvegardée localement

être synchronisée

être relue

rester compatible avec les anciennes versions

---

# Ce qu'il faut toujours préserver

Installation PWA.

Fonctionnement hors ligne.

Compatibilité iPhone.

Compatibilité Android.

Compatibilité Mac.

Compatibilité Windows.

---

# Ce qu'il faut toujours améliorer

Rapidité.

Simplicité.

Accessibilité.

Performance.

Lisibilité.

---

# Fonctionnalités prévues

Amélioration du moteur de recommandations.

Reconnaissance intelligente des aliments.

Suggestions plus pertinentes.

Évolution du tableau de bord.

Amélioration des graphiques.

Import Apple Health.

Export des données.

Sauvegardes.

Notifications intelligentes.

Analyse des tendances.

Mode médecin.

Rapports PDF.

---

# Ce qu'il ne faut jamais faire

Ne jamais réécrire complètement une fonctionnalité sans raison.

Ne jamais casser les anciennes données.

Ne jamais supprimer une fonctionnalité existante sans validation.

Ne jamais remplacer une interface simple par une interface plus complexe.

Toujours privilégier l'évolution plutôt que la révolution.

---

# Style attendu

Chaque nouvelle version doit donner l'impression que l'application devient :

plus simple

plus rapide

plus intelligente

sans devenir plus compliquée.
