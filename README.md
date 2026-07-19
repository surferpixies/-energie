# Énergie & Repas V1.5

Cette version conserve l’authentification et la synchronisation Supabase de la V1.4, puis ajoute :

- une bibliothèque de repas favoris;
- l’ajout rapide d’un repas à partir d’un favori;
- une recherche par aliment, type, note ou date;
- des filtres sur 7 et 30 jours;
- un tableau de bord avec les repas récents, la fatigue moyenne et les repas fréquents.

## Mise à jour obligatoire de Supabase

Avant de publier les fichiers, ouvre **Supabase → SQL Editor**, colle le contenu complet de `supabase-setup.sql`, puis exécute-le.

Le script conserve les tables existantes et ajoute seulement la table `favorite_meals` avec ses règles de sécurité. Tes repas actuels ne sont pas supprimés.

## Publication GitHub Pages

1. Remplace les fichiers de la V1.4 par ceux de ce dossier.
2. Vérifie que `config.js` contient toujours l’URL et la clé publique de ton projet Supabase.
3. Publie les changements.
4. Sur iPhone, ferme complètement l’application et rouvre-la. Au besoin, retire-la de l’écran d’accueil puis réinstalle-la pour forcer la nouvelle version du service worker.

## Utilisation des favoris

- Sur une carte de repas, touche l’étoile `☆`.
- Donne un nom au favori.
- Le favori apparaît sur l’accueil et dans **Historique**.
- Touche **Utiliser** pour préremplir un nouveau repas.
