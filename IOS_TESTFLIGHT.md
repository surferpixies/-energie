# Énergie iOS / TestFlight

Cette branche enveloppe la version web stable **3.56.119** avec Capacitor. Les fichiers servis par GitHub Pages restent à la racine et ne sont pas déplacés. Le dossier `www` est généré uniquement pour le projet iOS.

## Prérequis sur le Mac

- Node.js 22 ou plus récent
- Xcode 26 ou plus récent avec ses outils de ligne de commande
- Compte Apple ajouté dans Xcode

## Premier projet iOS

```bash
npm install
npm run ios:add
npm run ios:open
```

Dans Xcode, sélectionner l’équipe Apple, brancher l’iPhone et lancer l’application sur l’appareil réel.

## Après une modification web dans la branche iOS

```bash
npm run ios:sync
npm run ios:open
```

## Identité de l’application

- Nom visible : `Énergie`
- Bundle ID : `ca.surferpixies.energie`
- Source web figée : `v3.56.119-web-stable`

## Vérifications prioritaires sur iPhone réel

1. Connexion, déconnexion et conservation de la session Supabase.
2. Photos de repas : ajout, conservation automatique, synchronisation et suppression manuelle seulement.
3. Caméra et scanner de code-barres.
4. Ressentis à suivre et données historiques inchangés.
5. Absence de contamination entre Déjeuner, Dîner, Souper et Collation.
6. Mode professionnel en lecture seule, notes et changement de client.
7. Modales, clavier, navigation et retour à l’application.

Les redirections de confirmation et de récupération Supabase devront être validées sur l’iPhone avant le premier build TestFlight.
