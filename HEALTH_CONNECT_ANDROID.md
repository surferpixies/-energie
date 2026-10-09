# Health Connect — première intégration Android

Lecture seule : pas agrégés par journée locale, stades de sommeil, séances d’activité et poids. Les permissions sont indépendantes. La synchronisation se fait à l’ouverture et au retour dans l’application, ou sur demande dans Profil. Aucune lecture périodique en arrière-plan ni écriture dans Health Connect.

## Limites de cette première version

- Fenêtre de lecture conservatrice : 28 jours précédents et aujourd’hui. Aucun accès étendu à l’historique demandé.
- Sommeil : importer les stades de sommeil réel lorsqu’ils existent; ne pas transformer une séance sans stades en heures de sommeil effectif.
- Activités : catégories communes lorsqu’une correspondance existe, sinon titre d’origine sous « Autre ». Conserver type, titre et application source. Les calories restent estimées, aucune calorie mesurée n’est inventée.
- Les séances déjà importées ne sont pas recréées. La suppression ou modification d’une séance dans l’application source n’est pas encore répercutée automatiquement.
- Les pas importés de Health Connect sont réactualisés; les valeurs manuelles identifiées et les anciens imports Apple sont protégés.
- Les anciennes valeurs sans source sont reprises sur les journées récentes seulement. Une ancienne saisie manuelle sans origine connue peut donc être remplacée sur cette période.
- Android minimum passe de 7 à 8 (SDK 26, exigé par la bibliothèque); Health Connect lui-même nécessite Android 9 ou plus et sa disponibilité est vérifiée.

## Validation sur appareil avant publication

1. Compiler la branche dans Android Studio avec JDK 21, puis installer sur le téléphone Android de test.
2. Profil → Health Connect : accorder seulement les pas; comparer hier et aujourd’hui à Health Connect.
3. Autoriser ensuite sommeil, activités et poids; vérifier ce que l’application source y transmet réellement.
4. Synchroniser deux fois : aucune activité en double. Modifier les pas manuellement : ils doivent rester inchangés au prochain import.
5. Refuser puis retirer les permissions : aucun effacement de l’historique. Arrêter les imports dans Profil : aucun import au retour.
6. Vérifier le journal après synchronisation Supabase et reconnexion.
7. Vérifier sur Android 13 (application Health Connect séparée) et Android 14+ si possible.

## Google Play

Déclarer les quatre permissions de lecture dans la section Health Connect de Play Console. Publier la politique de confidentialité contenant les mêmes engagements que l’écran `HealthPrivacyActivity`; la carte du Profil seule ne fournit pas une URL publique de politique. Ne pas déclarer de calories, de lecture historique étendue ou d’arrière-plan : cette version ne les demande pas.

Documentation : https://developer.android.com/health-and-fitness/health-connect/get-started ; https://developer.android.com/health-and-fitness/health-connect/aggregate-data ; https://developer.android.com/health-and-fitness/health-connect/publish
