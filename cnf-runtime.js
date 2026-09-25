(function (root) {
  "use strict";

  // Généré depuis data/cnf-2026/mapping-reviewed.json.
  // Seules les correspondances verified=true avec une portion en grammes sont actives.
  const mappings = [
  {
    "energieAlias": "banane",
    "aliases": [
      "banane",
      "banana"
    ],
    "cnfFoodId": "1704",
    "cnfNameFr": "Banane, crue",
    "cnfNameEn": "Banana, raw",
    "portion": "1 moyenne",
    "gramsPerPortion": 118,
    "nutritionPer100g": {
      "protein": 1.09,
      "fat": 0.33,
      "carbs": 22.84,
      "calories": 89,
      "sugars": 12.23,
      "fiber": 1.74,
      "calcium": 5,
      "iron": 0.26,
      "potassium": 358,
      "sodium": 1
    }
  },
  {
    "energieAlias": "clémentine",
    "aliases": [
      "clémentine",
      "clementine",
      "mandarine"
    ],
    "cnfFoodId": "5956",
    "cnfNameFr": "Clémentine, crue",
    "cnfNameEn": "Clementine, raw",
    "portion": "1 fruit",
    "gramsPerPortion": 74,
    "nutritionPer100g": {
      "protein": 0.85,
      "fat": 0.15,
      "carbs": 12.02,
      "calories": 47,
      "sugars": 9.19,
      "fiber": 1.7,
      "calcium": 30,
      "iron": 0.14,
      "potassium": 177,
      "sodium": 1
    }
  },
  {
    "energieAlias": "pêche",
    "aliases": [
      "pêche",
      "peche",
      "peach"
    ],
    "cnfFoodId": "1728",
    "cnfNameFr": "Pêche, crue",
    "cnfNameEn": "Peach, raw",
    "portion": "1 moyenne",
    "gramsPerPortion": 150,
    "nutritionPer100g": {
      "protein": 0.91,
      "fat": 0.25,
      "carbs": 9.54,
      "calories": 39,
      "sugars": 8.39,
      "fiber": 1.93,
      "calcium": 6,
      "iron": 0.25,
      "potassium": 190,
      "sodium": 0
    }
  },
  {
    "energieAlias": "nectarine",
    "aliases": [
      "nectarine"
    ],
    "cnfFoodId": "1611",
    "cnfNameFr": "Nectarine, crue",
    "cnfNameEn": "Nectarine, raw",
    "portion": "1 moyenne",
    "gramsPerPortion": 136,
    "nutritionPer100g": {
      "protein": 1.06,
      "fat": 0.32,
      "carbs": 10.55,
      "calories": 44,
      "sugars": 7.89,
      "fiber": 1.7,
      "calcium": 6,
      "iron": 0.28,
      "potassium": 201,
      "sodium": 0
    }
  },
  {
    "energieAlias": "fraises",
    "aliases": [
      "fraises",
      "fraise",
      "strawberries"
    ],
    "cnfFoodId": "1749",
    "cnfNameFr": "Fraise, crue",
    "cnfNameEn": "Strawberry, raw",
    "portion": "1 tasse",
    "gramsPerPortion": 160.609,
    "nutritionPer100g": {
      "protein": 0.67,
      "fat": 0.3,
      "carbs": 7.68,
      "calories": 33,
      "sugars": 4.89,
      "fiber": 2.24,
      "calcium": 16,
      "iron": 0.41,
      "potassium": 153,
      "sodium": 1
    }
  },
  {
    "energieAlias": "mûres",
    "aliases": [
      "mûres",
      "mures",
      "blackberries"
    ],
    "cnfFoodId": "1515",
    "cnfNameFr": "Mûre, crue",
    "cnfNameEn": "Blackberry, raw",
    "portion": "1 tasse",
    "gramsPerPortion": 152.156,
    "nutritionPer100g": {
      "protein": 1.39,
      "fat": 0.49,
      "carbs": 9.61,
      "calories": 43,
      "sugars": 4.88,
      "fiber": 5.3,
      "calcium": 29,
      "iron": 0.62,
      "potassium": 162,
      "sodium": 1
    }
  },
  {
    "energieAlias": "ananas",
    "aliases": [
      "ananas",
      "pineapple"
    ],
    "cnfFoodId": "1734",
    "cnfNameFr": "Ananas, cru",
    "cnfNameEn": "Pineapple, raw",
    "portion": "1 tasse",
    "gramsPerPortion": 174.354,
    "nutritionPer100g": {
      "protein": 0.54,
      "fat": 0.12,
      "carbs": 13.12,
      "calories": 50,
      "sugars": 9.85,
      "fiber": 1.4,
      "calcium": 13,
      "iron": 0.29,
      "potassium": 109,
      "sodium": 1
    }
  },
  {
    "energieAlias": "mangue",
    "aliases": [
      "mangue",
      "mango"
    ],
    "cnfFoodId": "1603",
    "cnfNameFr": "Mangue, crue",
    "cnfNameEn": "Mango, raw",
    "portion": "1 tasse",
    "gramsPerPortion": 174.345,
    "nutritionPer100g": {
      "protein": 0.82,
      "fat": 0.38,
      "carbs": 14.98,
      "calories": 60,
      "sugars": 13.66,
      "fiber": 1.6,
      "calcium": 11,
      "iron": 0.16,
      "potassium": 168,
      "sodium": 1
    }
  },
  {
    "energieAlias": "papaye",
    "aliases": [
      "papaye",
      "papaya"
    ],
    "cnfFoodId": "1628",
    "cnfNameFr": "Papaye, crue",
    "cnfNameEn": "Papaya, raw",
    "portion": "1 tasse",
    "gramsPerPortion": 147.929,
    "nutritionPer100g": {
      "protein": 0.47,
      "fat": 0.26,
      "carbs": 10.82,
      "calories": 43,
      "sugars": 7.82,
      "fiber": 1.7,
      "calcium": 20,
      "iron": 0.25,
      "potassium": 182,
      "sodium": 8
    }
  },
  {
    "energieAlias": "melon miel",
    "aliases": [
      "melon miel",
      "honeydew"
    ],
    "cnfFoodId": "1605",
    "cnfNameFr": "Melon, miel (honeydew), cru",
    "cnfNameEn": "Melon, honeydew, raw",
    "portion": "1 tasse",
    "gramsPerPortion": 179.628,
    "nutritionPer100g": {
      "protein": 0.54,
      "fat": 0.14,
      "carbs": 9.09,
      "calories": 36,
      "sugars": 8.12,
      "fiber": 0.8,
      "calcium": 6,
      "iron": 0.17,
      "potassium": 228,
      "sodium": 18
    }
  },
  {
    "energieAlias": "melon d eau",
    "aliases": [
      "melon d eau",
      "pastèque",
      "pasteque",
      "watermelon"
    ],
    "cnfFoodId": "1691",
    "cnfNameFr": "Melon d'eau (pasteque), cru",
    "cnfNameEn": "Watermelon, raw",
    "portion": "1 tasse",
    "gramsPerPortion": 160.609,
    "nutritionPer100g": {
      "protein": 0.61,
      "fat": 0.15,
      "carbs": 7.55,
      "calories": 30,
      "sugars": 6.2,
      "fiber": 0.4,
      "calcium": 7,
      "iron": 0.24,
      "potassium": 112,
      "sodium": 1
    }
  },
  {
    "energieAlias": "prune",
    "aliases": [
      "prune",
      "plum"
    ],
    "cnfFoodId": "1740",
    "cnfNameFr": "Prune, crue",
    "cnfNameEn": "Plum, raw",
    "portion": "1 fruit",
    "gramsPerPortion": 66,
    "nutritionPer100g": {
      "protein": 0.7,
      "fat": 0.28,
      "carbs": 11.42,
      "calories": 46,
      "sugars": 9.92,
      "fiber": 1.6,
      "calcium": 6,
      "iron": 0.17,
      "potassium": 157,
      "sodium": 0
    }
  },
  {
    "energieAlias": "abricot",
    "aliases": [
      "abricot",
      "apricot"
    ],
    "cnfFoodId": "1498",
    "cnfNameFr": "Abricot, cru",
    "cnfNameEn": "Apricot, raw",
    "portion": "1 fruit",
    "gramsPerPortion": 35,
    "nutritionPer100g": {
      "protein": 1.4,
      "fat": 0.39,
      "carbs": 11.12,
      "calories": 48,
      "sugars": 9.24,
      "fiber": 2,
      "calcium": 13,
      "iron": 0.39,
      "potassium": 259,
      "sodium": 1
    }
  },
  {
    "energieAlias": "dattes",
    "aliases": [
      "dattes",
      "datte",
      "dates"
    ],
    "cnfFoodId": "1710",
    "cnfNameFr": "Datte, domestique, naturelle et séchée",
    "cnfNameEn": "Date, domestic, natural and dry",
    "portion": "3 dattes",
    "gramsPerPortion": 24.9,
    "nutritionPer100g": {
      "protein": 2.45,
      "fat": 0.39,
      "carbs": 75.03,
      "calories": 282,
      "sugars": 63.35,
      "fiber": 8,
      "calcium": 39,
      "iron": 1.02,
      "potassium": 656,
      "sodium": 2
    }
  },
  {
    "energieAlias": "grenade",
    "aliases": [
      "grenade",
      "pomegranate"
    ],
    "cnfFoodId": "1667",
    "cnfNameFr": "Grenade, crue",
    "cnfNameEn": "Pomegranate, raw",
    "portion": "1 tasse grains",
    "gramsPerPortion": 183.864,
    "nutritionPer100g": {
      "protein": 1.67,
      "fat": 1.17,
      "carbs": 18.7,
      "calories": 83,
      "sugars": 13.67,
      "fiber": 4,
      "calcium": 10,
      "iron": 0.3,
      "potassium": 236,
      "sodium": 3
    }
  },
  {
    "energieAlias": "fruit de la passion",
    "aliases": [
      "fruit de la passion",
      "passion fruit"
    ],
    "cnfFoodId": "1630",
    "cnfNameFr": "Grenadille (fruit de la passion), crue",
    "cnfNameEn": "Passion fruit, purple, raw",
    "portion": "3 fruits",
    "gramsPerPortion": 54,
    "nutritionPer100g": {
      "protein": 2.2,
      "fat": 0.7,
      "carbs": 23.38,
      "calories": 97,
      "sugars": 11.2,
      "fiber": 10.4,
      "calcium": 12,
      "iron": 1.6,
      "potassium": 348,
      "sodium": 28
    }
  },
  {
    "energieAlias": "litchi",
    "aliases": [
      "litchi",
      "lychee"
    ],
    "cnfFoodId": "1596",
    "cnfNameFr": "Litchi, cru",
    "cnfNameEn": "Lychee (litchi), raw",
    "portion": "1 tasse",
    "gramsPerPortion": 200.761,
    "nutritionPer100g": {
      "protein": 0.83,
      "fat": 0.44,
      "carbs": 16.53,
      "calories": 66,
      "sugars": 15.23,
      "fiber": 1.3,
      "calcium": 5,
      "iron": 0.31,
      "potassium": 171,
      "sodium": 1
    }
  },
  {
    "energieAlias": "poivron rouge",
    "aliases": [
      "poivron rouge",
      "red pepper"
    ],
    "cnfFoodId": "2484",
    "cnfNameFr": "Poivron rouge, cru",
    "cnfNameEn": "Pepper, sweet, red, raw",
    "portion": "1 moyen",
    "gramsPerPortion": 119,
    "nutritionPer100g": {
      "protein": 0.99,
      "fat": 0.3,
      "carbs": 6.03,
      "calories": 26,
      "sugars": 4.2,
      "fiber": 1.41,
      "calcium": 7,
      "iron": 0.43,
      "potassium": 211,
      "sodium": 4
    }
  },
  {
    "energieAlias": "poivron vert",
    "aliases": [
      "poivron vert",
      "green pepper"
    ],
    "cnfFoodId": "2413",
    "cnfNameFr": "Poivron vert, cru",
    "cnfNameEn": "Pepper, sweet, green, raw",
    "portion": "1 moyen",
    "gramsPerPortion": 164,
    "nutritionPer100g": {
      "protein": 0.86,
      "fat": 0.17,
      "carbs": 4.64,
      "calories": 20,
      "sugars": 2.4,
      "fiber": 1.41,
      "calcium": 10,
      "iron": 0.34,
      "potassium": 175,
      "sodium": 3
    }
  },
  {
    "energieAlias": "laitue romaine",
    "aliases": [
      "laitue romaine",
      "romaine"
    ],
    "cnfFoodId": "2116",
    "cnfNameFr": "Laitue, romaine",
    "cnfNameEn": "Lettuce, cos or romaine",
    "portion": "2 tasses",
    "gramsPerPortion": 118.344,
    "nutritionPer100g": {
      "protein": 1.23,
      "fat": 0.3,
      "carbs": 3.29,
      "calories": 17,
      "sugars": 1.19,
      "fiber": 2.1,
      "calcium": 33,
      "iron": 0.97,
      "potassium": 247,
      "sodium": 8
    }
  },
  {
    "energieAlias": "laitue",
    "aliases": [
      "laitue",
      "lettuce"
    ],
    "cnfFoodId": "2398",
    "cnfNameFr": "Laitue, iceberg (pommée)",
    "cnfNameEn": "Lettuce, iceberg",
    "portion": "2 tasses",
    "gramsPerPortion": 116.236,
    "nutritionPer100g": {
      "protein": 0.9,
      "fat": 0.14,
      "carbs": 2.97,
      "calories": 14,
      "sugars": 1.97,
      "fiber": 1.2,
      "calcium": 18,
      "iron": 0.41,
      "potassium": 141,
      "sodium": 10
    }
  },
  {
    "energieAlias": "asperges",
    "aliases": [
      "asperges",
      "asperge",
      "asparagus"
    ],
    "cnfFoodId": "1991",
    "cnfNameFr": "Asperge, bouillie, égouttée",
    "cnfNameEn": "Asparagus, boiled, drained",
    "portion": "1 tasse",
    "gramsPerPortion": 190.194,
    "nutritionPer100g": {
      "protein": 2.4,
      "fat": 0.22,
      "carbs": 4.11,
      "calories": 22,
      "sugars": 1.3,
      "fiber": 2,
      "calcium": 23,
      "iron": 0.91,
      "potassium": 224,
      "sodium": 14
    }
  },
  {
    "energieAlias": "betterave",
    "aliases": [
      "betterave",
      "beet"
    ],
    "cnfFoodId": "2501",
    "cnfNameFr": "Betteraves, bouillies, égouttées",
    "cnfNameEn": "Beets, boiled, drained",
    "portion": "1 tasse",
    "gramsPerPortion": 179.628,
    "nutritionPer100g": {
      "protein": 1.68,
      "fat": 0.18,
      "carbs": 9.96,
      "calories": 44,
      "sugars": 7.96,
      "fiber": 2.02,
      "calcium": 16,
      "iron": 0.79,
      "potassium": 305,
      "sodium": 77
    }
  },
  {
    "energieAlias": "chou de bruxelles",
    "aliases": [
      "chou de bruxelles",
      "brussels sprouts"
    ],
    "cnfFoodId": "2378",
    "cnfNameFr": "Choux de Bruxelles, crus",
    "cnfNameEn": "Brussels sprouts, raw",
    "portion": "1 tasse",
    "gramsPerPortion": 92.984,
    "nutritionPer100g": {
      "protein": 3.38,
      "fat": 0.3,
      "carbs": 8.95,
      "calories": 43,
      "sugars": 2.2,
      "fiber": 4.12,
      "calcium": 42,
      "iron": 1.4,
      "potassium": 389,
      "sodium": 25
    }
  },
  {
    "energieAlias": "chou rouge",
    "aliases": [
      "chou rouge",
      "red cabbage"
    ],
    "cnfFoodId": "2034",
    "cnfNameFr": "Chou rouge, cru",
    "cnfNameEn": "Cabbage, red, raw",
    "portion": "1 tasse",
    "gramsPerPortion": 73.965,
    "nutritionPer100g": {
      "protein": 1.43,
      "fat": 0.16,
      "carbs": 7.37,
      "calories": 31,
      "sugars": 3.83,
      "fiber": 2.1,
      "calcium": 45,
      "iron": 0.8,
      "potassium": 243,
      "sodium": 27
    }
  },
  {
    "energieAlias": "bok choy",
    "aliases": [
      "bok choy",
      "pak choi"
    ],
    "cnfFoodId": "2039",
    "cnfNameFr": "Bok choy, pak-choi, bouilli, égoutté",
    "cnfNameEn": "Bok choy, pak-choi, boiled drained",
    "portion": "1 tasse cuit",
    "gramsPerPortion": 179.628,
    "nutritionPer100g": {
      "protein": 1.56,
      "fat": 0.16,
      "carbs": 1.78,
      "calories": 11,
      "sugars": 0.83,
      "fiber": 1,
      "calcium": 93,
      "iron": 1.04,
      "potassium": 371,
      "sodium": 34
    }
  },
  {
    "energieAlias": "pois mange-tout",
    "aliases": [
      "pois mange-tout",
      "snow peas"
    ],
    "cnfFoodId": "2408",
    "cnfNameFr": "Pois mange-tout, crus",
    "cnfNameEn": "Peas, edible-podded (snow peas), raw",
    "portion": "1 tasse",
    "gramsPerPortion": 66.568,
    "nutritionPer100g": {
      "protein": 2.8,
      "fat": 0.2,
      "carbs": 7.55,
      "calories": 42,
      "sugars": 4,
      "fiber": 1.77,
      "calcium": 43,
      "iron": 2.08,
      "potassium": 200,
      "sodium": 4
    }
  },
  {
    "energieAlias": "ail",
    "aliases": [
      "ail",
      "garlic"
    ],
    "cnfFoodId": "2394",
    "cnfNameFr": "Ail, cru",
    "cnfNameEn": "Garlic, raw",
    "portion": "3 gousses",
    "gramsPerPortion": 9,
    "nutritionPer100g": {
      "protein": 6.36,
      "fat": 0.5,
      "carbs": 33.06,
      "calories": 149,
      "sugars": 1,
      "fiber": 2.1,
      "calcium": 181,
      "iron": 1.7,
      "potassium": 401,
      "sodium": 17
    }
  },
  {
    "energieAlias": "radis",
    "aliases": [
      "radis",
      "radish"
    ],
    "cnfFoodId": "2443",
    "cnfNameFr": "Radis, cru",
    "cnfNameEn": "Radish, raw",
    "portion": "1 tasse",
    "gramsPerPortion": 122.569,
    "nutritionPer100g": {
      "protein": 0.68,
      "fat": 0.1,
      "carbs": 3.4,
      "calories": 16,
      "sugars": 1.86,
      "fiber": 1.6,
      "calcium": 25,
      "iron": 0.34,
      "potassium": 233,
      "sodium": 39
    }
  },
  {
    "energieAlias": "rutabaga",
    "aliases": [
      "rutabaga"
    ],
    "cnfFoodId": "2445",
    "cnfNameFr": "Rutabaga (chou-navet), bouilli, égoutté",
    "cnfNameEn": "Rutabaga (swede), boiled, drained",
    "portion": "1 tasse",
    "gramsPerPortion": 179.628,
    "nutritionPer100g": {
      "protein": 0.93,
      "fat": 0.18,
      "carbs": 6.84,
      "calories": 30,
      "sugars": 3.95,
      "fiber": 1.8,
      "calcium": 18,
      "iron": 0.18,
      "potassium": 216,
      "sodium": 5
    }
  },
  {
    "energieAlias": "artichaut",
    "aliases": [
      "artichaut",
      "artichoke"
    ],
    "cnfFoodId": "2364",
    "cnfNameFr": "Artichaut, cru",
    "cnfNameEn": "Artichoke (Globe, French), raw",
    "portion": "1 moyen",
    "gramsPerPortion": 128,
    "nutritionPer100g": {
      "protein": 3.27,
      "fat": 0.15,
      "carbs": 10.51,
      "calories": 47,
      "fiber": 4.58,
      "calcium": 44,
      "iron": 1.28,
      "potassium": 370,
      "sodium": 94
    }
  },
  {
    "energieAlias": "okra",
    "aliases": [
      "okra",
      "gombo"
    ],
    "cnfFoodId": "2134",
    "cnfNameFr": "Okra (gombo), cru",
    "cnfNameEn": "Okra (gumbo), raw",
    "portion": "1 tasse",
    "gramsPerPortion": 105.66,
    "nutritionPer100g": {
      "protein": 1.93,
      "fat": 0.19,
      "carbs": 7.45,
      "calories": 33,
      "sugars": 1.48,
      "fiber": 3.2,
      "calcium": 82,
      "iron": 0.62,
      "potassium": 299,
      "sodium": 7
    }
  },
  {
    "energieAlias": "salade grecque",
    "aliases": [
      "salade grecque",
      "greek salad"
    ],
    "cnfFoodId": "6738",
    "cnfNameFr": "Salade grecque, faite maison",
    "cnfNameEn": "Salad, Greek, homemade",
    "portion": "1 portion",
    "gramsPerPortion": 110.95,
    "nutritionPer100g": {
      "protein": 3.334,
      "fat": 11.352,
      "carbs": 3.934,
      "calories": 126,
      "sugars": 2.141,
      "fiber": 0.959,
      "calcium": 108.428,
      "iron": 0.583,
      "potassium": 116.551,
      "sodium": 283.461
    }
  },
  {
    "energieAlias": "bacon",
    "aliases": [
      "bacon"
    ],
    "cnfFoodId": "5405",
    "cnfNameFr": "Porc, salé, bacon, cuit, au four",
    "cnfNameEn": "Pork, cured, bacon, cooked, baked",
    "portion": "3 tranches",
    "gramsPerPortion": 24.3,
    "nutritionPer100g": {
      "protein": 35.73,
      "fat": 43.27,
      "carbs": 1.35,
      "calories": 548,
      "sugars": 0,
      "fiber": 0,
      "calcium": 10,
      "iron": 1.49,
      "potassium": 539,
      "sodium": 2193
    }
  },
  {
    "energieAlias": "thon",
    "aliases": [
      "thon",
      "tuna"
    ],
    "cnfFoodId": "3080",
    "cnfNameFr": "Poisson, thon rouge, frais, cuit au four ou grillé",
    "cnfNameEn": "Fish, tuna, bluefin, fresh, baked or broiled",
    "portion": "150 g",
    "gramsPerPortion": 150,
    "nutritionPer100g": {
      "protein": 29.91,
      "fat": 6.28,
      "carbs": 0,
      "calories": 184,
      "sugars": 0,
      "fiber": 0,
      "calcium": 10,
      "iron": 1.31,
      "potassium": 323,
      "sodium": 50
    }
  },
  {
    "energieAlias": "falafel",
    "aliases": [
      "falafel"
    ],
    "cnfFoodId": "3339",
    "cnfNameFr": "Falafel, fait maison",
    "cnfNameEn": "Falafel, homemade",
    "portion": "5 morceaux",
    "gramsPerPortion": 85,
    "nutritionPer100g": {
      "protein": 13.31,
      "fat": 17.8,
      "carbs": 31.84,
      "calories": 333,
      "sugars": 3.26364,
      "fiber": 7.8,
      "calcium": 54,
      "iron": 3.42,
      "potassium": 585,
      "sodium": 294
    }
  },
  {
    "energieAlias": "fromage à la crème",
    "aliases": [
      "fromage à la crème",
      "fromage a la creme",
      "cream cheese"
    ],
    "cnfFoodId": "28",
    "cnfNameFr": "Fromage, produit de fromage à la crème, nature",
    "cnfNameEn": "Cheese, cream cheese product, plain",
    "portion": "2 c. à soupe",
    "gramsPerPortion": 29.4,
    "nutritionPer100g": {
      "protein": 6.59,
      "fat": 28.461,
      "carbs": 8.3,
      "calories": 310,
      "sugars": 6.67,
      "fiber": 0,
      "calcium": 131,
      "iron": 0.19,
      "potassium": 237,
      "sodium": 422
    }
  },
  {
    "energieAlias": "crème glacée",
    "aliases": [
      "crème glacée",
      "creme glacee",
      "ice cream"
    ],
    "cnfFoodId": "4163",
    "cnfNameFr": "Dessert, congelé, crème glacée, vanille, 11% M.G.",
    "cnfNameEn": "Dessert, frozen, ice cream, vanilla, 11% M.F.",
    "portion": "1 tasse",
    "gramsPerPortion": 139.48,
    "nutritionPer100g": {
      "protein": 3.5,
      "fat": 11,
      "carbs": 23.6,
      "calories": 208,
      "sugars": 21.22,
      "fiber": 0.7,
      "calcium": 128,
      "iron": 0.09,
      "potassium": 199,
      "sodium": 80
    }
  },
  {
    "energieAlias": "noix de grenoble",
    "aliases": [
      "noix de grenoble",
      "walnuts"
    ],
    "cnfFoodId": "2590",
    "cnfNameFr": "Noix de Grenoble",
    "cnfNameEn": "Nuts, walnuts, English or Persian",
    "portion": "1/4 tasse",
    "gramsPerPortion": 30.431,
    "nutritionPer100g": {
      "protein": 15.23,
      "fat": 65.21,
      "carbs": 13.71,
      "calories": 655,
      "sugars": 2.61,
      "fiber": 6.7,
      "calcium": 98,
      "iron": 2.91,
      "potassium": 441,
      "sodium": 2
    }
  },
  {
    "energieAlias": "graines de chia",
    "aliases": [
      "graines de chia",
      "chia seeds"
    ],
    "cnfFoodId": "2511",
    "cnfNameFr": "Graines de chia, déshydratées",
    "cnfNameEn": "Seeds, chia seeds, dried",
    "portion": "2 c. à soupe",
    "gramsPerPortion": 21.608,
    "nutritionPer100g": {
      "protein": 16.54,
      "fat": 30.74,
      "carbs": 42.12,
      "calories": 486,
      "fiber": 34.4,
      "calcium": 631,
      "iron": 7.72,
      "potassium": 407,
      "sodium": 16
    }
  },
  {
    "energieAlias": "beigne",
    "aliases": [
      "beigne",
      "donut"
    ],
    "cnfFoodId": "3891",
    "cnfNameFr": "Beigne, type gâteau, nature (inclus non sucré, à l'ancienne)",
    "cnfNameEn": "Doughnut (donut), cake-type, plain (includes unsugared, old-fashioned)",
    "portion": "1 moyen",
    "gramsPerPortion": 71,
    "nutritionPer100g": {
      "protein": 5.31,
      "fat": 24.93,
      "carbs": 47.06,
      "calories": 434,
      "sugars": 18.15,
      "fiber": 1.7,
      "calcium": 40,
      "iron": 2.53,
      "potassium": 134,
      "sodium": 477
    }
  },
  {
    "energieAlias": "gâteau au fromage",
    "aliases": [
      "gâteau au fromage",
      "gateau au fromage",
      "cheesecake"
    ],
    "cnfFoodId": "3800",
    "cnfNameFr": "Gâteau, au fromage, commercial",
    "cnfNameEn": "Cheesecake, commercial",
    "portion": "1 pointe",
    "gramsPerPortion": 125,
    "nutritionPer100g": {
      "protein": 5.5,
      "fat": 22.5,
      "carbs": 25.5,
      "calories": 321,
      "sugars": 21.8,
      "fiber": 0.4,
      "calcium": 51,
      "iron": 0.63,
      "potassium": 90,
      "sodium": 438
    }
  },
  {
    "energieAlias": "eau de coco",
    "aliases": [
      "eau de coco",
      "coconut water"
    ],
    "cnfFoodId": "2566",
    "cnfNameFr": "Noix de coco, eau (liquide de la noix)",
    "cnfNameEn": "Coconut water (liquid from coconut)",
    "portion": "1 tasse",
    "gramsPerPortion": 253.592,
    "nutritionPer100g": {
      "protein": 0.72,
      "fat": 0.2,
      "carbs": 3.71,
      "calories": 19,
      "sugars": 2.61,
      "fiber": 1.1,
      "calcium": 24,
      "iron": 0.29,
      "potassium": 250,
      "sodium": 105
    }
  },
  {
    "energieAlias": "poutine",
    "aliases": [
      "poutine"
    ],
    "cnfFoodId": "6772",
    "cnfNameFr": "Poutine",
    "cnfNameEn": "Poutine",
    "portion": "1 portion",
    "gramsPerPortion": 195,
    "nutritionPer100g": {
      "protein": 7.494,
      "fat": 15.312,
      "carbs": 15.245,
      "calories": 226,
      "sugars": 0.417,
      "fiber": 1.129,
      "calcium": 175.751,
      "iron": 0.674,
      "potassium": 276.582,
      "sodium": 614.364
    }
  },
  {
    "energieAlias": "club sandwich",
    "aliases": [
      "club sandwich"
    ],
    "cnfFoodId": "6753",
    "cnfNameFr": "Sandwich club avec poulet grillé, bacon, tomates, fromage, laitue et mayonnaise",
    "cnfNameEn": "Club sandwich with grilled chicken, bacon, tomato, cheese, lettuce and mayonnaise",
    "portion": "1",
    "gramsPerPortion": 246,
    "nutritionPer100g": {
      "protein": 17.19,
      "fat": 8.05,
      "carbs": 19.87,
      "calories": 220,
      "sugars": 2.15,
      "fiber": 1.2,
      "calcium": 95,
      "iron": 1.37,
      "potassium": 226,
      "sodium": 630
    }
  },
  {
    "energieAlias": "nuggets de poulet",
    "aliases": [
      "nuggets de poulet",
      "chicken nuggets"
    ],
    "cnfFoodId": "7034",
    "cnfNameFr": "Poulet, croquette, viande blanche et brune, précuite, congelée, non réchauffée",
    "cnfNameEn": "Chicken nuggets, dark and white meat, pre-cooked, frozen, not heated",
    "portion": "10 morceaux",
    "gramsPerPortion": 180,
    "nutritionPer100g": {
      "protein": 12.02,
      "fat": 17.31,
      "carbs": 16.09,
      "calories": 268,
      "sugars": 0.72,
      "fiber": 1.6,
      "calcium": 47,
      "iron": 0.95,
      "potassium": 206,
      "sodium": 540
    }
  },
  {
    "energieAlias": "salade de pâtes",
    "aliases": [
      "salade de pâtes",
      "salade de pates",
      "pasta salad"
    ],
    "cnfFoodId": "6744",
    "cnfNameFr": "Salade de pâtes avec légumes, préparée avec vinaigrette italienne, faite maison",
    "cnfNameEn": "Pasta salad with vegetables, prepared with Italian dressing, homemade",
    "portion": "2 tasses",
    "gramsPerPortion": 374.06,
    "nutritionPer100g": {
      "protein": 2.746,
      "fat": 5.564,
      "carbs": 17.982,
      "calories": 132,
      "sugars": 2.549,
      "fiber": 1.164,
      "calcium": 14.181,
      "iron": 0.909,
      "potassium": 92.224,
      "sodium": 658.431
    }
  },
  {
    "energieAlias": "riz",
    "aliases": [
      "riz",
      "rice"
    ],
    "cnfFoodId": "4475",
    "cnfNameFr": "Grains céréaliers, riz blanc, grain moyen, cuit",
    "cnfNameEn": "Grains, rice, white, medium-grain, cooked",
    "portion": "1 tasse cuite",
    "gramsPerPortion": 196.534,
    "nutritionPer100g": {
      "protein": 2.38,
      "fat": 0.21,
      "carbs": 28.59,
      "calories": 130,
      "sugars": 0.05,
      "calcium": 3,
      "iron": 0.2,
      "potassium": 29,
      "sodium": 0
    }
  },
  {
    "energieAlias": "fromage",
    "aliases": [
      "fromage",
      "cheese"
    ],
    "cnfFoodId": "119",
    "cnfNameFr": "Fromage cheddar, doux",
    "cnfNameEn": "Cheese, cheddar, mild",
    "portion": "30 g",
    "gramsPerPortion": 30,
    "nutritionPer100g": {
      "protein": 23.29,
      "fat": 31.756,
      "carbs": 10.27,
      "calories": 418,
      "sugars": 0.13,
      "fiber": 0,
      "calcium": 800,
      "iron": 1.26,
      "potassium": 83,
      "sodium": 784
    }
  },
  {
    "energieAlias": "fajitas",
    "aliases": [
      "fajitas",
      "fajita"
    ],
    "cnfFoodId": "6774",
    "cnfNameFr": "Fajita au poulet et aux légumes",
    "cnfNameEn": "Fajita with chicken and vegetables",
    "portion": "1 portion",
    "gramsPerPortion": 223,
    "nutritionPer100g": {
      "protein": 7.667,
      "fat": 4.664,
      "carbs": 20.79,
      "calories": 155,
      "sugars": 2.58,
      "fiber": 2.281,
      "calcium": 22.285,
      "iron": 1.395,
      "potassium": 205.757,
      "sodium": 213.312
    }
  }
];

  const normalize = (value) => String(value || "")
    .toLocaleLowerCase("fr-CA")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const legacyFoods = Array.isArray(root.ENERGIE_FOODS) ? root.ENERGIE_FOODS : [];

  function legacyFor(mapping) {
    const wanted = new Set((mapping.aliases || []).map(normalize));
    wanted.add(normalize(mapping.energieAlias));
    return legacyFoods.find((food) =>
      (food.keys || []).some((key) => wanted.has(normalize(key)))
    ) || null;
  }

  function perPortion(value, grams) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.round((n * grams / 100) * 1000) / 1000 : null;
  }

  const overrides = mappings.map((mapping) => {
    const legacy = legacyFor(mapping);
    const grams = Number(mapping.gramsPerPortion);
    const n = mapping.nutritionPer100g || {};
    return Object.freeze({
      keys: Array.from(new Set([
        ...(mapping.aliases || []),
        mapping.energieAlias,
      ].filter(Boolean))),
      calories: perPortion(n.calories, grams),
      protein: perPortion(n.protein, grams),
      carbs: perPortion(n.carbs, grams),
      fat: perPortion(n.fat, grams),
      fiber: perPortion(n.fiber, grams),
      sugars: perPortion(n.sugars, grams),
      sodium: perPortion(n.sodium, grams),
      portion: mapping.portion,
      gramsPerPortion: grams,
      tags: Array.isArray(legacy?.tags) ? legacy.tags : [],
      nutritionSource: "cnf",
      nutritionSourceLabel: "Fichier canadien sur les éléments nutritifs (FCÉN) 2026 — Santé Canada",
      cnfFoodId: mapping.cnfFoodId,
      cnfNameFr: mapping.cnfNameFr,
      cnfNameEn: mapping.cnfNameEn,
    });
  });

  root.ENERGIE_CNF_OVERRIDES = Object.freeze(overrides);
  root.ENERGIE_CNF_RUNTIME_INFO = Object.freeze({
    edition: 2026,
    source: "Health Canada / Santé Canada",
    verifiedMappings: overrides.length,
  });

  if (typeof module !== "undefined" && module.exports) module.exports = overrides;
})(typeof window !== "undefined" ? window : globalThis);
