import { PropertyInput, AnalysisResult } from '../types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const calculateLPT = (marketValue: number | string): number => {
  // -------- 1. CLEAN & PARSE INPUT --------
  let numericValue = 0;

  if (typeof marketValue === "number") {
    numericValue = marketValue;
  } else if (typeof marketValue === "string") {
    const clean = marketValue.replace(/[^0-9]/g, ""); // strip commas, € symbols, spaces
    numericValue = parseInt(clean, 10);
  }

  // Invalid input protection
  if (!numericValue || isNaN(numericValue) || numericValue <= 0) return 0;

  // Safety: prevent insane values (e.g., user types "35000000000")
  if (numericValue > 100000000) return 0; // €100M upper sanity cap

  // -------- 2. FIXED BANDS (2026 ONWARD) --------
  const LPT_BANDS = [
    { limit: 240000, charge: 95 },
    { limit: 262500, charge: 95 },
    { limit: 315000, charge: 235 },
    { limit: 350000, charge: 333 },
    { limit: 420000, charge: 333 },
    { limit: 450000, charge: 428 },
    { limit: 525000, charge: 428 },
    { limit: 600000, charge: 523 },
    { limit: 700000, charge: 618 },
    { limit: 800000, charge: 713 },
    { limit: 950000, charge: 808 },
    { limit: 1050000, charge: 903 },
    { limit: 1200000, charge: 1094 },
    { limit: 1500000, charge: 1797 },
    { limit: 1750000, charge: 2502 },
    { limit: 2100000, charge: 3110 },
  ];

  if (numericValue <= 2100000) {
    for (const band of LPT_BANDS) {
      if (numericValue <= band.limit) return band.charge;
    }
  }

  // -------- 3. GRADUATED RATES (> €2.1m) --------
  const baseAtThreshold = 3147; // Official amount at €2.1m

  // Between €2.1m and €2.5m → 0.2%
  if (numericValue <= 2500000) {
    const excess = numericValue - 2100000;
    return Math.round(baseAtThreshold + excess * 0.002);
  }

  // Above €2.5m → 0.2% for first 400k + 0.24% above 2.5m
  const excess = numericValue - 2500000;
  return Math.round(baseAtThreshold + 800 + excess * 0.0024);
};

export const calculateInsurance = (price: number, propertyType: string, sqMeters: number, address: string): number => {
  // 1. Rebuild cost calculation
  // Rule: rebuildCost = squareMeters * 2000 (Standard reinstatement cost: €2,000 per m²)
  
  let rebuildCost = 0;
  
  if (sqMeters > 0) {
    rebuildCost = sqMeters * 2000;
  } 
  // Fallback: If no sqMeters, estimate rebuild cost from market price (approx 75% for structure)
  // This ensures the field isn't empty if the user hasn't entered area yet.
  else {
    return 0;
  }

  // 2. Insurance premium calculation
  // Formula: insurance = rebuildCost * 0.0012 (base) + rebuildCost * 0.0003 (risk)
  // Total effective premium = 0.15% of rebuild cost
  const insurance = rebuildCost * 0.0015;

  return Math.round(insurance);
};

export const calculateROI = (input: PropertyInput): AnalysisResult => {
  // Safe cast all inputs to numbers to handle empty strings ('') from UI
  const price = Number(input.price) || 0;
  const monthlyRent = Number(input.monthlyRent) || 0;
  const rehabCost = Number(input.rehabCost) || 0;
  const propertyTaxYearly = Number(input.propertyTaxYearly) || 0;
  const insuranceYearly = Number(input.insuranceYearly) || 0;
  const managementFeePercent = Number(input.managementFeePercent) || 0;
  const mortgageMonthly = Number(input.mortgageMonthly) || 0;

  // Initial Costs
  // Stamp Duty in Ireland: 1% up to 1m, 2% balance. Simplified to 1% for standard inputs.
  const stampDuty = price > 1000000 ? 10000 + (price - 1000000) * 0.02 : price * 0.01;
  const legalFees = 2500; // Average estimate
  const surveyCost = 500;
  const closingCosts = stampDuty + legalFees + surveyCost;
  const totalInvestment = price + closingCosts + rehabCost; // Assuming all cash for base calc, or deposit + costs

  // Income
  const annualGrossRent = monthlyRent * 12;

  // Expenses
  const managementFeeYearly = annualGrossRent * (managementFeePercent / 100);
  const maintenanceYearly = annualGrossRent * 0.05; // 5% maintenance reserve
  
  // Operating Expenses (Tax + Insurance + Mgmt + Maint)
  const totalOperatingExpenses = propertyTaxYearly + insuranceYearly + managementFeeYearly + maintenanceYearly;
  
  // Debt Service
  const annualDebtService = mortgageMonthly * 12;

  // Total Annual Outflow (Operating + Debt)
  const totalAnnualExpenses = totalOperatingExpenses + annualDebtService;
  const monthlyExpenses = totalAnnualExpenses / 12;

  // Returns
  const annualNetOperatingIncome = annualGrossRent - totalOperatingExpenses; // NOI excludes debt
  const annualCashFlow = annualNetOperatingIncome - annualDebtService; // Cashflow includes debt

  // Metrics - Ensure we don't divide by zero to avoid NaN/Infinity
  const grossYield = price > 0 ? (annualGrossRent / price) * 100 : 0;
  // Net Yield (often synonymous with Cap Rate in simple terms, or ROI on cost)
  const netYield = totalInvestment > 0 ? (annualNetOperatingIncome / totalInvestment) * 100 : 0;
  // Cap Rate (NOI / Price)
  const capRate = price > 0 ? (annualNetOperatingIncome / price) * 100 : 0;
  // Cash on Cash (Cashflow / Total Investment)
  // Note: For true Cash on Cash with leverage, Total Investment should strictly be Cash Invested (Deposit + Costs).
  // As we don't have explicit Deposit input, we assume TotalInvestment is the denominator for now, 
  // which makes this "Return on Total Capital" if fully leveraged, or standard CoC if cash purchase.
  const cashOnCash = totalInvestment > 0 ? (annualCashFlow / totalInvestment) * 100 : 0;

  return {
    grossYield,
    netYield,
    cashOnCash,
    annualCashFlow,
    monthlyCashFlow: annualCashFlow / 12,
    totalInvestment,
    monthlyExpenses,
    capRate
  };
};