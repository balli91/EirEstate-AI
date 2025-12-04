
export interface PropertyInput {
  address: string;
  price: number | '';
  monthlyRent: number | '';
  rehabCost: number | '';
  propertyTaxYearly: number | '';
  insuranceYearly: number | '';
  managementFeePercent: number | '';
  mortgageMonthly: number | '';
  maintenanceReservePercent?: number | '';
  vacancyRate?: number | '';
  otherExpensesYearly?: number | '';
  description?: string;
  bedrooms?: number | '';
  bathrooms?: number | '';
  sqMeters?: number | '';
  propertyType?: string;
}

export interface AnalysisResult {
  grossYield: number;
  netYield: number;
  cashOnCash: number;
  annualCashFlow: number;
  monthlyCashFlow: number;
  totalInvestment: number;
  monthlyExpenses: number;
  capRate: number;
}

export interface SavedProperty {
  id: string;
  timestamp: number;
  input: PropertyInput;
}

export interface Contact {
  id: string;
  firstName: string;
  surname: string;
  profession: string;
  email: string;
  phone: string;
  address: string;
  eircode: string;
  notes: string;
  createdAt: number;
}

export interface SensitivityItem {
  variable: string;
  base: number;
  yieldLowInput: number; // Net Yield when the input variable is decreased
  yieldHighInput: number; // Net Yield when the input variable is increased
}

export interface MarketInsight {
  summary: string;
  rentRangeLow: number;
  rentRangeHigh: number;
  rentHistory: { year: string; price: number }[];
  demandLevel: 'Low' | 'Medium' | 'High';
  walkabilityScore: number;
  safetyScore: number;
  transitScore: number;
  pros: string[];
  cons: string[];
  groundingUrls: string[];
}

export enum LoadingState {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}