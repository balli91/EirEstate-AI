
export const DEFAULT_PROPERTY: any = {
  address: '',
  price: '',
  monthlyRent: '',
  rehabCost: '',
  propertyTaxYearly: '',
  insuranceYearly: '',
  managementFeePercent: '',
  mortgageMonthly: '',
  maintenanceReservePercent: 5,
  vacancyRate: 5,
  otherExpensesYearly: '',
  description: '',
  bedrooms: '',
  bathrooms: '',
  sqMeters: '',
  propertyType: 'House'
};

export const MOCK_CHART_DATA = [
  { name: 'Year 1', value: 10000 },
  { name: 'Year 2', value: 12500 },
  { name: 'Year 3', value: 15000 },
  { name: 'Year 5', value: 22000 },
  { name: 'Year 10', value: 45000 },
];

export const IRELAND_COUNTIES = [
  "Carlow", "Cavan", "Clare", "Cork", "Donegal", "Dublin", "Galway", "Kerry", "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary", "Waterford", "Westmeath", "Wexford", "Wicklow"
];

export const PROPERTY_TYPES = [
  { value: 'House', label: 'House' },
  { value: 'Detached House', label: 'Detached' },
  { value: 'Semi-Detached House', label: 'Semi-D' },
  { value: 'Terraced House', label: 'Terraced' },
  { value: 'End of Terrace House', label: 'End of Terrace' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'Apartment', label: 'Apartment' },
  { value: 'Studio Apartment', label: 'Studio' },
  { value: 'Duplex', label: 'Duplex' },
  { value: 'Bungalow', label: 'Bungalow' },
  { value: 'Site', label: 'Site' }
];