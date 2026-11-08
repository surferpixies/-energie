# Énergie — pilote d'estimation calorique avec Gemini

Statut : code préparé, **désactivé par défaut**. Ne pas annoncer cette fonction comme active aux testeurs avant validation.

## Architecture

- Texte libre seulement dans cette première étape. La reconnaissance photo existante `analyze-meal-photo` n'est pas modifiée.
- Supabase Edge Function : `supabase/functions/estimate-meal-calories/index.ts`.
- Modèle configurable `GEMINI_CALORIE_MODEL`, valeur par défaut : `gemini-3.5-flash-lite`.
- L'application n'envoie que la description et la langue, jamais le profil, les symptômes ni le journal.
- L'estimation IA est **indicative**, ne prétend pas reprendre des valeurs officielles de restaurants et n'est jamais appliquée sans un clic.
- Une demande explicite est nécessaire et la case de consentement est remise à zéro à chaque ouverture du formulaire.
- Le niveau gratuit Google peut utiliser le contenu des requêtes pour améliorer ses produits. Ne pas utiliser pour des données de santé sensibles sans examiner cette question et le cadre de confidentialité.

## Installation avant activation

1. Dans Supabase SQL Editor, exécuter `supabase-calorie-ai-pilot-2026-11-07.sql`. La fonction SQL réserve atomiquement les quotas (10 appels par utilisateur et par jour, 200 globalement, en UTC).
2. Vérifier la présence de `GEMINI_API_KEY` dans Supabase Edge Function Secrets **sans copier la valeur dans GitHub ni dans la conversation**.
3. Déployer uniquement la nouvelle fonction :
   ```bash
   supabase functions deploy estimate-meal-calories
   ```
   À faire depuis un clone lié au bon projet Supabase. La configuration `supabase/config.toml` désactive le précontrôle JWT de la plateforme parce que l'Edge Function authentifie elle-même le jeton via `auth.getUser`.
4. Vérifier l'authentification, l'erreur sans JWT, la limite de 10 par utilisateur, et un résultat incertain. Faire des essais sur des repas ordinaires sans données de santé.
5. **Seulement une fois ces vérifications réussies**, passer `calorieAiPilotEnabled: true` dans `config.js` et actualiser le paramètre de cache `config.js?v=...` dans `index.html`. Idéalement restreindre l'accès au groupe pilote avant la mise en production.

## Jeux de tests

- `1 pomme moyenne` : ordre de grandeur d'une pomme, jamais 700 kcal.
- `1 poutine régulière` : ne jamais présenter 38 kcal comme estimation plausible.
- `une brochette de poulet avec riz de chez St-Hubert` : mentionner que les portions et les sauces sont inconnues; aucune valeur officielle prétendue.
- `2 McDouble de McDonald's` : ne pas prétendre consulter le menu officiel.
- `une assiette de quelque chose` : incertitude élevée ou abstention.
- Repas favori avec calories déjà renseignées : ne pas appeler l'IA.
- Calories masquées ou saisie guidée : panneau IA absent.
- Échec réseau/quota : préserver la description, les photos et la saisie manuelle.

## Limites connues

- Le modèle estime actuellement directement le total calorique et n'est pas relié automatiquement aux correspondances FCÉN/Ciqual : ce sera une étape supplémentaire après validation des essais.
- Le garde-fou vérifie des bornes générales mais ne prouve pas l'exactitude nutritionnelle : contrôle humain et tests de plausibilité requis.
- Pour les images, il faudra décider s'il faut réutiliser l'analyse photo existante ou étendre le nouveau moteur, sans appel inutile.
- Un appel qui échoue après réservation compte dans le quota pilote : comportement volontairement conservateur.
