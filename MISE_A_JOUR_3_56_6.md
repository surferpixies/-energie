# Énergie 3.56.6 — Parcours naturel des ressentis

## Changements

- Le choix retiré « Tout va bien — rien de particulier » ne s'affiche plus dans la saisie, les résumés, l'historique ou les comparaisons.
- Les anciennes valeurs correspondantes sont ignorées au chargement. Une ancienne saisie qui ne contenait que ce choix est supprimée comme saisie vide.
- Les cinq ressentis positifs explicites restent disponibles avant et après le repas.
- Un ressenti positif explicite peut servir de point de départ à zéro pour un inconfort non sélectionné, sans empêcher de consigner simultanément un inconfort réel.
- La fiche suit maintenant l'ordre naturel : ressentis avant, informations du repas, puis ressentis après.
- Avant et Après utilisent deux cartes distinctes, numérotées et visuellement différenciées.

## Compatibilité

Aucune modification SQL ni nouvelle colonne Supabase n'est nécessaire. Le format JSON existant demeure compatible.

## Vérification

- Syntaxe JavaScript vérifiée.
- 105 tests automatisés réussis.
- Ordre réel des blocs Avant → repas → Après vérifié dans le formulaire.
