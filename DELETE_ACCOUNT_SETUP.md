# Activer la suppression du compte

Le bouton appelle la fonction Supabase `delete-account`. Il n'efface la copie locale qu'après confirmation du serveur. Aucun secret administrateur n'est placé dans l'application.

## Déploiement dans le Dashboard

Dans le projet Supabase d'Énergie, ouvrir **Edge Functions → Deploy a new function → Via Editor**.

Nommer la fonction **delete-account** et copier le contenu de `supabase/functions/delete-account/index.ts` dans l'éditeur, puis déployer.

Désactiver **Verify JWT with legacy secret** pour cette fonction si cette option est proposée. La fonction vérifie elle-même le jeton avec `auth.getUser()`; une requête anonyme ou visant un autre identifiant est refusée. Les variables `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournies par Supabase côté serveur.

Autre possibilité avec la CLI déjà installée et liée au projet : `supabase functions deploy delete-account --no-verify-jwt`.

## Vérification avec un compte jetable uniquement

Créer un compte de test dédié, ajouter un repas et une photo, puis utiliser **Profil → Supprimer mon compte**. Annuler d'abord pour vérifier que rien ne change; confirmer ensuite. Vérifier la disparition de ce compte dans Authentication, de ses lignes du journal et de ses fichiers Storage. Ne jamais utiliser un compte réel pour ce test.

La fonction retire les fichiers placés sous le préfixe UUID du compte dans les buckets (photos de repas, avatars, pièces jointes pilotes), puis les commentaires pilotes, puis le compte Auth. Les FK des migrations Énergie suppriment les données associées par cascade. Vérifier les FK si le schéma de production a été modifié manuellement.

La suppression des fichiers et celle du compte ne forment pas une transaction : si le serveur échoue après le retrait des fichiers, le compte peut rester avec certaines photos retirées. Le client indique alors que la suppression n'a pas été confirmée et permet de réessayer. La fonction ne prétend pas supprimer instantanément les sauvegardes gérées par l'hébergeur; leur rétention doit être décrite dans la politique de confidentialité.

## Connexion Apple — point restant avant lancement public

Le flux actuel ne conserve pas de jeton d'accès ou de rafraîchissement Apple utilisable pour une révocation. Cette fonction supprime le compte Énergie; elle ne prétend pas révoquer l'autorisation Apple. Le message final indique où la retirer dans les réglages Apple. Avant le lancement public, vérifier et compléter la gestion des jetons selon la technote Apple TN3194. Ne jamais bloquer la suppression du compte uniquement parce qu'un ancien jeton Apple est absent.

Références : https://supabase.com/docs/guides/auth/managing-user-data ; https://supabase.com/docs/guides/storage/management/delete-objects ; https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple
