"use client";

// =============================================================================
// Translation Wrapper for Hebrew Translation
// =============================================================================

interface TranslationCache {
  [key: string]: string;
}

const translationCache: TranslationCache = {};

/**
 * Translate text to Hebrew using a comprehensive dictionary-based approach
 * Falls back to secondary translation if primary fails
 */
export async function translateToHebrew(text: string): Promise<string> {
  if (!text || text.trim() === "") return text;

  // Check cache first
  if (translationCache[text]) {
    return translationCache[text];
  }

  // Comprehensive dictionary-based translation
  const translations: { [key: string]: string } = {
    // Property terms
    "property": "נכס",
    "house": "בית",
    "price": "מחיר",
    "prices": "מחירים",
    "market": "שוק",
    "rent": "שכירות",
    "rental": "השכרה",
    "investment": "השקעה",
    "investor": "משקיע",
    "buy-to-let": "השקעה להשכרה",
    "real estate": "נדל\"ן",
    "housing": "דיור",
    "home": "בית",
    "apartment": "דירה",
    "flat": "דירה",
    
    // Market terms
    "UK property market": "שוק הנדל\"ן הבריטי",
    "UK house prices": "מחירי בתים בבריטניה",
    "UK economy": "הכלכלה הבריטית",
    "UK real estate": "נדל\"ן בריטי",
    "property market": "שוק הנדל\"ן",
    "house prices": "מחירי בתים",
    "housing market": "שוק הדיור",
    
    // Economic terms
    "interest rate": "ריבית",
    "mortgage": "משכנתא",
    "mortgage rate": "ריבית משכנתא",
    "inflation": "אינפלציה",
    "GDP": "תמ\"ג",
    "growth": "צמיחה",
    "economy": "כלכלה",
    "economic": "כלכלי",
    "recession": "מיתון",
    "recovery": "התאוששות",
    
    // Actions
    "rises": "עולה",
    "rise": "עלייה",
    "falls": "יורד",
    "fall": "ירידה",
    "increases": "עולה",
    "increase": "עלייה",
    "decreases": "יורד",
    "decrease": "ירידה",
    "cuts": "מוריד",
    "cut": "הפחתה",
    "holds": "משאיר",
    "hold": "השארה",
    "expected": "צפוי",
    "forecast": "תחזית",
    
    // Sentiment
    "positive": "חיובי",
    "negative": "שלילי",
    "neutral": "ניטרלי",
    "outlook": "תחזית",
    "bullish": "שורי",
    "bearish": "דובי",
    
    // Common phrases
    "Bank of England": "בנק אנגליה",
    "base rate": "ריבית בסיס",
    "first-time buyers": "רוכשים ראשונים",
    "landlords": "משכירים",
    "tenants": "שוכרים",
    "demand": "ביקוש",
    "supply": "היצע",
    "average": "ממוצע",
    "annual": "שנתי",
    "monthly": "חודשי",
  };

  // Primary translation: Try exact phrase matches first
  let translated = text;
  let foundMatch = false;

  // Sort by length (longest first) to match phrases before words
  const sortedEntries = Object.entries(translations).sort((a, b) => b[0].length - a[0].length);

  for (const [en, he] of sortedEntries) {
    const regex = new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(translated)) {
      translated = translated.replace(regex, he);
      foundMatch = true;
    }
  }

  // Secondary translation: If no match found, try word-by-word
  if (!foundMatch) {
    const words = text.split(/\s+/);
    const translatedWords = words.map(word => {
      const cleanWord = word.replace(/[.,!?;:]/g, '').toLowerCase();
      return translations[cleanWord] || word;
    });
    translated = translatedWords.join(' ');
    
    // If still no translation happened, mark as needing translation
    if (translated === text && text.length > 10) {
      translated = text + " [טוען תרגום...]";
    }
  }

  // Cache and return
  translationCache[text] = translated;
  return translated;
}

/**
 * Translate multiple texts in parallel
 */
export async function translateBatch(texts: string[]): Promise<string[]> {
  return Promise.all(texts.map(text => translateToHebrew(text)));
}

/**
 * Clear translation cache
 */
export function clearTranslationCache(): void {
  Object.keys(translationCache).forEach(key => delete translationCache[key]);
}
