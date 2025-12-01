import React from 'react';
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  highlight?: boolean;
  tooltip?: string;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ title, value, subtext, trend, highlight, tooltip }) => {
  return (
    <div className={`p-5 rounded-xl border transition-all duration-200 ${
      highlight
        ? 'bg-emerald-50 border-emerald-200 shadow-md'
        : 'bg-white border-slate-200 hover:border-emerald-300'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-500 flex items-center gap-1">
          {title}
          {tooltip && (
            <span title={tooltip} className="cursor-help inline-flex items-center">
              <Info className="w-3 h-3 text-slate-400" />
            </span>
          )}
        </h3>
      </div>
      <div className={`text-2xl font-bold flex items-center gap-2 ${highlight ? 'text-emerald-900' : 'text-slate-900'}`}>
        {value}
        {trend === 'up' && <ArrowUpRight className="w-5 h-5 text-emerald-500" />}
        {trend === 'down' && <ArrowDownRight className="w-5 h-5 text-rose-500" />}
      </div>
      {subtext && (
        <p className="text-xs text-slate-500 mt-1">{subtext}</p>
      )}
    </div>
  );
};

export default MetricsCard;