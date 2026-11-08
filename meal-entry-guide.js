/* Guide compact de saisie libre : Web et Capacitor. */
(function (root) {
  'use strict';
  const button = document.getElementById('openMealEntryGuide');
  if (!button) return;
  const english = root.ENERGIE_LOCALE === 'en';
  const title = english ? 'Guide to entering my meal' : 'Guide pour entrer mon repas';
  button.innerHTML = `<span class="meal-guide-full-label">${title}</span><span class="meal-guide-short-label">${english ? 'Entry guide' : 'Guide de saisie'}</span>`;
  button.setAttribute('aria-label', title);

  const dialog = document.createElement('dialog');
  dialog.id = 'mealEntryGuideDialog';
  dialog.className = 'meal-entry-guide-dialog';
  dialog.setAttribute('aria-labelledby', 'mealEntryGuideTitle');
  dialog.setAttribute('data-i18n-skip', '');

  const fr = `
    <p>Énergie te permet de noter un repas à ta façon : écris une description, reprends un favori, importe une recette ou ajoute une photo. Les calories restent facultatives.</p>
    <section><h3>✍️ Décrire mon repas</h3>
      <p>Écris simplement ce que tu as mangé, en une phrase ou sur plusieurs lignes. Si tu connais les quantités, ajoute-les pour aider à l’estimation.</p>
      <pre aria-label="Exemple de repas">150 g de poulet\n100 g de carottes\n2 pommes</pre>
      <p>Tu peux préciser la préparation ou les accompagnements : cuit, frit, huile, sauce, etc. Ces détails sont utiles, mais jamais obligatoires.</p>
    </section>
    <details><summary>🥄 Comment préciser les quantités ?</summary>
      <p>Utilise les unités que tu connais : <strong>150 g de poulet</strong>, <strong>1 tasse de brocoli</strong>, <strong>1/2 tasse de cottage</strong> ou <strong>2 pommes</strong>.</p>
      <p>Tu ne connais pas les quantités exactes ? Décris simplement ta portion, par exemple « un bol de chili » ou « une petite assiette de pâtes ». Une estimation restera approximative.</p>
    </details>
    <details><summary>🔗 Importer une recette</summary>
      <p>Dans la saisie libre, choisis <strong>Importer une recette</strong>, colle le lien d’un site compatible et vérifie les ingrédients ainsi que le nombre de portions.</p>
      <p>Énergie peut reprendre la recette et la portion consommée. Les calories ne sont pas toujours publiées sur le site d’origine; tu peux demander une estimation avec l’IA si tu le souhaites.</p>
    </details>
    <details><summary>🍽️ Au restaurant</summary>
      <p>Indique le restaurant, le nom du plat et, si possible, la portion : par exemple « 2 McDouble chez McDonald’s » ou « une brochette de poulet avec riz chez St-Hubert ».</p>
      <p>Le bouton d’estimation cherche d’abord une valeur publiée sur le Web, puis utilise l’IA si aucune valeur exploitable n’est trouvée.</p>
    </details>
    <details><summary>📷 Photo et scanner</summary>
      <p>Tu peux ajouter une photo du repas. Une analyse IA de la photo peut suggérer une description, seulement si tu la demandes. Vérifie toujours la description proposée.</p>
      <p>Pour un produit emballé, utilise le scanner de code-barres et vérifie la portion indiquée sur l’étiquette.</p>
    </details>
    <details data-calorie-ui><summary>🔥 Estimer les calories</summary>
      <p>Si tu as choisi de suivre tes calories, utilise <strong>✨ Estimer avec l’IA</strong> à côté du champ des calories. Énergie recherche d’abord une information publiée sur le Web, puis propose une estimation IA au besoin.</p>
      <p>Le chiffre est inscrit directement dans le champ et tu peux le modifier. Les résultats sont approximatifs, surtout si les portions, huiles ou sauces sont inconnues. La recherche ne démarre que lorsque tu appuies sur le bouton et que tu as autorisé l’envoi de la description à Google Gemini dans ton Profil.</p>
    </details>`;

  const en = `
    <p>Énergie lets you log a meal your way: write a description, reuse a favourite, import a recipe or add a photo. Calories are optional.</p>
    <section><h3>✍️ Describe your meal</h3>
      <p>Write naturally, in a sentence or on separate lines. Add portions when you know them to improve estimates.</p>
      <pre aria-label="Example meal">150 g chicken\n100 g carrots\n2 apples</pre>
      <p>Preparation details such as cooked, fried, oil or sauce are helpful, but optional.</p>
    </section>
    <details><summary>🥄 How do I specify amounts?</summary>
      <p>Use familiar units: <strong>150 g chicken</strong>, <strong>1 cup broccoli</strong>, <strong>1/2 cup cottage cheese</strong> or <strong>2 apples</strong>.</p>
      <p>Don't know exact quantities? Describe the serving, such as “a bowl of chili”. Estimates remain approximate.</p>
    </details>
    <details><summary>🔗 Import a recipe</summary>
      <p>Select <strong>Import a recipe</strong> in free entry, paste a supported recipe link and review the ingredients and number of servings.</p>
      <p>Recipes do not always publish calorie counts; you can request an AI estimate if needed.</p>
    </details>
    <details><summary>🍽️ Eating at a restaurant</summary>
      <p>Include the restaurant, dish and portion, for example “2 McDoubles from McDonald's”.</p>
      <p>The estimate button searches for published values first and uses AI if no usable value is found.</p>
    </details>
    <details><summary>📷 Photos and barcode scanning</summary>
      <p>Add a photo and optionally request an AI-generated description. Review it before using it. For packaged foods, scan the barcode and check the label serving size.</p>
    </details>
    <details data-calorie-ui><summary>🔥 Estimating calories</summary>
      <p>When calorie tracking is enabled, tap <strong>✨ Estimate with AI</strong> next to the calorie field. Énergie looks for a published Web value first, then uses AI when needed.</p>
      <p>Results fill the editable calorie field automatically. They remain approximate. Searches run only when you request them and have authorized sharing the meal description with Google Gemini in Profile.</p>
    </details>`;

  dialog.innerHTML = `<section class="dialog-card meal-entry-guide-card">
    <div class="dialog-header"><div><p class="eyebrow">${english ? 'Entering a meal' : 'Inscrire un repas'}</p><h2 id="mealEntryGuideTitle">${title}</h2></div><button type="button" class="icon-button" data-close-meal-guide aria-label="${english ? 'Close' : 'Fermer'}">✕</button></div>
    ${english ? en : fr}
    <button type="button" class="primary" data-close-meal-guide>${english ? 'Got it' : 'J’ai compris'}</button>
  </section>`;
  document.body.append(dialog);
  button.addEventListener('click', () => dialog.showModal());
  dialog.querySelectorAll('[data-close-meal-guide]').forEach(control =>
    control.addEventListener('click', () => dialog.close()));
})(window);
