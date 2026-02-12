/**
 * Property yield calculations.
 * Gross Yield = (Monthly Rent × 12) / Purchase Price
 * Net Yield = Gross Yield minus 10% management fee (and fixed costs if provided).
 */

const MANAGEMENT_FEE_PERCENT = 10;

export function computeGrossYield(monthlyRent: number, purchasePrice: number): number {
  if (purchasePrice <= 0) return 0;
  return (monthlyRent * 12) / purchasePrice * 100;
}

export function computeNetYield(
  monthlyRent: number,
  purchasePrice: number,
  fixedCostsAnnual: number = 0
): number {
  if (purchasePrice <= 0) return 0;
  const grossAnnualRent = monthlyRent * 12;
  const managementFee = grossAnnualRent * (MANAGEMENT_FEE_PERCENT / 100);
  const netIncome = grossAnnualRent - managementFee - fixedCostsAnnual;
  return (netIncome / purchasePrice) * 100;
}
