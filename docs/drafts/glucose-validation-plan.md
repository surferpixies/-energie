# Glycémie — plan de validation pour PR #31

**État : brouillon. Ne pas fusionner ni exécuter la migration SQL en production.**

## Vérifications à effectuer sur une base Supabase de développement
1. Confirmer la version PostgreSQL (le brouillon utilise `pg_input_is_valid`).
2. Créer deux comptes de test et n'utiliser aucune donnée de santé réelle.
3. Préparer une journée de test avec deux lectures distinctes.
4. Lancer deux transactions concurrentes modifiant chacune une lecture différente ; vérifier que les deux valeurs survivent.
5. Répéter avec ajout sur l'appareil A et ajout sur l'appareil B.
6. Supprimer sur A ; après resynchronisation sur B, la lecture doit rester supprimée.
7. Modifier sur B avant de recevoir la suppression de A : arbitrage par horodatage, vérifier les conflits et horloges décalées.
8. Une ancienne application sans `glucoseTombstones` ne doit pas ressusciter une lecture supprimée.
9. Vérifier les champs `sleep_hours`, `water`, `activities`, `supplements.personalProfile`, `supplements.weightMeasurement`, `formDrafts`, et les données Pro.
10. Rafraîchir Web/iOS/Android, puis vérifier le rechargement et l'absence de doublons.

## Limites et risque résiduel

- Le trigger proposé ne protège **que les glycémies** pendant un UPDATE sur `daily_logs`. Les autres champs de la journée restent soumis à la logique d'écriture actuelle.
- Les mises à jour multiappareils reposent pour l'instant sur des horodatages client ; des horloges décalées peuvent donner un ordre incorrect.
- Une fusion JSONB pendant un UPDATE protège les modifications concurrentes des lectures, mais ne couvre pas encore l'ensemble des cas d'INSERT simultané ni les anciennes versions.
- Il faut examiner les limites d'accès RPC/fonctions, la politique RLS et les éventuels triggers déjà en place avant installation.
- Ne pas exécuter sur le projet de production sans sauvegarde, tests intégrés et plan de retour arrière.

## Commande de tests JS

`node tests/glucose-sync.test.cjs`

Ce test vérifie uniquement la logique de fusion dans `app.js`, sans Supabase ni appareils.
