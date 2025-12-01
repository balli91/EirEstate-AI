import { PropertyInput, AnalysisResult } from '../types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const calculateROI = (input: PropertyInput): AnalysisResult => {
  const {
    price,
    monthlyRent,
    rehabCost,
    propertyTaxYearly,
    insuranceYearly,
    managementFeePercent,
    mortgageMonthly = 0
  } = input;

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