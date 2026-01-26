// Market Sentiment & Institutional Data

// Analyst Ratings
export interface AnalystRating {
  id: string;
  analyst: string;
  logo?: string;
  city: string;
  action: "upgrade" | "downgrade" | "reiterated" | "initiated";
  previousTarget: number;
  newTarget: number;
  priceChangePercent: number;
  date: string;
  summary: string;
}

export const ANALYST_RATINGS: AnalystRating[] = [
  {
    id: "1",
    analyst: "Knight Frank",
    city: "Manchester",
    action: "upgrade",
    previousTarget: 285000,
    newTarget: 310000,
    priceChangePercent: 8.8,
    date: "2024-01-22",
    summary: "Northern Powerhouse momentum continues with strong employment growth",
  },
  {
    id: "2",
    analyst: "Savills",
    city: "Liverpool",
    action: "upgrade",
    previousTarget: 175000,
    newTarget: 195000,
    priceChangePercent: 11.4,
    date: "2024-01-20",
    summary: "Regeneration projects driving investor interest",
  },
  {
    id: "3",
    analyst: "JLL",
    city: "London",
    action: "reiterated",
    previousTarget: 520000,
    newTarget: 520000,
    priceChangePercent: 0,
    date: "2024-01-19",
    summary: "Prime market stabilizing, outer zones showing growth",
  },
  {
    id: "4",
    analyst: "CBRE",
    city: "Birmingham",
    action: "upgrade",
    previousTarget: 225000,
    newTarget: 245000,
    priceChangePercent: 8.9,
    date: "2024-01-18",
    summary: "HS2 and city centre developments boost outlook",
  },
  {
    id: "5",
    analyst: "Cushman & Wakefield",
    city: "Leeds",
    action: "initiated",
    previousTarget: 0,
    newTarget: 230000,
    priceChangePercent: 0,
    date: "2024-01-17",
    summary: "First coverage - strong fundamentals for BTR sector",
  },
  {
    id: "6",
    analyst: "Knight Frank",
    city: "Bristol",
    action: "downgrade",
    previousTarget: 340000,
    newTarget: 315000,
    priceChangePercent: -7.4,
    date: "2024-01-15",
    summary: "Affordability concerns weighing on demand",
  },
  {
    id: "7",
    analyst: "Savills",
    city: "Edinburgh",
    action: "upgrade",
    previousTarget: 290000,
    newTarget: 320000,
    priceChangePercent: 10.3,
    date: "2024-01-14",
    summary: "Tech sector growth driving housing demand",
  },
  {
    id: "8",
    analyst: "JLL",
    city: "Newcastle",
    action: "reiterated",
    previousTarget: 180000,
    newTarget: 185000,
    priceChangePercent: 2.8,
    date: "2024-01-12",
    summary: "Steady growth outlook maintained",
  },
];

// Institutional Activity
export interface InstitutionalActivity {
  id: string;
  fund: string;
  fundType: "reit" | "pension" | "private_equity" | "sovereign" | "insurance";
  transaction: "acquisition" | "disposal" | "development";
  city: string;
  value: number; // in millions
  units: number;
  sector: "resi" | "btr" | "pbsa" | "mixed" | "commercial";
  date: string;
  details: string;
}

export const INSTITUTIONAL_ACTIVITY: InstitutionalActivity[] = [
  {
    id: "1",
    fund: "L&G",
    fundType: "insurance",
    transaction: "acquisition",
    city: "Manchester",
    value: 120,
    units: 450,
    sector: "btr",
    date: "2024-01-21",
    details: "BTR scheme in Salford Quays",
  },
  {
    id: "2",
    fund: "Greystar",
    fundType: "private_equity",
    transaction: "development",
    city: "Birmingham",
    value: 85,
    units: 320,
    sector: "btr",
    date: "2024-01-19",
    details: "City centre development approval",
  },
  {
    id: "3",
    fund: "M&G",
    fundType: "insurance",
    transaction: "acquisition",
    city: "Liverpool",
    value: 45,
    units: 180,
    sector: "resi",
    date: "2024-01-18",
    details: "Baltic Triangle residential block",
  },
  {
    id: "4",
    fund: "Blackstone",
    fundType: "private_equity",
    transaction: "acquisition",
    city: "London",
    value: 250,
    units: 520,
    sector: "mixed",
    date: "2024-01-16",
    details: "Canary Wharf mixed-use scheme",
  },
  {
    id: "5",
    fund: "USS",
    fundType: "pension",
    transaction: "development",
    city: "Leeds",
    value: 65,
    units: 280,
    sector: "pbsa",
    date: "2024-01-15",
    details: "Student accommodation near university",
  },
  {
    id: "6",
    fund: "APG",
    fundType: "pension",
    transaction: "disposal",
    city: "London",
    value: 180,
    units: 400,
    sector: "resi",
    date: "2024-01-14",
    details: "Portfolio sale - prime residential",
  },
  {
    id: "7",
    fund: "Quintain",
    fundType: "private_equity",
    transaction: "development",
    city: "London",
    value: 320,
    units: 850,
    sector: "btr",
    date: "2024-01-12",
    details: "Wembley Park Phase 5",
  },
  {
    id: "8",
    fund: "PGIM",
    fundType: "insurance",
    transaction: "acquisition",
    city: "Glasgow",
    value: 55,
    units: 220,
    sector: "btr",
    date: "2024-01-10",
    details: "City centre BTR scheme",
  },
];

