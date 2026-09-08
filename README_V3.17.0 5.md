# Énergie 3.17.0 — Observations globales

Cette version conserve le ressenti après chaque repas et ajoute un second parcours indépendant dans le Journal : **Observations globales**.

Une observation globale peut contenir :

- la date et l’heure auxquelles elle a été remarquée;
- une intensité de 1 à 5;
- une durée, incluant « toujours présente » et « plusieurs jours »;
- un ou plusieurs symptômes ou états tirés du vocabulaire existant;
- des contextes possibles : alimentation, sommeil, stress, activité, environnement ou inconnu;
- zéro, un ou plusieurs repas des 72 heures précédentes, à titre de pistes uniquement;
- une note et une photo facultatives.

L’interface rappelle explicitement qu’un repas sélectionné n’est pas une cause démontrée. Les données sont incluses dans l’export JSON de l’application. La photo facultative demeure locale à l’appareil afin d’éviter de la transférer dans le journal quotidien sans consentement ou stockage dédié.

## Compatibilité

Les données existantes sont migrées automatiquement vers la version 26 du stockage local. Les repas et leurs ressentis antérieurs ne sont pas modifiés.
