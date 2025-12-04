import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Calendar, MapPin, ArrowRight, TrendingUp, Home, Search, ArrowUpDown } from 'lucide-react';
import { SavedProperty, PropertyInput } from '../types';
import { calculateROI, formatCurrency } from '../utils/calculations';

interface SavedAnalysisListProps {
  onLoad: (input: PropertyInput) => void;
  onNavigate: () => void;
}

const SavedAnalysisList: React.FC<SavedAnalysisListProps> = ({ onLoad, onNavigate }) => {
  const [savedItems, setSavedItems] = useState<SavedProperty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const loaded = localStorage.getItem('eirestate_saved');
    if (loaded) {
      try {
        const parsed = JSON.parse(loaded);
        if (Array.isArray(parsed)) {
          // Robust filtering: Ensure every item has an ID and an input object
          const validItems = parsed.filter((item: any) => 
            item && 
            typeof item === 'object' && 
            item.input && 
            typeof item.input === 'object'
          );
          setSavedItems(validItems.sort((a: SavedProperty, b: SavedProperty) => (b.timestamp || 0) - (a.timestamp || 0)));
        }
      } catch (e) {
        console.error("Failed to load saved items", e);
        // If local storage is corrupt, reset it to avoid persistent errors
        localStorage.setItem('eirestate_saved', '[]');
      }
    }
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = savedItems.filter(item => item.id !== id);
    setSavedItems(updated);
    localStorage.setItem('eirestate_saved', JSON.stringify(updated));
  };

  const handleLoad = (item: SavedProperty) => {
    if (item && item.input) {
      onLoad(item.input);
      onNavigate();
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    if (!savedItems) return [];

    let items = [...savedItems];

    // 1. Filter by Search Term (Address)
    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      items = items.filter(item => {
        // Safe access to address using optional chaining and nullish coalescing
        const address = item?.input?.address || '';
        return address.toLowerCase().includes(lowerTerm);
      });
    }

    // 2. Sort
    items.sort((a, b) => {
      // Safety check for inputs - if input is missing, treat as neutral/zero
      if (!a?.input || !b?.input) return 0;

      // Wrap calculations in try-catch to prevent crash during sort
      try {
        const analysisA = calculateROI(a.input);
        const analysisB = calculateROI(b.input);
        
        // Safe number parsing
        const priceA = Number(a.input.price) || 0;
        const priceB = Number(b.input.price) || 0;

        switch (sortBy) {
          case 'oldest':
            return (a.timestamp || 0) - (b.timestamp || 0);
          case 'yield_high':
            return analysisB.netYield - analysisA.netYield;
          case 'yield_low':
            return analysisA.netYield - analysisB.netYield;
          case 'cashflow_high':
            return analysisB.monthlyCashFlow - analysisA.monthlyCashFlow;
          case 'cashflow_low':
            return analysisA.monthlyCashFlow - analysisB.monthlyCashFlow;
          case 'price_high':
            return priceB - priceA;
          case 'price_low':
            return priceA - priceB;
          case 'newest':
          default:
            return (b.timestamp || 0) - (a.timestamp || 0);
        }
      } catch (err) {
        return 0;
      }
    });

    return items;
  }, [savedItems, searchTerm, sortBy]);

  if (savedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-200 shadow-sm text-center px-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-slate-50 p-6 rounded-full mb-6">
          <Home className="w-12 h-12 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No Saved Analyses</h3>
        <p className="text-slate-500 max-w-sm mb-8">
          You haven't saved any property analyses yet. Go to the Calculator to create and save your first one.
        </p>
        <button 
          onClick={onNavigate}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm"
        >
          Go to Calculator
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-900">Saved Analyses</h2>
           <p className="text-slate-500 text-sm mt-1">Manage and compare your property portfolio.</p>
        </div>
        <div className="bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium text-emerald-700 border border-emerald-100 self-start sm:self-center">
          {savedItems.length} Total
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Search - Emerald Theme applied */}
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
            <input 
              type="text" 
              placeholder="Search address..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400"
            />
          </div>

          {/* Sort By */}
          <div className="md:col-span-4">
              <div className="relative">
                 <ArrowUpDown className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                 <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white cursor-pointer hover:border-emerald-400 transition-colors appearance-none font-medium text-slate-700"
                >
                    <option value="newest">Sort: Newest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                    <option value="yield_high">Sort: Highest Yield</option>
                    <option value="yield_low">Sort: Lowest Yield</option>
                    <option value="cashflow_high">Sort: Highest Cashflow</option>
                    <option value="cashflow_low">Sort: Lowest Cashflow</option>
                    <option value="price_high">Sort: Highest Price</option>
                    <option value="price_low">Sort: Lowest Price</option>
                </select>
              </div>
          </div>
        </div>
      </div>

      {filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
           <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 mb-3">
             <Search className="w-5 h-5 text-slate-500" />
           </div>
           <h3 className="text-slate-900 font-medium">No matches found</h3>
           <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search term.</p>
           <button 
             onClick={() => {setSearchTerm('');}}
             className="mt-4 text-sm text-emerald-600 font-medium hover:text-emerald-700 hover:underline"
           >
             Clear all filters
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedItems.map((item) => {
            // Defensive Check: If item or input is missing, skip rendering to prevent crash
            if (!item || !item.input) return null;
            
            // Safe analysis calculation
            let analysis;
            try {
               analysis = calculateROI(item.input);
            } catch (e) {
               return null; // Skip invalid items
            }

            const date = new Date(item.timestamp || Date.now()).toLocaleDateString('en-IE', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });

            // Safe access for address
            const address = item.input?.address || 'Untitled Property';

            return (
              <div 
                key={item.id}
                onClick={() => handleLoad(item)}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col overflow-hidden"
              >
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-2 overflow-hidden">
                      <div className="bg-emerald-50 p-2 rounded-lg shrink-0 group-hover:bg-emerald-100 transition-colors">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 truncate pr-2" title={address}>
                          {address}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <Calendar className="w-3 h-3" />
                          {date}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="text-slate-300 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-colors z-10 shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Price</p>
                      <p className="font-bold text-slate-800">{formatCurrency(Number(item.input?.price) || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Net Yield</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp className={`w-3 h-3 ${analysis.netYield >= 5 ? 'text-emerald-500' : 'text-amber-500'}`} />
                        <p className={`font-bold ${analysis.netYield >= 5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {analysis.netYield.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 bg-slate-50 p-3 rounded-lg flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-500">Monthly Cashflow</span>
                      <span className={`font-bold ${analysis.monthlyCashFlow > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(analysis.monthlyCashFlow)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between group-hover:bg-emerald-50/50 transition-colors">
                  <span className="text-xs font-semibold text-slate-500 group-hover:text-emerald-700 transition-colors">Load Analysis</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transform group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedAnalysisList;