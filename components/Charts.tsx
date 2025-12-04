import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie, ReferenceLine } from 'recharts';
import { AnalysisResult, PropertyInput, SensitivityItem } from '../types';
import { formatCurrency, calculateSensitivity } from '../utils/calculations';
import { Activity } from 'lucide-react';

interface ChartsProps {
  analysis: AnalysisResult;
  input: PropertyInput;
}

// Custom Tooltip for Monthly Breakdown to show expense details
const MonthlyBreakdownTooltip = ({ active, payload, label, input }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        
        // Calculate monthly values safely
        const monthlyTax = (Number(input.propertyTaxYearly) || 0) / 12;
        const monthlyInsurance = (Number(input.insuranceYearly) || 0) / 12;
        const annualGrossRent = (Number(input.monthlyRent) || 0) * 12;
        const monthlyMgmt = (annualGrossRent * ((Number(input.managementFeePercent) || 0) / 100)) / 12;
        const maintPercent = input.maintenanceReservePercent !== undefined && input.maintenanceReservePercent !== '' ? Number(input.maintenanceReservePercent) : 5;
        const monthlyMaint = (annualGrossRent * (maintPercent / 100)) / 12;
        const monthlyMortgage = Number(input.mortgageMonthly) || 0;
        const monthlyOther = (Number(input.otherExpensesYearly) || 0) / 12;

        // Detailed view for Expenses
        if (data.name === 'Expenses') {
            return (
                <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg min-w-[180px] text-xs z-50">
                    <p className="font-bold text-slate-800 mb-2">{data.name}</p>
                    <p className="text-xl font-bold text-rose-500 mb-2">{formatCurrency(data.amount)}</p>
                    <div className="space-y-1 text-slate-600 border-t border-slate-100 pt-2">
                        <div className="flex justify-between"><span>Mortgage:</span><span className="font-medium">{formatCurrency(monthlyMortgage)}</span></div>
                        <div className="flex justify-between"><span>LPT:</span><span className="font-medium">{formatCurrency(monthlyTax)}</span></div>
                        <div className="flex justify-between"><span>Insurance:</span><span className="font-medium">{formatCurrency(monthlyInsurance)}</span></div>
                        <div className="flex justify-between"><span>Mgmt Fee:</span><span className="font-medium">{formatCurrency(monthlyMgmt)}</span></div>
                         <div className="flex justify-between"><span>Maintenance ({maintPercent}%):</span><span className="font-medium">{formatCurrency(monthlyMaint)}</span></div>
                         <div className="flex justify-between"><span>Other:</span><span className="font-medium">{formatCurrency(monthlyOther)}</span></div>
                    </div>
                </div>
            );
        }

        // Standard tooltip for Income / Cashflow
        return (
            <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg">
                <p className="font-bold text-slate-800 mb-1">{data.name}</p>
                <p className="text-sm font-medium" style={{ color: data.color }}>
                    {formatCurrency(data.amount)}
                </p>
            </div>
        );
    }
    return null;
};

// Custom Tooltip for 5 Year Projection
const ProjectionTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg">
        <p className="font-bold text-slate-800 mb-2">{label}</p>
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-blue-500 font-medium">Annual Cashflow:</span>
            <span className="font-bold text-slate-700">{formatCurrency(data.cashflow)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-emerald-500 font-medium">Total Equity:</span>
            <span className="font-bold text-slate-700">{formatCurrency(data.equity)}</span>
            </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Expense Pie Chart
const ExpenseTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const entry = payload[0];

    const value = Number(entry.value);
    const data = entry.payload?.allData || [];
    const total = data.reduce((sum: number, item: any) => sum + Number(item.value || 0), 0);

    const percent =
        total > 0 ? ((value / total) * 100).toFixed(1) + "%" : "0%";

    return (
        <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg">
            <p className="font-bold text-slate-800 mb-1">{entry.name}</p>
            <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-600">{formatCurrency(value)}</span>
                <span className="font-bold text-slate-900">{percent}</span>
            </div>
        </div>
    );
};