// City Heatmap Data
export interface CityData {
  name: string;
  nameHe: string;
  avgPrice: number;
  priceChange1Y: number;
  priceChange3M: number;
  avgYield: number;
  demandScore: number; // 1-100
  supplyScore: number; // 1-100
  region: string;
  population: number;
  employmentRate: number;
}

export const UK_CITIES_DATA: CityData[] = [
  { name: "London", nameHe: "לונדון", avgPrice: 520000, priceChange1Y: 2.1, priceChange3M: 0.8, avgYield: 4.2, demandScore: 92, supplyScore: 35, region: "Greater London", population: 8982000, employmentRate: 76.5 },
  { name: "Manchester", nameHe: "מנצ'סטר", avgPrice: 285000, priceChange1Y: 5.8, priceChange3M: 1.9, avgYield: 6.1, demandScore: 88, supplyScore: 45, region: "North West", population: 553230, employmentRate: 74.2 },
  { name: "Birmingham", nameHe: "בירמינגהם", avgPrice: 245000, priceChange1Y: 4.5, priceChange3M: 1.2, avgYield: 5.8, demandScore: 82, supplyScore: 50, region: "West Midlands", population: 1144900, employmentRate: 71.8 },
  { name: "Liverpool", nameHe: "ליברפול", avgPrice: 180000, priceChange1Y: 7.2, priceChange3M: 2.4, avgYield: 7.5, demandScore: 78, supplyScore: 55, region: "North West", population: 498042, employmentRate: 70.5 },
  { name: "Leeds", nameHe: "לידס", avgPrice: 230000, priceChange1Y: 4.1, priceChange3M: 1.1, avgYield: 5.9, demandScore: 80, supplyScore: 48, region: "Yorkshire", population: 793139, employmentRate: 75.1 },
  { name: "Bristol", nameHe: "בריסטול", avgPrice: 340000, priceChange1Y: 1.2, priceChange3M: -0.5, avgYield: 4.8, demandScore: 75, supplyScore: 42, region: "South West", population: 463377, employmentRate: 78.2 },
  { name: "Newcastle", nameHe: "ניוקאסל", avgPrice: 185000, priceChange1Y: 3.8, priceChange3M: 1.0, avgYield: 6.8, demandScore: 72, supplyScore: 52, region: "North East", population: 302820, employmentRate: 72.4 },
  { name: "Sheffield", nameHe: "שפילד", avgPrice: 195000, priceChange1Y: 4.2, priceChange3M: 1.3, avgYield: 6.2, demandScore: 70, supplyScore: 54, region: "Yorkshire", population: 584853, employmentRate: 73.1 },
  { name: "Edinburgh", nameHe: "אדינבורו", avgPrice: 320000, priceChange1Y: 6.5, priceChange3M: 2.1, avgYield: 4.9, demandScore: 85, supplyScore: 38, region: "Scotland", population: 527620, employmentRate: 77.8 },
  { name: "Glasgow", nameHe: "גלזגו", avgPrice: 175000, priceChange1Y: 5.2, priceChange3M: 1.8, avgYield: 7.1, demandScore: 76, supplyScore: 58, region: "Scotland", population: 635130, employmentRate: 73.5 },
  { name: "Cardiff", nameHe: "קארדיף", avgPrice: 255000, priceChange1Y: 3.2, priceChange3M: 0.9, avgYield: 5.5, demandScore: 74, supplyScore: 50, region: "Wales", population: 369202, employmentRate: 74.8 },
  { name: "Nottingham", nameHe: "נוטינגהם", avgPrice: 210000, priceChange1Y: 4.8, priceChange3M: 1.5, avgYield: 6.5, demandScore: 73, supplyScore: 52, region: "East Midlands", population: 337100, employmentRate: 72.9 },
  { name: "Leicester", nameHe: "לסטר", avgPrice: 225000, priceChange1Y: 3.5, priceChange3M: 1.0, avgYield: 5.7, demandScore: 71, supplyScore: 53, region: "East Midlands", population: 354224, employmentRate: 71.2 },
  { name: "Southampton", nameHe: "סאות'המפטון", avgPrice: 265000, priceChange1Y: 2.8, priceChange3M: 0.7, avgYield: 5.2, demandScore: 69, supplyScore: 48, region: "South East", population: 252796, employmentRate: 76.1 },
  { name: "Brighton", nameHe: "ברייטון", avgPrice: 420000, priceChange1Y: 0.5, priceChange3M: -0.8, avgYield: 4.1, demandScore: 68, supplyScore: 32, region: "South East", population: 290885, employmentRate: 79.5 },
  { name: "Cambridge", nameHe: "קיימברידג'", avgPrice: 485000, priceChange1Y: 1.8, priceChange3M: 0.4, avgYield: 3.9, demandScore: 82, supplyScore: 28, region: "East", population: 145700, employmentRate: 82.1 },
];

