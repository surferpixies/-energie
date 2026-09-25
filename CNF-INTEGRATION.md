# Intégration FCÉN 2026 — Énergie

Cette branche prépare le remplacement progressif des valeurs nutritionnelles maison par le **Fichier canadien sur les éléments nutritifs (FCÉN) 2026 de Santé Canada**.

## Source officielle

- Éditeur : Santé Canada
- Jeu de données : Fichier canadien sur les éléments nutritifs / Canadian Nutrient File
- Édition : 2026
- Licence : Licence du gouvernement ouvert – Canada
- Données publiées sous forme de fichiers CSV relationnels.

Le script `scripts/import-cnf.mjs` télécharge directement les ressources officielles et génère une copie locale reproductible.

## Principe d'intégration

Énergie ne doit pas perdre son intelligence actuelle. Le FCÉN devient la **source de référence des valeurs nutritionnelles**, tandis que les éléments propres à Énergie restent une couche distincte :

1. synonymes et vocabulaire FR-CA / FR-FR / anglais;
2. reconnaissance du texte et des quantités;
3. portions usuelles;
4. mémoire personnelle;
5. plats composés / recettes lorsque le FCÉN n'offre pas une correspondance satisfaisante.

La provenance doit rester explicite. Les données importées conservent l'identifiant FCÉN et la version 2026.

## Générer les données

```bash
npm run cnf:import
```

Le script génère :

- `data/cnf-2026/metadata.json`
- `data/cnf-2026/foods.json`
- `cnf-foods.js`

Aucune donnée existante d'Énergie n'est remplacée automatiquement à ce stade. Le prochain passage consiste à établir et valider la correspondance entre les alias simples d'Énergie et les fiches FCÉN avant de basculer les calculs.

## Règle de sécurité de migration

Ne jamais remplacer silencieusement une fiche Énergie par une fiche FCÉN seulement parce que les noms se ressemblent. Les états de cuisson, teneurs en gras, portions et variantes d'un aliment peuvent modifier fortement les valeurs. Les correspondances doivent être traçables et vérifiables.
