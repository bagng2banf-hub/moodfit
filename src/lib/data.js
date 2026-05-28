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

export const seedWardrobe = [
  { id: "top-ivory", name: "Ivory cashmere knit", category: "tops", mood: "moodCozy", season: "spring", color: "#eadcc7", vibe: "soft", occasion: "daily", pattern: "knit" },
  { id: "outer-black", name: "Black satin blazer", category: "outerwear", mood: "moodLuxury", season: "all", color: "#101010", vibe: "luxury", occasion: "evening", pattern: "gloss" },
  { id: "bottom-charcoal", name: "Wide charcoal trousers", category: "bottoms", mood: "moodChic", season: "all", color: "#292929", vibe: "minimal", occasion: "office", pattern: "plain" },
  { id: "shoe-pearl", name: "Pearl slingback shoes", category: "shoes", mood: "moodDate", season: "all", color: "#f5f1e9", vibe: "clean", occasion: "date", pattern: "plain" },
  { id: "outer-bomber", name: "Oversized technical bomber", category: "outerwear", mood: "moodStreet", season: "fall", color: "#252a31", vibe: "street", occasion: "weekend", pattern: "plain" },
  { id: "bottom-denim", name: "Soft cargo denim", category: "bottoms", mood: "moodStreet", season: "all", color: "#46627d", vibe: "street", occasion: "campus", pattern: "denim" },
  { id: "bag-walnut", name: "Walnut mini shoulder bag", category: "bags", mood: "moodCozy", season: "fall", color: "#8c5a38", vibe: "warm", occasion: "daily", pattern: "plain" },
  { id: "acc-silver", name: "Liquid silver necklace", category: "accessories", mood: "moodLuxury", season: "all", color: "#d8d8d6", vibe: "chic", occasion: "evening", pattern: "gloss" },
];

export function defaultFit(items = seedWardrobe) {
  return {
    tops: items.find((item) => item.category === "tops"),
    outerwear: items.find((item) => item.category === "outerwear"),
    bottoms: items.find((item) => item.category === "bottoms"),
    shoes: items.find((item) => item.category === "shoes"),
    bags: items.find((item) => item.category === "bags"),
    accessories: items.find((item) => item.category === "accessories"),
  };
}
