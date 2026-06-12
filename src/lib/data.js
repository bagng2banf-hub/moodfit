export const moods = [
  "moodSoft",
  "moodCalm",
  "moodLuxury",
  "moodCute",
  "moodStreet",
  "moodChic",
  "moodMinimal",
  "moodDate",
  "moodCampus",
  "moodOffice",
  "moodClean",
  "moodCozy",
];

export const themes = ["white", "dark", "wood"];

export const categories = ["tops", "bottoms", "outerwear", "shoes", "bags", "accessories"];

export const seedWardrobe = [];

export function emptyFit() {
  return {
    tops: null,
    outerwear: null,
    bottoms: null,
    shoes: null,
    bags: null,
    accessories: null,
  };
}

export function normalizeFit(fit = {}, items = seedWardrobe) {
  const fallback = defaultFit(items);
  const safe = fit && typeof fit === "object" ? fit : {};
  return {
    tops: safe.tops || fallback.tops || null,
    outerwear: safe.outerwear || fallback.outerwear || null,
    bottoms: safe.bottoms || fallback.bottoms || null,
    shoes: safe.shoes || fallback.shoes || null,
    bags: safe.bags || fallback.bags || null,
    accessories: safe.accessories || fallback.accessories || null,
  };
}

export function defaultFit(items = seedWardrobe) {
  const source = Array.isArray(items) ? items : [];
  return {
    tops: source.find((item) => item.category === "tops") || null,
    outerwear: source.find((item) => item.category === "outerwear") || null,
    bottoms: source.find((item) => item.category === "bottoms") || null,
    shoes: source.find((item) => item.category === "shoes") || null,
    bags: source.find((item) => item.category === "bags") || null,
    accessories: source.find((item) => item.category === "accessories") || null,
  };
}
