(function(root){
  "use strict";

  const fromOverrides = (Array.isArray(root.ENERGIE_CNF_OVERRIDES)
    ? root.ENERGIE_CNF_OVERRIDES
    : [])
    .map((food) => {
      const grams = Number(food?.gramsPerPortion);
      if (!food?.cnfFoodId || !Number.isFinite(grams) || grams <= 0) return null;
      const per100 = (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? Math.round((n * 100 / grams) * 1000) / 1000 : null;
      };
      return [
        String(food.cnfFoodId),
        String(food.cnfNameFr || food.keys?.[0] || ""),
        String(food.cnfNameEn || ""),
        {
          calories: per100(food.calories),
          protein: per100(food.protein),
          carbs: per100(food.carbs),
          fat: per100(food.fat),
          fiber: per100(food.fiber),
          sugars: per100(food.sugars),
          sodium: per100(food.sodium),
        },
        [[grams, String(food.portion || "1 portion"), String(food.portion || "1 serving")]],
      ];
    })
    .filter(Boolean);

  // Santé Canada FCÉN — aubergine crue. Cette entrée permet la recherche
  // guidée même avant que le catalogue web complet 2026 soit régénéré.
  const supplements = [
    [
      "2088",
      "Aubergine, crue",
      "Eggplant (aubergine, brinjal), raw",
      {
        calories: 25,
        protein: 0.98,
        carbs: 5.88,
        fat: 0.18,
        fiber: 3,
        sugars: 3.53,
        sodium: 2,
      },
      [
        [100, "100 g", "100 g"],
        [34.7, "100 ml en cubes", "100 ml cubes"],
        [69.3, "200 ml en morceaux", "200 ml pieces"],
        [86.6, "250 ml en cubes", "250 ml cubes"],
        [458, "1 aubergine pelée", "1 eggplant peeled"],
        [548, "1 aubergine non pelée", "1 eggplant unpeeled"],
        [43.3, "125 ml en cubes", "125 ml cubes"],
      ],
    ],
  ];

  const byId = new Map();
  [...fromOverrides, ...supplements].forEach((row) => {
    if (row?.[0]) byId.set(String(row[0]), row);
  });

  root.ENERGIE_CNF_CATALOG = Object.freeze([...byId.values()]);
  root.ENERGIE_CNF_CATALOG_INFO = Object.freeze({
    source: "Santé Canada / Health Canada",
    mode: "verified-web-subset",
    count: byId.size,
  });
})(typeof window !== "undefined" ? window : globalThis);
