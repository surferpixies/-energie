# Énergie 3.56.7 — Journal sommaire ou détaillé

## Nouvelle vue sommaire

- Les calories de la journée restent affichées en haut.
- Quatre actions rapides sont proposées : Repas, Ressenti, Activité et Hydratation.
- Le poids et le sommeil ne sont pas montrés dans cette vue allégée.
- Hydratation ajoute directement une unité de 500 ml, jusqu'à l'objectif affiché.
- Activité ouvre le formulaire existant.
- Ressenti permet de choisir un repas de la journée ou un ressenti hors repas.

## Ajout d'un repas

Le bouton Repas propose Petit-déjeuner, Déjeuner, Dîner et Collation selon la langue active. Les identifiants internes demeurent Déjeuner, Dîner, Souper et Collation afin de conserver la compatibilité des données. Chaque choix ouvre ensuite le formulaire complet habituel.

## Navigation

Un sélecteur fixe Sommaire | Détaillée est placé au bas du Journal, juste au-dessus de la navigation principale. La préférence est mémorisée. La vue détaillée existante demeure intacte.

## Compatibilité et vérification

- Aucune modification SQL ni nouvelle colonne Supabase n'est requise.
- Syntaxe JavaScript vérifiée.
- 112 tests automatisés réussis.
