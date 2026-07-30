# Énergie V3.11.0 — Sprint 3

## Ce que le Cerveau connaît de toi

Ce sprint rend visible la mémoire alimentaire personnelle construite aux Sprints 1 et 2.

### Nouvelle vue Cerveau
- jauge de connaissance globale;
- nombre de repas appris, utilisations et repas bien connus;
- cartes narratives des repas appris;
- niveaux honnêtes : « Je découvre », « J’apprends », « Je pense », « Je sais »;
- ingrédients classés Toujours, Souvent, Parfois et Rare;
- aliments les plus fréquents dans les recettes apprises;
- chronologie des recettes découvertes;
- état d’apprentissage sans corrélations prématurées.

### Architecture
La vue lit directement `Brain.memory.list()`. Elle ne modifie pas les données et ne perturbe ni le Journal ni la synchronisation Supabase.

### Installation
Aucune nouvelle table SQL n’est nécessaire. Remplacer les fichiers du Sprint 2 par ceux de ce ZIP.
