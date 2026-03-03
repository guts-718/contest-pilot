import { KEYWORD_CATEGORIES } from "./keywordDictionary";

interface KeywordBlock {
  categories: Record<string, number>;
  keywords: Record<string, number>;
  normalized: Record<string, number>;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function extractKeywords(text: string): KeywordBlock {

  const tokens = tokenize(text);
  const wordCount = tokens.length;

  const categories: Record<string, number> = {};
  const keywords: Record<string, number> = {};

  const joinedText = text.toLowerCase();

  for (const [category, words] of Object.entries(KEYWORD_CATEGORIES)) {

    categories[category] = 0;

    for (const word of words) {

      let count = 0;

      // phrase detection
      if (word.includes(" ")) {
        const regex = new RegExp(word, "g");
        const matches = joinedText.match(regex);
        count = matches ? matches.length : 0;
      }
      else {
        count = tokens.filter(t => t === word).length;
      }

      if (count > 0) {
        keywords[word] = count;
        categories[category] += count;
      }
    }
  }

  const normalized: Record<string, number> = {};

  for (const [category, count] of Object.entries(categories)) {
    normalized[`${category}_density`] =
      wordCount > 0 ? count / wordCount : 0;
  }

  return {
    categories,
    keywords,
    normalized
  };
}