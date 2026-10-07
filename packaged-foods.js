/* Références de produits : étiquettes du fabricant, distinctes du FCÉN/Ciqual. */
(function (root) {
  'use strict';
  const base = root.ENERGIE_CNF_SEARCH;
  if (!base) return;
  const id = 'PRODUCT:st-hubert-chicken-strips-600g';
  const name = 'Lanières de poitrine de poulet panées St-Hubert (600 g)';
  const sourceUrl = 'https://www.st-hubert.com/fr/produits-epicerie/poulet/lanieres-de-poulet-surgeles.html';
  // Étiquette officielle : 2 lanières (70 g), sans sauce.
  const label = { calories:160, protein:8, carbs:10, fat:10, fiber:0, sugars:0, sodium:270 };
  const normalize = value => String(value || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/œ/g, 'oe').replace(/[^a-z0-9]+/g, ' ').trim();
  function matches(text, guided = false) {
    const query = normalize(base.stripQuantity(text));
    if (!/\b(?:st|saint) hubert\b/.test(query)) return false;
    if (!guided && !/\b(?:poulet|chicken|filets?|fillets?|lanieres?|strips?)\b/.test(query)) return false;
    // Une autre préparation ou un ingrédient écrit ne doit pas disparaître.
    return query.split(/\s+/).every(word =>
      ['st','saint','hubert','poulet','chicken','filet','filets','fillet','fillets','laniere','lanieres','strip','strips','poitrine','breast','pane','panes','panee','panees','breaded','croustillant','croustillants','crispy','surgele','surgeles','surgelee','surgelees','frozen','cuit','cuite','cuits','cuites','cooked','g','600','de','du','des'].includes(word));
  }
  function publicRow() {
    return { id, nameFr:name, nameEn:'St-Hubert breaded chicken breast strips (600 g)',
      source:'product-label', sourceUrl,
      portions:[{id:'one-strip',grams:35,labelFr:'1 lanière',labelEn:'1 strip'},
        {id:'label-serving',grams:70,labelFr:'2 lanières',labelEn:'2 strips'}] };
  }
  function nutritionForGrams(foodId, grams) {
    if (foodId !== id) return base.nutritionForGrams(foodId, grams);
    const amount = Number(grams);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return {...Object.fromEntries(Object.entries(label).map(([key,value])=>[key,value*amount/70])),
      source:'product-label',nutritionSource:'product-label',confidence:'high',estimated:true,
      basis:`${amount} g · étiquette St-Hubert · 160 kcal pour 2 lanières (70 g)`,
      cnfFoodId:id,cnfNameFr:name,sourceUrl};
  }
  function find(text) {
    if (!matches(text)) return null;
    const kind = base.quantityKind(text);
    if (kind && kind !== 'g') return null;
    const grams = kind === 'g' ? 100 : 70;
    return {...nutritionForGrams(id, grams),keys:[name],cnfCatalogMatch:true,
      portion:kind === 'g'?'100 g':'2 filets',gramsPerPortion:grams};
  }
  root.ENERGIE_CNF_SEARCH = Object.freeze({...base,
    find:text=>find(text)||base.find(text),
    search:(text,limit=12)=>matches(text,true)?[publicRow()]:base.search(text,limit),
    getById:foodId=>foodId===id?publicRow():base.getById(foodId),
    nutritionForGrams,
    isCandidateAllowed:(text,candidate,options)=>/\b(?:st|saint) hubert\b/.test(normalize(text))
      ? candidate===name && matches(text, !!options?.allowPreparationChoice)
      : base.isCandidateAllowed(text,candidate,options),
  });
})(typeof window !== 'undefined' ? window : globalThis);
