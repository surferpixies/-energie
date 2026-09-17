(function (root) {
  "use strict";

  // Valeurs prudentes servant surtout à respecter les quantités en grammes.
  // Elles passent avant le catalogue historique afin que les libellés précis
  // comme « fromage blanc » ne soient pas confondus avec « fromage ».
  const corrections = [
    {
      keys: ["pain de seigle", "rye bread"],
      calories: 259,
      protein: 8.5,
      carbs: 48.3,
      fat: 3.3,
      portion: "100 g",
      gramsPerPortion: 100,
      tags: ["féculent"],
    },
    {
      keys: ["guacamole"],
      calories: 150,
      protein: 2,
      carbs: 8,
      fat: 13,
      portion: "100 g",
      gramsPerPortion: 100,
      tags: ["condiment"],
    },
    {
      keys: ["fromage blanc", "fromage frais blanc"],
      calories: 75,
      protein: 7.8,
      carbs: 3.6,
      fat: 3,
      portion: "100 g",
      gramsPerPortion: 100,
      tags: ["produit laitier"],
    },
    {
      keys: ["framboises", "framboise", "raspberries", "raspberry"],
      calories: 52,
      protein: 1.2,
      carbs: 11.9,
      fat: 0.7,
      portion: "100 g",
      gramsPerPortion: 100,
      tags: ["fruit"],
    },
    {
      keys: ["café latté", "cafe latte", "café latte"],
      calories: 190,
      protein: 10,
      carbs: 18,
      fat: 7,
      portion: "grande 355 ml",
      tags: ["boisson"],
    },
    {
      keys: ["café cappuccino", "cafe cappuccino"],
      calories: 120,
      protein: 6,
      carbs: 10,
      fat: 5,
      portion: "355 ml",
      tags: ["boisson"],
    },
    {
      keys: ["café noir", "cafe noir", "cafés", "cafes", "café", "cafe", "black coffee", "coffee"],
      calories: 3,
      protein: 0,
      carbs: 0,
      fat: 0,
      portion: "1 tasse",
      tags: ["boisson"],
    },
  ];

  root.ENERGIE_NUTRITION_CORRECTIONS = Object.freeze(corrections);
  if (typeof module !== "undefined" && module.exports)
    module.exports = corrections;
})(typeof window !== "undefined" ? window : globalThis);
