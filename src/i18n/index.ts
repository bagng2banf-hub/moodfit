import { en } from "./en";
import { ko } from "./ko";

export const dictionaries = { ko, en };
export const languages = ["ko", "en"];

export function createTranslator(language) {
  const dictionary = dictionaries[language] || dictionaries.ko;
  return (key) => dictionary[key] || dictionaries.en[key] || key;
}
