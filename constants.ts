export const DEFAULT_PROPERTY: any = {
  address: '',
  price: 0,
  monthlyRent: 0,
  rehabCost: 0,
  propertyTaxYearly: 0,
  insuranceYearly: 0,
  managementFeePercent: 0,
  mortgageMonthly: 0,
  description: '',
  bedrooms: 0,
  bathrooms: 0,
  sqMeters: 0,
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