// Custom Tooltip for Sensitivity Tornado Chart
const SensitivityTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg text-sm">
                <p className="font-bold text-slate-800 mb-2">{data.variable}</p>
                <div className="space-y-1">
                    <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Base Yield:</span>
                        <span className="font-medium text-slate-900">{data.base.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between gap-4 text-rose-600">
                        <span>Negative Scenario:</span>
                        <span className="font-bold">{Math.min(data.yieldLowInput, data.yieldHighInput).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between gap-4 text-emerald-600">
                        <span>Positive Scenario:</span>
                        <span className="font-bold">{Math.max(data.yieldLowInput, data.yieldHighInput).toFixed(2)}%</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

// Custom 2x2 Legend Component
const TwoByTwoLegend = ({ payload }: any) => {
  if (!payload || payload.length === 0) return null;

  const rows = [];
  for (let i = 0; i < payload.length; i += 2) {
    rows.push(payload.slice(i, i + 2));
  }

  return (
    <div className="flex flex-col items-center mt-4 space-y-2">
      {rows.map((row: any[], rowIndex: number) => (
        <div key={rowIndex} className="flex space-x-4">
          {row.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 min-w-[100px]">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              ></span>
              <span className="text-xs text-slate-700 font-medium whitespace-nowrap">{entry.value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const Charts: React.FC<ChartsProps> = ({ analysis, input }) => {
  const [activeYearIndex, setActiveYearIndex] = useState<number | null>(null);
  const [sensitivityData, setSensitivityData] = useState<any[] | null>(null);

  const handleRunSensitivity = () => {
      const results = calculateSensitivity(input);
      // Process data for the range bars
      // We want to display the deviation from the base.
      // Recharts range bar format: [min, max]
      const processed = results.map(item => {
          const vals = [item.yieldLowInput, item.yieldHighInput, item.base];
          const min = Math.min(...vals);
          const max = Math.max(...vals);
          
          // Determine ranges relative to base for coloring
          // If yield < base => "Bad" (Red)
          // If yield > base => "Good" (Green)
          // We can construct two bars: one for negative impact, one for positive
          
          const badVal = Math.min(item.yieldLowInput, item.yieldHighInput);
          const goodVal = Math.max(item.yieldLowInput, item.yieldHighInput);

          return {
              ...item,
              // If the 'bad' value is less than base, the bad range is [badVal, base]
              badRange: badVal < item.base ? [badVal, item.base] : null,
              // If the 'good' value is greater than base, the good range is [base, goodVal]
              goodRange: goodVal > item.base ? [item.base, goodVal] : null,
          };
      });
      setSensitivityData(processed);
  };

  const data = [
    { name: 'Income', amount: analysis.monthlyCashFlow + analysis.monthlyExpenses, color: '#81C784' }, // Pastel Green
    { name: 'Expenses', amount: analysis.monthlyExpenses, color: '#E57373' }, // Pastel Red
    { name: 'Cashflow', amount: analysis.monthlyCashFlow, color: '#64B5F6' }, // Pastel Blue
  ];

  // 5 Year Projection (Simple linear for demo)
  const projectionData = Array.from({ length: 5 }, (_, i) => ({
    year: `Year ${i + 1}`,
    equity: analysis.totalInvestment + (analysis.annualCashFlow * (i + 1)), // Very rough accumulation
    cashflow: analysis.annualCashFlow * Math.pow(1.03, i) // 3% growth
  }));

  // Expense Composition Data
  const monthlyTax = (Number(input.propertyTaxYearly) || 0) / 12;
  const monthlyInsurance = (Number(input.insuranceYearly) || 0) / 12;
  const annualGrossRent = (Number(input.monthlyRent) || 0) * 12;
  const monthlyMgmt = (annualGrossRent * ((Number(input.managementFeePercent) || 0) / 100)) / 12;
  const monthlyMortgage = Number(input.mortgageMonthly) || 0;
  
  const maintPercent = input.maintenanceReservePercent !== undefined && input.maintenanceReservePercent !== '' ? Number(input.maintenanceReservePercent) : 5;
  const monthlyMaint = (annualGrossRent * (maintPercent / 100)) / 12;
  const monthlyOther = (Number(input.otherExpensesYearly) || 0) / 12;

  const expenseData = [
      { name: 'Mortgage', value: monthlyMortgage, color: '#EF9A9A' },
      { name: 'Tax & Ins', value: monthlyTax + monthlyInsurance, color: '#9FA8DA' },
      { name: 'Mgmt Fee', value: monthlyMgmt, color: '#FFCC80' },
      { name: 'Maint', value: monthlyMaint, color: '#B39DDB' }, // Soft Purple
      { name: 'Other', value: monthlyOther, color: '#B0BEC5' }, // Blue Grey
  ].filter(item => item.value > 0);

  const totalMonthlyExpenses = expenseData.reduce((sum, item) => sum + item.value, 0);

  const formatAxisTick = (value: number) => {
    if (value === 0) return '€0';
    if (Math.abs(value) >= 1000) return `€${(value / 1000).toFixed(0)}k`;
    return `€${value}`;
  };

  const handleBarClick = (data: any, index: number) => {
      setActiveYearIndex(activeYearIndex === index ? null : index);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Monthly Breakdown</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis 
                  type="number" 
                  domain={[0, 'auto']} 
                  tickFormatter={formatAxisTick}
                  tick={{fontSize: 12, fill: '#64748b'}}
                />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip
                  cursor={{fill: 'transparent'}}
                  content={<MonthlyBreakdownTooltip input={input} />}
                />
                <Bar 
                  dataKey="amount" 
                  radius={[0, 4, 4, 0]} 
                  barSize={32}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">5-Year Cumulative Cashflow</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectionData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(val) => `€${(val/1000).toFixed(0)}k`} />
                <Tooltip content={<ProjectionTooltip />} cursor={{fill: '#f1f5f9'}} />
                <Bar 
                  dataKey="cashflow" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40} 
                  onClick={handleBarClick}
                  className="cursor-pointer"
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                    {projectionData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill="#64B5F6" 
                          fillOpacity={activeYearIndex === null || activeYearIndex === index ? 1 : 0.4}
                        />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Expenses</h3>
            <div className="h-80">
                {expenseData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                               data={expenseData.map(item => ({ ...item, allData: expenseData }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                animationDuration={1000}
                                animationEasing="ease-out"
                                  >
                                  {expenseData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                              </Pie>

                            <Tooltip content={<ExpenseTooltip />} />
                            <Legend content={<TwoByTwoLegend />} />
                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                                <tspan x="50%" dy="-10" fontSize="13" fill="#64748b" fontWeight="500">Monthly</tspan>
                                <tspan x="50%" dy="24" fontSize="16" fill="#1e293b" fontWeight="700">{formatCurrency(totalMonthlyExpenses)}</tspan>
                            </text>
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                        No expenses to display
                    </div>
                )}
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Sensitivity Analysis</h3>
                {!sensitivityData && (
                    <button 
                        onClick={handleRunSensitivity}
                        className="flex items-center gap-2 text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                        <Activity className="w-3 h-3" />
                        Run Analysis
                    </button>
                )}
                {sensitivityData && (
                     <button 
                        onClick={handleRunSensitivity}
                        className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        Refresh
                    </button>
                )}
            </div>
            
            <div className="flex-1 min-h-[300px] flex items-center justify-center">
                {!sensitivityData ? (
                    <div className="text-center text-slate-400">
                        <Activity className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Click "Run Analysis" to see how <br/>variables affect Net Yield.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            layout="vertical" 
                            data={sensitivityData} 
                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis 
                                type="number" 
                                domain={['auto', 'auto']} 
                                tickFormatter={(val) => `${val.toFixed(1)}%`}
                                tick={{fontSize: 12, fill: '#64748b'}}
                            />
                            <YAxis 
                                dataKey="variable" 
                                type="category" 
                                width={100} 
                                tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}} 
                            />
                            <Tooltip content={<SensitivityTooltip />} cursor={{fill: 'transparent'}} />
                            <ReferenceLine x={sensitivityData[0]?.base} stroke="#94a3b8" strokeDasharray="3 3" />
                            {/* Negative Impact Range (Red) */}
                            <Bar 
                                dataKey="badRange" 
                                fill="#E57373" 
                                radius={[4, 4, 4, 4]} 
                                barSize={20} 
                                animationDuration={1000} 
                                animationEasing="ease-out" 
                            />
                            {/* Positive Impact Range (Green) */}
                            <Bar 
                                dataKey="goodRange" 
                                fill="#81C784" 
                                radius={[4, 4, 4, 4]} 
                                barSize={20} 
                                animationDuration={1000} 
                                animationEasing="ease-out" 
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;