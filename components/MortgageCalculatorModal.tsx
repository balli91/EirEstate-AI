import React, { useState, useEffect } from 'react';
import { X, Calculator, Euro, Calendar, Percent, Check, Info } from 'lucide-react';
import { calculateMortgagePayment, formatCurrency } from '../utils/calculations';

interface MortgageCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (monthlyPayment: number) => void;
  initialPrincipal: number;
}

const MortgageCalculatorModal: React.FC<MortgageCalculatorModalProps> = ({ isOpen, onClose, onApply, initialPrincipal }) => {
  // Initialize with empty string to show placeholder "0"
  const [principal, setPrincipal] = useState<number | ''>('');
  const [rate, setRate] = useState<number | ''>(''); 
  const [term, setTerm] = useState<number | ''>(''); 
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  // When opening, reset fields to empty so placeholder shows
  useEffect(() => {
    if (isOpen) {
      setPrincipal('');
      setRate('');
      setTerm('');
    }
  }, [isOpen]);

  // Recalculate whenever inputs change. Treat empty string as 0 for calculation.
  useEffect(() => {
    const p = principal === '' ? 0 : principal;
    const r = rate === '' ? 0 : rate;
    const t = term === '' ? 0 : term;
    setMonthlyPayment(calculateMortgagePayment(p, r, t));
  }, [principal, rate, term]);

  const handleApply = () => {
    onApply(monthlyPayment);
    onClose();
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number | ''>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setter('');
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        setter(num);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#335c4a] p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-400/20 p-1.5 rounded-lg">
              <Calculator className="w-5 h-5 text-emerald-100" />
            </div>
            <h3 className="font-bold text-lg">Mortgage Calculator</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Result Display */}
          <div className="bg-emerald-50 rounded-xl p-6 text-center border border-emerald-100 relative">
            <div className="absolute top-3 right-3 group">
                <Info className="w-4 h-4 text-emerald-400 cursor-help" />
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-10">
                    This is an estimate based on the inputs provided. Actual repayments may vary.
                </div>
            </div>
            <p className="text-sm font-medium text-emerald-600 uppercase mb-1">Estimated Monthly Repayment</p>
            <p className="text-4xl font-bold text-emerald-800">{formatCurrency(monthlyPayment)}</p>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            
            {/* Principal */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase truncate pr-1 mb-1">Loan Amount (€)</label>
              <div className="relative">
                <Euro className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                <input
                  type="number"
                  value={principal}
                  onChange={handleInputChange(setPrincipal)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Interest Rate */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase truncate pr-1 mb-1">Interest Rate (%)</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                  <input
                    type="number"
                    step="0.1"
                    value={rate}
                    onChange={handleInputChange(setRate)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Loan Term */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase truncate pr-1 mb-1">Term (Years)</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                  <input
                    type="number"
                    value={term}
                    onChange={handleInputChange(setTerm)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2">
            <button
              onClick={handleApply}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Check className="w-5 h-5" />
              Apply to Analysis
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MortgageCalculatorModal;