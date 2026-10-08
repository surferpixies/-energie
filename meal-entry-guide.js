/* Guide de saisie du repas : mêmes explications sur le web et dans Capacitor. */
(function (root) {
  'use strict';
  const button = document.getElementById('openMealEntryGuide');
  if (!button) return;
  const english = root.ENERGIE_LOCALE === 'en';
  const france = root.ENERGIE_LOCALE === 'fr-FR';
  const source = france ? 'Ciqual' : 'FCÉN';
  const sourceDescription = france
    ? 'Ciqual 2025 (Anses, France), avec le FCÉN de Santé Canada en secours'
    : 'le FCÉN de Santé Canada, avec Ciqual 2025 (Anses, France) en secours';
  const title = english ? 'Guide to entering my meal' : 'Guide pour entrer mon repas';
  button.textContent = title;
  const dialog = document.createElement('dialog');
  dialog.id = 'mealEntryGuideDialog';
  dialog.className = 'meal-entry-guide-dialog';
  dialog.setAttribute('aria-labelledby', 'mealEntryGuideTitle');
  dialog.setAttribute('data-i18n-skip', '');
  dialog.innerHTML = `<section class="dialog-card meal-entry-guide-card">
    <div class="dialog-header"><div><p class="eyebrow">${english ? 'Entering a meal' : 'Inscrire un repas'}</p><h2 id="mealEntryGuideTitle">${title}</h2></div><button type="button" class="icon-button" data-close-meal-guide aria-label="${english ? 'Close' : 'Fermer'}">✕</button></div>
    ${english ? `
    <p>You can write your meal, choose foods from the guided search, add a photo or scan a product. You do not need to use every method.</p>
    <section><h3>✍️ Write your meal</h3><p>Write one food per line. Put the quantity before the food when you know it.</p>
    <pre aria-label="Example meal">150 g chicken\n100 g carrots\n2 apples</pre>
    <p>Meat is treated as cooked unless you write “raw” or “tartare”. For pasta and rice, specify cooked or dry, for example <strong>120 g cooked spaghetti</strong>.</p></section>
    <details open><summary>How to enter quantities</summary><dl>
      <dt>Weight: g or kg</dt><dd><strong>150 g chicken</strong>, <strong>100 g carrots</strong>. Use the weight of the food you ate. If weighed before cooking, specify “raw”. For several meat or fish fillets, enter their total weight. A known branded product can use its label portion; for example, 4 St-Hubert breaded chicken fillets.</dd>
      <dt>Volume: cups or ml</dt><dd><strong>1 cup broccoli</strong>. A cup is 250 ml of volume, not 250 g. This works when the food has a documented volume portion. If no estimate appears, use grams or guided entry.</dd>
      <dt>Half or quarter portions</dt><dd>Write <strong>1/2</strong> for one half and <strong>1/4</strong> for one quarter, with the unit: <strong>1/2 cup cottage cheese</strong>. Plain cottage cheese without a specified fat content uses the 2% reference.</dd>
      <dt>Number of foods</dt><dd><strong>1 apple</strong> or <strong>2 apples</strong> uses a reference medium apple. Size affects the estimate. Counts are supported only when a matching unit portion exists; use grams or guided entry for other fruits and vegetables.</dd>
    </dl><pre aria-label="Example with half a cup">lettuce\ncucumber\n1/2 cup cottage cheese</pre><p class="muted small">Without a quantity, a reference portion may be used. It does not measure what you actually ate. Quantities make the estimate more useful.</p></details>
    <details><summary>🔎 Guided entry with ${source}</summary><p>Search for a food, choose the matching preparation, enter its quantity and unit, then add it. Repeat for the other foods and finish the entry.</p><p>Canadian Nutrient File (Health Canada) is the first reference, with Ciqual 2025 (Anses, France) as fallback. Choose units offered for the selected food.</p></details>
    <details><summary>📷 Photo</summary><p>A photo records your meal. The analysis starts only when you request it. Use “Analyze with AI” if you want a suggested description, then check the foods and quantities before using it.</p></details>
    <details><summary>▥ Scan a product</summary><p>Use Scanner for a packaged product with a barcode. Check the product and nutrition label, then enter the amount you ate. Label values per 100 g do not mean you ate 100 g.</p></details>
    <details data-calorie-ui><summary>If no calories appear</summary><p>Check the food name, quantity and preparation. Try guided entry to select a precise reference. For a missing product, use its barcode or enter the calories from its label.</p><p>Calories are estimates. A meal with an unresolved food needs clarification before a complete automatic total can be shown.</p></details>
    ` : `
    <p>Tu peux écrire ton repas, choisir les aliments dans la saisie guidée, ajouter une photo ou scanner un produit. Pas besoin de tout utiliser.</p>
    <section><h3>✍️ Écrire ton repas</h3><p>Inscris un aliment par ligne. Place la quantité avant l’aliment quand tu la connais.</p>
    <pre aria-label="Exemple de repas">150 g poulet\n100 g carottes\n2 pommes</pre>
    <p>La viande est considérée cuite, sauf si tu écris « cru/crue » ou « tartare ». Pour les pâtes et le riz, précise cuit ou sec, par exemple <strong>120 g spaghettis cuits</strong>.</p></section>
    <details open><summary>Comment écrire les quantités ?</summary><dl>
      <dt>Poids : g ou kg</dt><dd><strong>150 g poulet</strong>, <strong>100 g carottes</strong>. Utilise le poids de l’aliment consommé. Si tu le pèses avant cuisson, précise « cru ». Pour plusieurs filets de viande ou de poisson, indique leur poids total. Un produit de marque reconnu peut utiliser la portion de son étiquette, par exemple « 4 filets de poulet panés St-Hubert ».</dd>
      <dt>Volume : tasses ou ml</dt><dd><strong>1 tasse brocoli</strong>. Une tasse représente 250 ml de volume, pas 250 g. Ce calcul fonctionne si une portion en volume est documentée pour l’aliment. Si aucune estimation n’apparaît, utilise les grammes ou la saisie guidée.</dd>
      <dt>Une demie ou un quart</dt><dd>Écris <strong>1/2</strong> pour une demie et <strong>1/4</strong> pour un quart, suivi de l’unité : <strong>1/2 tasse cottage</strong>. Le cottage sans précision utilise une référence nature à 2 % de matières grasses.</dd>
      <dt>Nombre d’aliments</dt><dd><strong>1 pomme</strong> ou <strong>2 pommes</strong> utilise une pomme moyenne de référence. La taille influence l’estimation. Le nombre fonctionne seulement si une portion unitaire correspondante est disponible; pour les autres fruits et légumes, utilise les grammes ou la saisie guidée.</dd>
    </dl><pre aria-label="Exemple avec une demi-tasse">laitue\nconcombres\n1/2 tasse cottage</pre><p class="muted small">Sans quantité, une portion de référence peut être utilisée. Elle ne mesure pas ce que tu as réellement mangé. Ajouter une quantité rend l’estimation plus utile.</p></details>
    <details><summary>🔎 Saisie guidée avec ${source}</summary><p>Recherche un aliment, choisis la fiche et la préparation qui correspondent à ton repas, puis saisis la quantité et l’unité. Ajoute les autres aliments et termine la saisie.</p><p>La recherche utilise ${sourceDescription}. Choisis parmi les unités proposées pour l’aliment sélectionné.</p></details>
    <details><summary>📷 Photo</summary><p>La photo garde une trace de ton repas. L’analyse démarre seulement à ta demande. Utilise « Analyser avec l’IA » si tu souhaites une description suggérée, puis vérifie les aliments et les quantités avant de l’utiliser.</p></details>
    <details><summary>▥ Scanner un produit</summary><p>Utilise Scanner pour un produit emballé avec un code-barres. Vérifie le produit et ses valeurs nutritionnelles, puis indique la quantité consommée. Une étiquette « pour 100 g » ne signifie pas que tu as mangé 100 g.</p></details>
    <details data-calorie-ui><summary>Si les calories ne s’affichent pas</summary><p>Vérifie le nom de l’aliment, la quantité et la préparation. Essaie la saisie guidée pour choisir une référence précise. Pour un produit absent, utilise son code-barres ou inscris les calories de son étiquette.</p><p>Les calories restent des estimations. Un aliment à préciser dans le repas peut empêcher l’affichage d’un total automatique complet.</p></details>
    `}
    <button type="button" class="primary" data-close-meal-guide>${english ? 'Got it' : 'J’ai compris'}</button>
  </section>`;
  document.body.append(dialog);
  button.addEventListener('click', () => dialog.showModal());
  dialog.querySelectorAll('[data-close-meal-guide]').forEach(control =>
    control.addEventListener('click', () => dialog.close()));
})(window);
