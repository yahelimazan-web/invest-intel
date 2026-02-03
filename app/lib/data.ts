import type { PropertyAsset, CurrencyCode } from "./utils";

// Sample portfolio data
export const PORTFOLIO_ASSETS: PropertyAsset[] = [
  {
    id: "1",
    name: "12 James Holt Avenue",
    address: "12 James Holt Avenue, Kirkby",
    postcode: "L32 5TE",
    purchasePrice: 125000,
    currentValue: 145000,
    currency: "GBP",
    monthlyRent: 850,
    managementFee: 10,
    maintenanceCosts: 1200,
    councilTax: 1450,
    purchaseDate: "2021-03-15",
    country: "uk",
  },
  {
    id: "2",
    name: "Canary Wharf Studio",
    address: "15 Canada Square, Canary Wharf",
    postcode: "E14 5AB",
    purchasePrice: 385000,
    currentValue: 420000,
    currency: "GBP",
    monthlyRent: 2100,
    managementFee: 12,
    maintenanceCosts: 2500,
    councilTax: 1850,
    purchaseDate: "2020-08-22",
    country: "uk",
  },
  {
    id: "3",
    name: "Larnaca Beach Apartment",
    address: "45 Finikoudes Promenade, Larnaca",
    postcode: "6023",
    purchasePrice: 180000,
    currentValue: 215000,
    currency: "EUR",
    monthlyRent: 1200,
    managementFee: 8,
    maintenanceCosts: 1500,
    councilTax: 450,
    purchaseDate: "2022-01-10",
    country: "cyprus",
  },
];

// Historical price data for charts
export interface PricePoint {
  date: string;
  value: number;
  rent?: number;
}

export const PRICE_HISTORY: Record<string, PricePoint[]> = {
  "1": [
    { date: "2021-03", value: 125000, rent: 750 },
    { date: "2021-06", value: 127000, rent: 750 },
    { date: "2021-09", value: 130000, rent: 775 },
    { date: "2021-12", value: 132000, rent: 775 },
    { date: "2022-03", value: 135000, rent: 800 },
    { date: "2022-06", value: 138000, rent: 800 },
    { date: "2022-09", value: 140000, rent: 825 },
    { date: "2022-12", value: 141000, rent: 825 },
    { date: "2023-03", value: 142000, rent: 850 },
    { date: "2023-06", value: 143000, rent: 850 },
    { date: "2023-09", value: 144000, rent: 850 },
    { date: "2023-12", value: 145000, rent: 850 },
  ],
  "2": [
    { date: "2020-08", value: 385000, rent: 1800 },
    { date: "2020-11", value: 388000, rent: 1800 },
    { date: "2021-02", value: 392000, rent: 1850 },
    { date: "2021-05", value: 395000, rent: 1900 },
    { date: "2021-08", value: 400000, rent: 1950 },
    { date: "2021-11", value: 405000, rent: 2000 },
    { date: "2022-02", value: 410000, rent: 2000 },
    { date: "2022-05", value: 412000, rent: 2050 },
    { date: "2022-08", value: 415000, rent: 2050 },
    { date: "2022-11", value: 417000, rent: 2100 },
    { date: "2023-02", value: 418000, rent: 2100 },
    { date: "2023-05", value: 420000, rent: 2100 },
  ],
  "3": [
    { date: "2022-01", value: 180000, rent: 1000 },
    { date: "2022-04", value: 185000, rent: 1050 },
    { date: "2022-07", value: 190000, rent: 1100 },
    { date: "2022-10", value: 195000, rent: 1100 },
    { date: "2023-01", value: 200000, rent: 1150 },
    { date: "2023-04", value: 205000, rent: 1150 },
    { date: "2023-07", value: 210000, rent: 1200 },
    { date: "2023-10", value: 215000, rent: 1200 },
  ],
};

// Crime data for charts
export interface CrimeDataPoint {
  month: string;
  total: number;
  violent: number;
  burglary: number;
  other: number;
}