// Macro Data for Charts
export interface MacroTimePoint {
  date: string;
  interestRate: number;
  housingDemandIndex: number;
  mortgageApprovals: number;
  unemploymentRate: number;
}

export const MACRO_TIME_SERIES: MacroTimePoint[] = [
  { date: "Jan 23", interestRate: 3.5, housingDemandIndex: 85, mortgageApprovals: 52000, unemploymentRate: 3.8 },
  { date: "Feb 23", interestRate: 4.0, housingDemandIndex: 82, mortgageApprovals: 48000, unemploymentRate: 3.7 },
  { date: "Mar 23", interestRate: 4.25, housingDemandIndex: 78, mortgageApprovals: 45000, unemploymentRate: 3.8 },
  { date: "Apr 23", interestRate: 4.25, housingDemandIndex: 75, mortgageApprovals: 43000, unemploymentRate: 3.9 },
  { date: "May 23", interestRate: 4.5, housingDemandIndex: 72, mortgageApprovals: 41000, unemploymentRate: 4.0 },
  { date: "Jun 23", interestRate: 5.0, housingDemandIndex: 68, mortgageApprovals: 38000, unemploymentRate: 4.0 },
  { date: "Jul 23", interestRate: 5.25, housingDemandIndex: 65, mortgageApprovals: 36000, unemploymentRate: 4.2 },
  { date: "Aug 23", interestRate: 5.25, housingDemandIndex: 63, mortgageApprovals: 35000, unemploymentRate: 4.3 },
  { date: "Sep 23", interestRate: 5.25, housingDemandIndex: 64, mortgageApprovals: 36000, unemploymentRate: 4.2 },
  { date: "Oct 23", interestRate: 5.25, housingDemandIndex: 66, mortgageApprovals: 38000, unemploymentRate: 4.2 },
  { date: "Nov 23", interestRate: 5.25, housingDemandIndex: 68, mortgageApprovals: 42000, unemploymentRate: 4.1 },
  { date: "Dec 23", interestRate: 5.25, housingDemandIndex: 70, mortgageApprovals: 45000, unemploymentRate: 4.0 },
  { date: "Jan 24", interestRate: 5.0, housingDemandIndex: 74, mortgageApprovals: 48000, unemploymentRate: 3.9 },
];

// Employment by Council Area
export interface CouncilEmployment {
  council: string;
  employmentRate: number;
  change12m: number;
  sectors: { name: string; percent: number }[];
}

export const COUNCIL_EMPLOYMENT: Record<string, CouncilEmployment> = {
  "Knowsley": {
    council: "Knowsley",
    employmentRate: 68.5,
    change12m: 1.2,
    sectors: [
      { name: "Manufacturing", percent: 18 },
      { name: "Retail", percent: 15 },
      { name: "Healthcare", percent: 22 },
      { name: "Education", percent: 12 },
      { name: "Other", percent: 33 },
    ],
  },
  "Tower Hamlets": {
    council: "Tower Hamlets",
    employmentRate: 74.2,
    change12m: 0.8,
    sectors: [
      { name: "Finance", percent: 32 },
      { name: "Tech", percent: 18 },
      { name: "Professional", percent: 22 },
      { name: "Retail", percent: 8 },
      { name: "Other", percent: 20 },
    ],
  },
  "Manchester": {
    council: "Manchester",
    employmentRate: 72.8,
    change12m: 1.5,
    sectors: [
      { name: "Finance", percent: 15 },
      { name: "Tech", percent: 14 },
      { name: "Healthcare", percent: 18 },
      { name: "Retail", percent: 12 },
      { name: "Other", percent: 41 },
    ],
  },
};

