# AGENTS.md

# Langue

Toutes les réponses destinées au développeur doivent être en français (fr-CA).

Le code demeure en anglais lorsque cela est déjà la convention du projet (noms de fonctions, variables, etc.).

Les commentaires dans le code doivent être en français, sauf si le fichier est déjà majoritairement en anglais.

Les explications, résumés, propositions et plans doivent toujours être rédigés en français.

# Énergie

Énergie est une Progressive Web App (PWA) permettant à l'utilisateur de suivre son alimentation, son énergie, son sommeil, son activité physique et son ressenti afin d'observer des tendances au fil du temps.

Le projet privilégie la simplicité, la rapidité et une excellente expérience utilisateur.

---

# Philosophie

L'application n'effectue AUCUN diagnostic médical.

Elle ne doit jamais conclure qu'un aliment est responsable d'un symptôme.

Toutes les recommandations doivent être formulées comme des observations ou des suggestions.

Exemples :

✔️
"Tu sembles manger peu de fibres aujourd'hui."

✔️
"Tu pourrais essayer d'ajouter un peu plus de légumes."

❌
"Tes maux de tête sont causés par..."

---

# Technologies

Front-end

- HTML
- CSS
- JavaScript Vanilla (aucun framework)

Backend

- Supabase
- PostgreSQL
- Auth Supabase

Déploiement

- GitHub Pages
- PWA

Ne jamais convertir le projet vers React, Vue, Angular ou Flutter sans demande explicite.

---

# Architecture

Les principaux fichiers sont :

index.html
Interface principale

styles.css
Styles

app.js
Logique principale

foods.js
Base de données alimentaire

i18n.js
Traductions

config.js
Configuration

sw.js
Service Worker

manifest.webmanifest
PWA

supabase-setup.sql
Création et évolution de la base de données

---

# Style de code

Toujours privilégier :

- fonctions courtes
- code lisible
- commentaires utiles
- éviter la duplication
- conserver les noms déjà utilisés

Ne jamais réécrire complètement une fonctionnalité lorsqu'une modification locale suffit.

---

# Interface utilisateur

L'application doit rester minimaliste.

Préférer :

- peu de texte
- cartes compactes
- grands boutons tactiles
- peu de défilement

Éviter les cartes très hautes contenant une seule information.

---

# Repas

Chaque repas peut contenir :

- aliments
- boissons
- photo
- recommandations
- ressenti
- commentaire

Le ressenti doit être affiché sous le repas lorsqu'il existe.

Le ressenti doit être modifiable.

---

# Recommandations

Les recommandations doivent utiliser les catégories alimentaires.

Éviter les comparaisons exactes de chaînes.

Préférer :

- catégories
- synonymes
- variantes

Exemples :

"Bœuf"

"Bœuf à fondue"

"Steak"

doivent tous être reconnus comme protéines.

Même chose pour les légumes.

---

# Activité

Chaque activité contient :

- type
- durée
- intensité
- calories estimées
- calories réelles (facultatif)

Les anciennes activités doivent demeurer compatibles.

---

# Sommeil

Conserver :

- durée
- qualité
- événements de la nuit
- commentaire

Ces informations servent uniquement à produire des observations.

---

# Historique

L'historique doit demeurer compact.

Les cartes doivent afficher uniquement les informations importantes.

---

# Dashboard

Le tableau de bord doit être lisible rapidement.

Éviter les grosses cartes peu informatives.

---

# Supabase

Toute nouvelle donnée ajoutée localement doit également :

- être synchronisée
- être relue correctement
- être compatible avec les anciennes versions

Toujours fournir la migration SQL lorsque nécessaire.

---

# Compatibilité

Ne jamais casser :

- anciennes données
- historique
- sauvegarde locale
- synchronisation Supabase

Toujours prévoir une migration douce.

---

# Avant chaque modification

Avant de modifier un fichier :

1. Comprendre la fonctionnalité existante.

2. Modifier le minimum de code nécessaire.

3. Ne jamais supprimer une fonctionnalité sans demande.

4. Vérifier les impacts sur :
   - historique
   - journal
   - Supabase
   - PWA
   - traductions

---

# Objectif

Chaque version doit améliorer l'expérience utilisateur sans complexifier l'application.

La stabilité est prioritaire sur l'ajout de nouvelles fonctionnalités.
