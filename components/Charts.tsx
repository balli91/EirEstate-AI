import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AnalysisResult, PropertyInput } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ChartsProps {
  analysis: AnalysisResult;
  input: PropertyInput;
}

// Custom Tooltip for Monthly Breakdown to show expense details
const MonthlyBreakdownTooltip = ({ active, payload, label, input }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        
        // Detailed view for Expenses
        if (data.name === 'Expenses') {
            const monthlyTax = input.propertyTaxYearly / 12;
            const monthlyInsurance = input.insuranceYearly / 12;
            const annualGrossRent = input.monthlyRent * 12;
            const monthlyMgmt = (annualGrossRent * (input.managementFeePercent / 100)) / 12;
            const monthlyMaint = (annualGrossRent * 0.05) / 12;

            return (
                <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg min-w-[180px]">
                    <p className="font-bold text-slate-800 mb-2">{data.name}</p>
                    <p className="text-xl font-bold text-rose-500 mb-2">{formatCurrency(data.amount)}</p>
                    <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
                        <div className="flex justify-between">
                            <span>Property Tax:</span>
                            <span className="font-medium">{formatCurrency(monthlyTax)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Insurance:</span>
                            <span className="font-medium">{formatCurrency(monthlyInsurance)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Mgmt Fee:</span>
                            <span className="font-medium">{formatCurrency(monthlyMgmt)}</span>
                        </div>
                         <div className="flex justify-between">
                            <span>Maintenance (5%):</span>
                            <span className="font-medium">{formatCurrency(monthlyMaint)}</span>
                        </div>
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

const Charts: React.FC<ChartsProps> = ({ analysis, input }) => {
  const [activeYearIndex, setActiveYearIndex] = useState<number | null>(null);

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

  const formatAxisTick = (value: number) => {
    if (value === 0) return '€0';
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}k`;
    return `€${value}`;
  };

  const handleBarClick = (data: any, index: number) => {
      setActiveYearIndex(activeYearIndex === index ? null : index);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Monthly Breakdown</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              {/* Domain [0, 'auto'] ensures the axis starts at 0, preventing negative values from shifting the axis mid-chart */}
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
              <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={32}>
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
            <BarChart data={projectionData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
  );
};

export default Charts;