// News Headlines for Sentiment Analysis
export interface NewsHeadline {
  id: string;
  title: string;
  source: string;
  date: string;
  sentiment: "positive" | "negative" | "neutral";
  relevance: number; // 1-100
  keywords: string[];
}

export const NEWS_HEADLINES: NewsHeadline[] = [
  { id: "1", title: "House prices rise for third consecutive month", source: "Property Week", date: "2024-01-22", sentiment: "positive", relevance: 95, keywords: ["prices", "growth"] },
  { id: "2", title: "Mortgage rates expected to fall in Q2", source: "Financial Times", date: "2024-01-21", sentiment: "positive", relevance: 92, keywords: ["mortgage", "rates", "fall"] },
  { id: "3", title: "BTR investment hits record £4.5bn in 2023", source: "Property Investor Today", date: "2024-01-20", sentiment: "positive", relevance: 88, keywords: ["BTR", "investment", "record"] },
  { id: "4", title: "Construction costs rise 8% year-on-year", source: "Building", date: "2024-01-19", sentiment: "negative", relevance: 75, keywords: ["construction", "costs", "inflation"] },
  { id: "5", title: "Rental growth moderates as supply increases", source: "Zoopla", date: "2024-01-18", sentiment: "neutral", relevance: 82, keywords: ["rental", "supply"] },
  { id: "6", title: "First-time buyers return as Help to Buy ends", source: "Rightmove", date: "2024-01-17", sentiment: "positive", relevance: 78, keywords: ["first-time", "buyers"] },
  { id: "7", title: "Liverpool named top city for yields", source: "Property Reporter", date: "2024-01-16", sentiment: "positive", relevance: 90, keywords: ["Liverpool", "yields", "investment"] },
  { id: "8", title: "Empty office conversions accelerate", source: "Estates Gazette", date: "2024-01-15", sentiment: "positive", relevance: 72, keywords: ["office", "conversion", "residential"] },
  { id: "9", title: "Planning delays threaten housing targets", source: "Inside Housing", date: "2024-01-14", sentiment: "negative", relevance: 68, keywords: ["planning", "delays"] },
  { id: "10", title: "Institutional appetite for UK resi remains strong", source: "PERE", date: "2024-01-13", sentiment: "positive", relevance: 85, keywords: ["institutional", "investment"] },
];

// Calculate Market Sentiment Score
export function calculateSentimentScore(headlines: NewsHeadline[]): {
  score: number;
  breakdown: { positive: number; negative: number; neutral: number };
  trend: "bullish" | "bearish" | "neutral";
  summary: string;
} {
  const weightedScores = headlines.map((h) => {
    const sentimentValue = h.sentiment === "positive" ? 1 : h.sentiment === "negative" ? -1 : 0;
    return sentimentValue * (h.relevance / 100);
  });

  const avgScore = weightedScores.reduce((a, b) => a + b, 0) / headlines.length;
  const normalizedScore = Math.round(50 + avgScore * 50); // Convert to 0-100 scale

  const breakdown = {
    positive: headlines.filter((h) => h.sentiment === "positive").length,
    negative: headlines.filter((h) => h.sentiment === "negative").length,
    neutral: headlines.filter((h) => h.sentiment === "neutral").length,
  };

  let trend: "bullish" | "bearish" | "neutral";
  let summary: string;

  if (normalizedScore >= 65) {
    trend = "bullish";
    summary = "סנטימנט שוק חיובי - רוב ההודעות מצביעות על מגמת עלייה במחירים וביקוש חזק";
  } else if (normalizedScore <= 35) {
    trend = "bearish";
    summary = "סנטימנט שוק שלילי - חששות לגבי מחירים וביקוש חלש";
  } else {
    trend = "neutral";
    summary = "סנטימנט שוק מעורב - איזון בין גורמים חיוביים ושליליים";
  }

  return { score: normalizedScore, breakdown, trend, summary };
}
