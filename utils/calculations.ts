
import { PropertyInput, AnalysisResult, SensitivityItem } from '../types';
import { DEFAULT_PROPERTY } from '../constants';

export const formatCurrency = (value: number): string => {
  if (value === undefined || value === null || isNaN(value)) return '€0.00';
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const calculateLPT = (marketValue: number | string): number => {
  // 1. Parsing the property value
  let numericValue = 0;
  
  if (typeof marketValue === 'number') {
    numericValue = marketValue;
  } else if (typeof marketValue === 'string') {
    // Remove all non-numeric characters (digits only)
    const clean = marketValue.replace(/[^0-9]/g, '');
    // Convert to number
    numericValue = parseInt(clean, 10);
  }

  // Edge Case: Empty or invalid input
  if (isNaN(numericValue) || numericValue <= 0) {
    return 0;
  }

  // 2. Apply Official 2026+ LPT Rules
  let calculatedLPT = 0;

  if (numericValue > 2100000) {
    // Graduated rates for properties above €2.1m
    
    // Base LPT at €2.1m threshold is €3,147 
    const base = 3147;
    
    if (numericValue <= 2500000) {
      // 0.2% on the portion between €2.1m and €2.5m
      const excess = numericValue - 2100000;
      calculatedLPT = Math.round(base + (excess * 0.002));
    } else {
      // 0.2% on the full €400k band (2.1-2.5m) = €800
      // 0.24% on the portion above €2.5m
      const excess = numericValue - 2500000;
      calculatedLPT = Math.round(base + 800 + (excess * 0.0024));
    }

  } else {
    // Fixed Band Charges for properties <= €2.1m
    if (numericValue <= 200000) calculatedLPT = 90;
    else if (numericValue <= 262500) calculatedLPT = 95;
    else if (numericValue <= 350000) calculatedLPT = 206;
    else if (numericValue <= 437500) calculatedLPT = 317;
    else if (numericValue <= 525000) calculatedLPT = 428;
    else if (numericValue <= 612500) calculatedLPT = 504;
    else if (numericValue <= 700000) calculatedLPT = 580;
    else if (numericValue <= 787500) calculatedLPT = 656;
    else if (numericValue <= 875000) calculatedLPT = 732;
    else if (numericValue <= 962500) calculatedLPT = 808;
    else if (numericValue <= 1050000) calculatedLPT = 903;
    else if (numericValue <= 1137500) calculatedLPT = 998;
    else if (numericValue <= 1225000) calculatedLPT = 1094;
    else if (numericValue <= 1312500) calculatedLPT = 1269;
    else if (numericValue <= 1400000) calculatedLPT = 1444;
    else if (numericValue <= 1487500) calculatedLPT = 1619;
    else if (numericValue <= 1575000) calculatedLPT = 1797;
    else if (numericValue <= 1662500) calculatedLPT = 2015;
    else if (numericValue <= 1750000) calculatedLPT = 2233;
    else calculatedLPT = 3110; // 1.75m to 2.1m
  }

  return calculatedLPT;
};

export const calculateInsurance = (price: number, propertyType: string, sqMeters: number, address: string): number => {
  // 1. Rebuild cost calculation
  if (sqMeters > 0) {
    const rebuildCost = sqMeters * 2000;
    // 2. Insurance premium calculation
    // Total effective premium = 0.15% of rebuild cost
    return Math.round(rebuildCost * 0.0015);
  } 
  
  return 0;
};

export const calculateMortgagePayment = (principal: number, annualRatePercent: number, termYears: number): number => {
  if (principal <= 0 || termYears <= 0) return 0;
  if (annualRatePercent <= 0) return Math.round(principal / (termYears * 12)); // No interest case

  const monthlyRate = annualRatePercent / 100 / 12;
  const numberOfPayments = termYears * 12;

  // Formula: M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1 ]
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments);
  const denominator = Math.pow(1 + monthlyRate, numberOfPayments) - 1;
  const monthlyPayment = principal * (numerator / denominator);

  return Math.round(monthlyPayment);
};