export const CRIME_HISTORY: Record<string, CrimeDataPoint[]> = {
  "L32 5TE": [
    { month: "Jul 24", total: 145, violent: 35, burglary: 12, other: 98 },
    { month: "Aug 24", total: 152, violent: 38, burglary: 15, other: 99 },
    { month: "Sep 24", total: 138, violent: 32, burglary: 10, other: 96 },
    { month: "Oct 24", total: 160, violent: 42, burglary: 18, other: 100 },
    { month: "Nov 24", total: 155, violent: 40, burglary: 14, other: 101 },
    { month: "Dec 24", total: 148, violent: 36, burglary: 11, other: 101 },
  ],
  "E14 5AB": [
    { month: "Jul 24", total: 85, violent: 15, burglary: 8, other: 62 },
    { month: "Aug 24", total: 78, violent: 12, burglary: 6, other: 60 },
    { month: "Sep 24", total: 82, violent: 14, burglary: 7, other: 61 },
    { month: "Oct 24", total: 90, violent: 18, burglary: 9, other: 63 },
    { month: "Nov 24", total: 75, violent: 11, burglary: 5, other: 59 },
    { month: "Dec 24", total: 80, violent: 13, burglary: 6, other: 61 },
  ],
};

// Macro economic data
export interface MacroDataPoint {
  date: string;
  inflation: number;
  housePrice: number;
  interestRate: number;
  gdpGrowth: number;
}

// Historical data - Note: Live data is fetched from /api/macro-data
// Bank of England Base Rate as of January 2025: 3.75%
export const UK_MACRO_DATA: MacroDataPoint[] = [
  { date: "2024-Q1", inflation: 3.4, housePrice: 282000, interestRate: 5.25, gdpGrowth: 0.3 },
  { date: "2024-Q2", inflation: 2.0, housePrice: 285000, interestRate: 5.0, gdpGrowth: 0.5 },
  { date: "2024-Q3", inflation: 1.7, housePrice: 290000, interestRate: 4.5, gdpGrowth: 0.4 },
  { date: "2024-Q4", inflation: 2.5, housePrice: 295000, interestRate: 4.0, gdpGrowth: 0.3 },
  { date: "2025-Q1", inflation: 2.5, housePrice: 298000, interestRate: 3.75, gdpGrowth: 0.4 },
];

export const CYPRUS_MACRO_DATA: MacroDataPoint[] = [
  { date: "2024-Q1", inflation: 2.2, housePrice: 202000, interestRate: 4.5, gdpGrowth: 3.2 },
  { date: "2024-Q2", inflation: 2.0, housePrice: 208000, interestRate: 4.25, gdpGrowth: 3.5 },
  { date: "2024-Q3", inflation: 1.8, housePrice: 212000, interestRate: 4.0, gdpGrowth: 3.3 },
  { date: "2024-Q4", inflation: 2.1, housePrice: 218000, interestRate: 3.75, gdpGrowth: 3.1 },
  { date: "2025-Q1", inflation: 2.0, housePrice: 222000, interestRate: 3.75, gdpGrowth: 3.0 },
];

// News items
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  category: "planning" | "market" | "policy" | "development";
  country: "uk" | "cyprus";
  postcode?: string;
  coordinates?: { lat: number; lon: number };
  url?: string;
}

