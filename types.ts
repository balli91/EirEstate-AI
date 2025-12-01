export interface PropertyInput {
  address: string;
  price: number | '';
  monthlyRent: number | '';
  rehabCost: number | '';
  propertyTaxYearly: number | '';
  insuranceYearly: number | '';
  managementFeePercent: number | '';
  mortgageMonthly: number | '';
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

export interface MarketInsight {
  summary: string;
  averageRentEstimate?: string;
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