export const calculateROI = (input: PropertyInput): AnalysisResult => {
  // Defensive check for missing input or input being null
  const safeInput = (input && typeof input === 'object') ? input : DEFAULT_PROPERTY;

  // Safe cast all inputs to numbers to handle empty strings ('') from UI
  // Use ?. operator to safely access properties even if safeInput is somehow malformed
  const price = Number(safeInput?.price) || 0;
  const monthlyRent = Number(safeInput?.monthlyRent) || 0;
  const rehabCost = Number(safeInput?.rehabCost) || 0;
  const propertyTaxYearly = Number(safeInput?.propertyTaxYearly) || 0;
  const insuranceYearly = Number(safeInput?.insuranceYearly) || 0;
  const managementFeePercent = Number(safeInput?.managementFeePercent) || 0;
  const mortgageMonthly = Number(safeInput?.mortgageMonthly) || 0;
  const otherExpensesYearly = Number(safeInput?.otherExpensesYearly) || 0;
  
  // Use provided maintenance percent, or default to 5 if undefined. 
  const maintenanceReservePercent = safeInput?.maintenanceReservePercent !== undefined && safeInput?.maintenanceReservePercent !== ''
    ? Number(safeInput.maintenanceReservePercent)
    : 5;

  // Use provided vacancy rate, or default to 5 if undefined
  const vacancyRate = safeInput?.vacancyRate !== undefined && safeInput?.vacancyRate !== ''
    ? Number(safeInput.vacancyRate)
    : 5;

  // Initial Costs
  // Stamp Duty in Ireland: 1% up to 1m, 2% balance. Simplified to 1% for standard inputs.
  const stampDuty = price > 1000000 ? 10000 + (price - 1000000) * 0.02 : price * 0.01;
  const legalFees = 2500; // Average estimate
  const surveyCost = 500;
  const closingCosts = stampDuty + legalFees + surveyCost;
  const totalInvestment = price + closingCosts + rehabCost; // Assuming all cash for base calc, or deposit + costs

  // Income
  const annualGrossRent = monthlyRent * 12;
  const vacancyLoss = annualGrossRent * (vacancyRate / 100);

  // Expenses
  const managementFeeYearly = annualGrossRent * (managementFeePercent / 100);
  const maintenanceYearly = annualGrossRent * (maintenanceReservePercent / 100);
  
  // Operating Expenses (Tax + Insurance + Mgmt + Maint + Other)
  const totalOperatingExpenses = propertyTaxYearly + insuranceYearly + managementFeeYearly + maintenanceYearly + otherExpensesYearly;
  
  // Debt Service
  const annualDebtService = mortgageMonthly * 12;

  // Total Annual Outflow (Operating + Debt)
  const totalAnnualExpenses = totalOperatingExpenses + annualDebtService;
  const monthlyExpenses = totalAnnualExpenses / 12;

  // Returns
  const annualNetOperatingIncome = annualGrossRent - vacancyLoss - totalOperatingExpenses; // NOI excludes debt, includes vacancy loss
  const annualCashFlow = annualNetOperatingIncome - annualDebtService; // Cashflow includes debt

  // Metrics - Ensure we don't divide by zero to avoid NaN/Infinity
  const grossYield = price > 0 ? (annualGrossRent / price) * 100 : 0;
  // Net Yield (often synonymous with Cap Rate in simple terms, or ROI on cost)
  const netYield = totalInvestment > 0 ? (annualNetOperatingIncome / totalInvestment) * 100 : 0;
  // Cap Rate (NOI / Price)
  const capRate = price > 0 ? (annualNetOperatingIncome / price) * 100 : 0;
  // Cash on Cash (Cashflow / Total Investment)
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

export const calculateSensitivity = (input: PropertyInput): SensitivityItem[] => {
  const safeInput = input || DEFAULT_PROPERTY;
  const baseResult = calculateROI(safeInput);
  const baseNetYield = baseResult.netYield;

  const results: SensitivityItem[] = [];

  // Helper to clone input safely
  const clone = (data: PropertyInput) => ({ ...data });

  // 1. Rent (+/- 10%)
  const rentLow = clone(safeInput);
  rentLow.monthlyRent = (Number(safeInput.monthlyRent) || 0) * 0.9;
  const rentHigh = clone(safeInput);
  rentHigh.monthlyRent = (Number(safeInput.monthlyRent) || 0) * 1.1;
  results.push({
    variable: 'Rent ±10%',
    base: baseNetYield,
    yieldLowInput: calculateROI(rentLow).netYield,
    yieldHighInput: calculateROI(rentHigh).netYield
  });

  // 2. Vacancy (+/- 5%)
  const currentVacancy = Number(safeInput.vacancyRate) || 5;
  const vacancyHigh = clone(safeInput); // More vacancy = Bad
  vacancyHigh.vacancyRate = currentVacancy + 5;
  const vacancyLow = clone(safeInput); // Less vacancy = Good
  vacancyLow.vacancyRate = Math.max(0, currentVacancy - 5);
  
  results.push({
    variable: 'Vacancy ±5%',
    base: baseNetYield,
    yieldLowInput: calculateROI(vacancyHigh).netYield, 
    yieldHighInput: calculateROI(vacancyLow).netYield
  });

  // 3. Management Fee (+/- 2%)
  const mgmtLow = clone(safeInput);
  mgmtLow.managementFeePercent = Math.max(0, (Number(safeInput.managementFeePercent) || 0) - 2);
  const mgmtHigh = clone(safeInput);
  mgmtHigh.managementFeePercent = (Number(safeInput.managementFeePercent) || 0) + 2;
  results.push({
    variable: 'Mgmt Fee ±2%',
    base: baseNetYield,
    yieldLowInput: calculateROI(mgmtHigh).netYield, 
    yieldHighInput: calculateROI(mgmtLow).netYield 
  });

  return results;
};