// Note: Live news is fetched from /api/news - these are fallback items
export const NEWS_ITEMS: NewsItem[] = [
  {
    id: "1",
    title: "Liverpool City Region: Major Regeneration Plan Approved",
    summary: "£500m investment in Kirkby town centre including new retail, housing and transport links.",
    source: "Liverpool Echo",
    date: "2025-01-20",
    category: "development",
    country: "uk",
    postcode: "L32",
    coordinates: { lat: 53.481, lon: -2.893 },
    url: "https://www.liverpoolecho.co.uk/news/",
  },
  {
    id: "2",
    title: "Canary Wharf Expands: New Residential Tower Approved",
    summary: "60-storey residential tower to add 800 new apartments to the E14 district.",
    source: "Evening Standard",
    date: "2025-01-18",
    category: "planning",
    country: "uk",
    postcode: "E14",
    coordinates: { lat: 51.505, lon: -0.0235 },
    url: "https://www.standard.co.uk/homesandproperty",
  },
  {
    id: "3",
    title: "Bank of England Cuts Base Rate to 3.75%",
    summary: "Mortgage rates expected to decrease as BoE signals further cuts possible.",
    source: "Bank of England",
    date: "2025-01-24",
    category: "policy",
    country: "uk",
    url: "https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate",
  },
  {
    id: "4",
    title: "Cyprus Golden Visa: Updated Requirements for 2025",
    summary: "Minimum investment threshold for residency permits remains at €300,000.",
    source: "Cyprus Mail",
    date: "2025-01-22",
    category: "policy",
    country: "cyprus",
    url: "https://cyprus-mail.com/",
  },
  {
    id: "5",
    title: "Larnaca Marina Development Phase 2 Begins",
    summary: "€250m project to create luxury waterfront apartments and yacht facilities.",
    source: "Cyprus Property News",
    date: "2025-01-19",
    category: "development",
    country: "cyprus",
    coordinates: { lat: 34.917, lon: 33.629 },
    url: "https://www.news.cyprus-property-buyers.com/",
  },
  {
    id: "6",
    title: "UK House Prices Rise 1.5% Year-on-Year",
    summary: "Market shows continued recovery as mortgage rates stabilize.",
    source: "Nationwide",
    date: "2025-01-12",
    category: "market",
    country: "uk",
    url: "https://www.nationwidehousepriceindex.co.uk/reports",
  },
];

// Alerts/Notifications
export interface Alert {
  id: string;
  type: "price" | "news" | "policy" | "maintenance";
  title: string;
  message: string;
  date: string;
  read: boolean;
  propertyId?: string;
  postcode?: string;
  priority: "low" | "medium" | "high";
}

export const ALERTS: Alert[] = [
  {
    id: "1",
    type: "price",
    title: "עליית מחיר: L32 5TE",
    message: "מחירי הנכסים באזור עלו ב-2.3% בחודש האחרון",
    date: "2024-01-20",
    read: false,
    propertyId: "1",
    postcode: "L32 5TE",
    priority: "medium",
  },
  {
    id: "2",
    type: "policy",
    title: "שינוי Council Tax",
    message: "הרשות המקומית בליברפול הודיעה על עלייה של 4.99% ב-Council Tax לשנת 2024/25",
    date: "2024-01-18",
    read: false,
    propertyId: "1",
    postcode: "L32 5TE",
    priority: "high",
  },
  {
    id: "3",
    type: "news",
    title: "פרויקט פיתוח חדש",
    message: "אישור סופי לפרויקט פיתוח Kirkby - צפי לעליית ערך באזור",
    date: "2024-01-15",
    read: true,
    postcode: "L32",
    priority: "medium",
  },
  {
    id: "4",
    type: "maintenance",
    title: "תזכורת: בדיקת Gas Safety",
    message: "בדיקת הגז השנתית בנכס Canary Wharf מתקרבת לסיום תוקף",
    date: "2024-01-22",
    read: false,
    propertyId: "2",
    priority: "high",
  },
];

// Currency exposure calculation
export function calculateCurrencyExposure(
  assets: PropertyAsset[]
): Record<CurrencyCode, number> {
  const exposure: Record<CurrencyCode, number> = { GBP: 0, EUR: 0, ILS: 0, USD: 0, GEL: 0 };
  const total = assets.reduce((sum, a) => sum + a.currentValue, 0);

  assets.forEach((asset) => {
    exposure[asset.currency] += (asset.currentValue / total) * 100;
  });

  return exposure;
}
