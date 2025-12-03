
import React, { useState, useEffect } from 'react';
import { PropertyInput, AnalysisResult, MarketInsight, LoadingState } from './types';
import { calculateROI, formatCurrency, calculateLPT, calculateInsurance } from './utils/calculations';
import { parsePropertyDescription, analyzeMarket } from './services/gemini';
import { DEFAULT_PROPERTY, PROPERTY_TYPES } from './constants';
import MetricsCard from './components/MetricsCard';
import Charts from './components/Charts';
import MortgageCalculatorModal from './components/MortgageCalculatorModal';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Calculator,
  Building,
  MapPin,
  Euro,
  Wrench,
  Sparkles,
  TrendingUp,
  Link as LinkIcon,
  Share2,
  Check,
  BedDouble,
  Maximize,
  Search,
  Loader2,
  Info,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Bath,
  Home,
  Banknote,
  Percent,
  Footprints,
  ShieldCheck,
  TrainFront,
  BarChart3
} from 'lucide-react';

// Helper component to render clean formatted text from AI output
const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;
  
  // Split by newlines to process line-by-line
  const lines = text.split('\n');

  return (
    <div className="text-sm text-slate-700 leading-relaxed space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1"></div>;

        // Detect headers marked with ### or **Title**
        const isHeader = trimmed.startsWith('###') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 60);
        
        if (isHeader) {
          const content = trimmed.replace(/^###\s*/, '').replace(/\*\*/g, '');
          return (
            <h4 key={i} className="font-bold text-slate-900 text-base mt-4 mb-1">
              {content}
            </h4>
          );
        }

        // Handle list items for better indentation
        if (trimmed.match(/^(\d+\.|-|\*)\s/)) {
             return <div key={i} className="ml-1 pl-3 border-l-2 border-slate-200">{trimmed}</div>
        }

        return <p key={i}>{trimmed}</p>;
      })}
    </div>
  );
};

// Reusable label component with tooltip icon
const InputLabel = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <div className="flex items-start justify-between mb-1 group">
    <label className="block text-xs font-semibold text-slate-500 uppercase truncate pr-1">
      {label}
    </label>
    <span title={tooltip} className="cursor-help">
       <Info className="w-3 h-3 text-slate-300 hover:text-emerald-500 transition-colors relative top-0.5" />
    </span>
  </div>
);

// Styled Progress Bar for Scores
const ScoreBar = ({ label, score, icon: Icon, colorClass }: { label: string, score: number, icon: any, colorClass: string }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-center text-xs mb-0.5">
      <div className="flex items-center gap-1.5 font-medium text-slate-700">
        <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
        {label}
      </div>
      <span className="font-bold text-slate-900">{score}/100</span>
    </div>
    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-1000 ${colorClass.replace('text-', 'bg-')}`} 
        style={{ width: `${score}%` }}
      />
    </div>
  </div>
);

// Skeleton loader for market insights
const MarketInsightSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
    <div className="flex items-center gap-2 mb-6">
      <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
      <div className="h-6 w-48 bg-slate-200 rounded"></div>
    </div>
    
    {/* Top Row: Rent & Chart */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
       <div className="space-y-3">
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
          <div className="h-10 w-48 bg-slate-200 rounded"></div>
          <div className="h-3 w-32 bg-slate-200 rounded"></div>
       </div>
       <div className="h-32 bg-slate-100 rounded-lg"></div>
    </div>

    {/* Scores Row */}
    <div className="grid grid-cols-3 gap-4 mb-8">
       <div className="h-12 bg-slate-100 rounded"></div>
       <div className="h-12 bg-slate-100 rounded"></div>
       <div className="h-12 bg-slate-100 rounded"></div>
    </div>

    {/* Pros/Cons */}
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="h-24 bg-slate-50 rounded border border-slate-100"></div>
      <div className="h-24 bg-slate-50 rounded border border-slate-100"></div>
    </div>

    {/* Summary */}
    <div className="space-y-2">
       <div className="h-3 w-full bg-slate-200 rounded"></div>
       <div className="h-3 w-5/6 bg-slate-200 rounded"></div>
       <div className="h-3 w-4/5 bg-slate-200 rounded"></div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [formData, setFormData] = useState<PropertyInput>(DEFAULT_PROPERTY);
  const [analysis, setAnalysis] = useState<AnalysisResult>(calculateROI(DEFAULT_PROPERTY));
  const [marketInsight, setMarketInsight] = useState<MarketInsight | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [pasteText, setPasteText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const [shareSuccess, setShareSuccess] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isMortgageModalOpen, setIsMortgageModalOpen] = useState(false);

  // Hydrate from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.toString()) {
      const newFormData: any = { ...DEFAULT_PROPERTY };
      let hasUpdates = false;
      
      params.forEach((value, key) => {
        if (key in newFormData) {
          if (typeof newFormData[key] === 'number') {
             const num = parseFloat(value);
             if (!isNaN(num)) {
               newFormData[key] = num;
               hasUpdates = true;
             }
          } else {
             newFormData[key] = value;
             hasUpdates = true;
          }
        }
      });
      
      if (hasUpdates) {
        setFormData(newFormData);
      }
    }
  }, []);

  // Auto-calculate LPT when price changes
  useEffect(() => {
    const price = Number(formData.price);
    
    // Debug log for LPT calc verification
    // console.log("Calculating LPT for price:", price);

    if (price > 0) {
      const updatedLPT = calculateLPT(price);
      // console.log("Calculated LPT:", updatedLPT);

      // Only update if the value is different to avoid infinite loops
      if (formData.propertyTaxYearly !== updatedLPT) {
        setFormData(prev => ({
          ...prev,
          propertyTaxYearly: updatedLPT
        }));
      }
    } else {
      // If price is 0 or empty, clear LPT if it's not already cleared
      if (formData.propertyTaxYearly !== '') {
         setFormData(prev => ({
          ...prev,
          propertyTaxYearly: ''
        }));
      }
    }
  }, [formData.price]);

  // Auto-calculate Insurance
  // Changed logic: Only depend on sqMeters. Price is ignored.
  useEffect(() => {
    const sqMeters = Number(formData.sqMeters);
    const type = formData.propertyType || 'House';
    const address = formData.address || '';
    
    if (sqMeters > 0) {
      // We pass 0 for price as it's not used in calculation anymore
      const updatedInsurance = calculateInsurance(0, type, sqMeters, address);
      if (formData.insuranceYearly !== updatedInsurance) {
        setFormData(prev => ({ ...prev, insuranceYearly: updatedInsurance }));
      }
    } else if (formData.insuranceYearly !== '') {
        setFormData(prev => ({ ...prev, insuranceYearly: '' }));
    }
  }, [formData.sqMeters, formData.propertyType, formData.address]);

  // Recalculate whenever form data changes
  useEffect(() => {
    // Comprehensive validation before calculating
    const newErrors: {[key: string]: string} = {};
    
    // Convert inputs to numbers for validation checks (handling empty strings)
    const monthlyRent = Number(formData.monthlyRent);
    const rehabCost = Number(formData.rehabCost);
    const bedrooms = Number(formData.bedrooms);
    const bathrooms = Number(formData.bathrooms);
    const sqMeters = Number(formData.sqMeters);
    const tax = Number(formData.propertyTaxYearly);
    const insurance = Number(formData.insuranceYearly);
    const fee = Number(formData.managementFeePercent);
    const mortgage = Number(formData.mortgageMonthly);

    // Core Financials - Relaxed validation for real-time calc
    if (monthlyRent < 0) newErrors.monthlyRent = "Rent cannot be negative";
    if (rehabCost < 0) newErrors.rehabCost = "Cost cannot be negative";
    
    // Property Specs
    if (bedrooms < 0) newErrors.bedrooms = "Bedrooms cannot be negative";
    if (bathrooms < 0) newErrors.bathrooms = "Bathrooms cannot be negative";
    if (sqMeters < 0) newErrors.sqMeters = "Area cannot be negative";
    
    // Expenses
    if (tax < 0) newErrors.propertyTaxYearly = "Tax cannot be negative";
    if (insurance < 0) newErrors.insuranceYearly = "Insurance cannot be negative";
    if (fee < 0) newErrors.managementFeePercent = "Fee cannot be negative";
    if (mortgage < 0) newErrors.mortgageMonthly = "Mortgage cannot be negative";
    
    setErrors(newErrors);

    // Always calculate. calculateROI handles division by zero gracefully.
    setAnalysis(calculateROI(formData));
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle text fields normally
    if (name === 'address' || name === 'description' || name === 'propertyType') {
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }

    // Handle numeric fields
    if (value === '') {
      // Allow empty string to clear the field
      setFormData(prev => ({ ...prev, [name]: '' }));
    } else {
      // Allow only integer inputs (positive numbers)
      if (/^\d+$/.test(value)) {
        // Parse int to remove leading zeros, but allow the user to type naturally
        setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) }));
      }
    }
  };

  const handleSmartFill = async () => {
    const trimmedInput = pasteText.trim();
    if (!trimmedInput) return;

    // Validation: Check if it's a daft.ie URL
    // Allows https://www.daft.ie/... or https://daft.ie/...
    const daftUrlRegex = /^https?:\/\/(www\.)?daft\.ie\/for-sale\/.+/i;
    
    if (!daftUrlRegex.test(trimmedInput)) {
      setParseError("Please enter a valid 'daft.ie/for-sale/' URL.");
      return;
    }

    setLoadingState(LoadingState.PARSING);
    setParseError(null);
    try {
      const parsedData = await parsePropertyDescription(trimmedInput);
      
      console.log("Imported data:", parsedData);
      console.log("Updating state fields...");

      setFormData(prev => {
        // Start fresh with default property values to clear any previous data
        const nextState = { ...DEFAULT_PROPERTY };

        // Overwrite with parsed data
        if (parsedData.address) nextState.address = parsedData.address;
        if (parsedData.price !== undefined) nextState.price = parsedData.price;
        if (parsedData.bedrooms !== undefined) nextState.bedrooms = parsedData.bedrooms;
        if (parsedData.bathrooms !== undefined) nextState.bathrooms = parsedData.bathrooms;
        if (parsedData.sqMeters !== undefined) nextState.sqMeters = parsedData.sqMeters;
        if (parsedData.propertyType) nextState.propertyType = parsedData.propertyType;
        if (parsedData.monthlyRent !== undefined) nextState.monthlyRent = parsedData.monthlyRent;
        if (parsedData.description) nextState.description = parsedData.description;

        // Automatically recalculate LPT based on the imported price to ensure strict accuracy
        const priceNum = Number(nextState.price);
        if (priceNum > 0) {
            nextState.propertyTaxYearly = calculateLPT(priceNum);
        } else {
            nextState.propertyTaxYearly = 0;
        }

        // Independent calculation for insurance based on sqMeters (ignores price)
        const sqMetersNum = Number(nextState.sqMeters);
        if (sqMetersNum > 0) {
             nextState.insuranceYearly = calculateInsurance(0, nextState.propertyType || 'House', sqMetersNum, nextState.address);
        } else {
             nextState.insuranceYearly = 0;
        }

        return nextState;
      });

      setActiveTab('manual'); 
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || "Failed to extract data. Please try again or enter details manually.");
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleMarketAnalysis = async () => {
    setLoadingState(LoadingState.ANALYZING);
    try {
      const insight = await analyzeMarket(
        formData.address || "Dublin, Ireland",
        `${formData.bedrooms || 2}-bed ${formData.propertyType || 'House'}`,
        Number(formData.price) || 0
      );
      setMarketInsight(insight);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleShare = async () => {
    // Construct URL with query params
    const params = new URLSearchParams();
    (Object.keys(formData) as Array<keyof PropertyInput>).forEach(key => {
      const value = formData[key];
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    // Focus window to help browser security checks for clipboard/share
    window.focus();

    // Use Web Share API if available, otherwise copy to clipboard
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EirEstate Property Analysis',
          text: `Check out this ROI calculation for ${formData.address || 'this property'}`,
          url: shareUrl,
        });
      } catch (err) {
        // Fallback if user cancels or share fails
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 2000);
        } catch (clipboardErr) {
             console.error("Clipboard write failed", clipboardErr);
        }
      }
    } else {
      try {
          await navigator.clipboard.writeText(shareUrl);
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 2000);
       } catch (clipboardErr) {
          console.error("Clipboard write failed", clipboardErr);
       }
    }
  };

  // Handler for applying mortgage calculation
  const handleMortgageApply = (monthlyPayment: number) => {
    setFormData(prev => ({ ...prev, mortgageMonthly: monthlyPayment }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Navbar with Pastel Dark Green */}
      <nav className="bg-[#335c4a] text-white shadow-lg sticky top-0 z-50 relative overflow-hidden">
        {/* Decorative background element to match sidebar cards */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-800 rounded-full opacity-50 blur-2xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6 text-emerald-300" />
            <span className="text-xl font-bold tracking-tight">ÉirEstate AI</span>
          </div>
          <div className="text-sm text-emerald-100 hidden sm:block">
            Intelligent Irish Property Investment
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Property Analysis</h1>
            <p className="text-slate-500 mt-2">Calculate ROI, yield, and get smart market insights instantly with ÉirEstate AI.</p>
          </div>
          <button
            onClick={handleShare}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border shadow-sm font-medium transition-all duration-200 ${
              shareSuccess 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-emerald-300'
            }`}
          >
            {shareSuccess ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {shareSuccess ? 'Link Copied!' : 'Share Analysis'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Input Form */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                    activeTab === 'manual' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Calculator className="w-4 h-4" /> Manual Input
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                    activeTab === 'ai' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" /> Smart Import
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'ai' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Paste a property link from <strong>Daft.ie</strong> below. <br /> The app will extract details automatically.
                    </p>
                    <textarea
                      className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium placeholder-slate-400 text-emerald-700 bg-emerald-50 disabled:bg-slate-50 disabled:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-normal"
                      placeholder="https://www.daft.ie/for-sale/..."
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      disabled={loadingState === LoadingState.PARSING}
                    ></textarea>
                    
                    {parseError && (
                      <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>{parseError}</p>
                      </div>
                    )}

                    <button
                      onClick={handleSmartFill}
                      disabled={loadingState === LoadingState.PARSING}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {loadingState === LoadingState.PARSING ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Listing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> Import Details
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Purchase Details Section */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Purchase Details</h4>
                      <div className="space-y-3">
                        <div>
                          <InputLabel label="Address / Location" tooltip="The full address or general area of the property" />
                          <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                            <input
                              type="text"
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50"
                              placeholder="e.g. 12 High St, Galway"
                            />
                          </div>
                        </div>

                        {/* LINE 1: Price - Rehab Cost */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <InputLabel label="Price (€)" tooltip="The purchase price of the property" />
                            <div className="relative">
                              <Euro className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                placeholder="0"
                                className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.price ? 'border-rose-500' : 'border-slate-300'}`}
                              />
                            </div>
                            {/* Validation message removed to allow 0 value */}
                          </div>
                          <div>
                             <InputLabel label="Rehab Costs (€)" tooltip="Estimated costs for renovations or repairs" />
                             <div className="relative">
                              <Wrench className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                name="rehabCost"
                                value={formData.rehabCost}
                                onChange={handleInputChange}
                                placeholder="0"
                                className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.rehabCost ? 'border-rose-500' : 'border-slate-300'}`}
                              />
                            </div>
                            {errors.rehabCost && <p className="text-xs text-rose-500 mt-1">{errors.rehabCost}</p>}
                          </div>
                        </div>

                        {/* LINE 2: Bedrooms - Bathrooms */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <InputLabel label="Bedrooms" tooltip="Number of bedrooms" />
                            <div className="relative">
                              <BedDouble className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                name="bedrooms"
                                value={formData.bedrooms !== undefined ? formData.bedrooms : ''}
                                onChange={handleInputChange}
                                placeholder="0"
                                className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.bedrooms ? 'border-rose-500' : 'border-slate-300'}`}
                              />
                            </div>
                            {errors.bedrooms && <p className="text-xs text-rose-500 mt-1">{errors.bedrooms}</p>}
                          </div>
                          <div>
                            <InputLabel label="Bathrooms" tooltip="Number of bathrooms" />
                            <div className="relative">
                              <Bath className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                name="bathrooms"
                                value={formData.bathrooms !== undefined ? formData.bathrooms : ''}
                                onChange={handleInputChange}
                                placeholder="0"
                                className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.bathrooms ? 'border-rose-500' : 'border-slate-300'}`}
                              />
                            </div>
                            {errors.bathrooms && <p className="text-xs text-rose-500 mt-1">{errors.bathrooms}</p>}
                          </div>
                        </div>
                        
                        {/* LINE 3: Sq. Meters - Type */}
                         <div className="grid grid-cols-2 gap-3">
                          <div>
                            <InputLabel label="Sq. Meters" tooltip="Total floor area in square meters" />
                            <div className="relative">
                              <Maximize className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                name="sqMeters"
                                value={formData.sqMeters !== undefined ? formData.sqMeters : ''}
                                onChange={handleInputChange}
                                placeholder="0"
                                className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.sqMeters ? 'border-rose-500' : 'border-slate-300'}`}
                              />
                            </div>
                            {errors.sqMeters && <p className="text-xs text-rose-500 mt-1">{errors.sqMeters}</p>}
                          </div>
                          <div>
                            <InputLabel label="Property Type" tooltip="The type of the property" />
                            <div className="relative">
                              <Home className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                              <select
                                name="propertyType"
                                value={formData.propertyType}
                                onChange={handleInputChange}
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 appearance-none"
                              >
                                {PROPERTY_TYPES.map(type => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rental Income Section */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Rental Income</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                            <InputLabel label="Est. Rent (€)" tooltip="Expected monthly rental income" />
                            <div className="relative">
                              <Euro className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                              <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              name="monthlyRent"
                              value={formData.monthlyRent}
                              onChange={handleInputChange}
                              placeholder="0"
                              className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.monthlyRent ? 'border-rose-500' : 'border-slate-300'}`}
                              />
                            </div>
                            {errors.monthlyRent && <p className="text-xs text-rose-500 mt-1">{errors.monthlyRent}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Operating Expenses Section */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Operating Expenses</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <InputLabel label="Property Tax (€)" tooltip="Annual Local Property Tax (LPT) - Auto-calculated based on price" />
                          <div className="relative">
                            <Euro className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              name="propertyTaxYearly"
                              value={formData.propertyTaxYearly}
                              readOnly
                              placeholder="0"
                              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-500 bg-slate-100 cursor-not-allowed select-none"
                              title="Auto-calculated based on property value bands"
                            />
                          </div>
                        </div>
                        <div>
                          <InputLabel label="Insurance (€)" tooltip="Annual property insurance cost" />
                          <div className="relative">
                            <Euro className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              name="insuranceYearly"
                              value={formData.insuranceYearly}
                              readOnly
                              placeholder="0"
                              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-500 bg-slate-100 cursor-not-allowed select-none"
                              title="Auto-calculated based on price, type, and size"
                            />
                          </div>
                        </div>
                        <div>
                          <InputLabel label="Mortgage (€)" tooltip="Monthly mortgage repayment" />
                          <div className="relative">
                            <Euro className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              name="mortgageMonthly"
                              value={formData.mortgageMonthly !== undefined ? formData.mortgageMonthly : ''}
                              onChange={handleInputChange}
                              placeholder="0"
                              className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.mortgageMonthly ? 'border-rose-500' : 'border-slate-300'}`}
                            />
                          </div>
                          {errors.mortgageMonthly && <p className="text-xs text-rose-500 mt-1">{errors.mortgageMonthly}</p>}
                        </div>
                        <div>
                          <InputLabel label="Mgmt Fee (%)" tooltip="Property management fee percentage (of rent)" />
                          <div className="relative">
                            <Percent className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              name="managementFeePercent"
                              value={formData.managementFeePercent}
                              onChange={handleInputChange}
                              placeholder="0"
                              className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.managementFeePercent ? 'border-rose-500' : 'border-slate-300'}`}
                            />
                          </div>
                          {errors.managementFeePercent && <p className="text-xs text-rose-500 mt-1">{errors.managementFeePercent}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mortgage Calculator Trigger (Swapped position & styled as dark green) */}
            <div className="bg-[#335c4a] rounded-xl p-6 text-white shadow-md relative overflow-hidden mb-6 group transition-colors">
               <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-800 rounded-full opacity-50 blur-2xl pointer-events-none"></div>
               <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                 <div className="bg-emerald-50 p-1.5 rounded-lg">
                    <Calculator className="w-5 h-5 text-emerald-600" />
                 </div>
                 Mortgage Calculator
               </h3>
               <p className="text-emerald-100 text-sm mb-4">
                 Calculate your monthly mortgage repayments based on loan amount, term, and interest rate.
               </p>
               <button
                onClick={() => setIsMortgageModalOpen(true)}
                className="w-full bg-white text-emerald-900 hover:bg-emerald-50 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
               >
                 Open Calculator
               </button>
            </div>

            {/* AI Insight Trigger - (Swapped position & styled as white) */}
            <div className="bg-[#335c4a] rounded-xl p-6 text-white shadow-md relative overflow-hidden mb-6 group transition-colors">
               <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-800 rounded-full opacity-50 blur-2xl pointer-events-none"></div>
               <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                 <div className="bg-emerald-50 p-1.5 rounded-lg">
                    <Search className="w-5 h-5 text-emerald-600" />
                 </div>
                 Market Intelligence
               </h3>
               <p className="text-emerald-100 text-sm mb-4">
                 Use smart analysis to analyze rental demand and validate your pricing for this location.
               </p>
               <button
                onClick={handleMarketAnalysis}
                disabled={loadingState === LoadingState.ANALYZING}
                className="w-full bg-white text-emerald-900 hover:bg-emerald-50 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
               >
                 {loadingState === LoadingState.ANALYZING ? (
                   <Loader2 className="w-4 h-4 animate-spin" />
                 ) : (
                   'Analyze Location'
                 )}
               </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Results Dashboard */}
          <div className="lg:col-span-8 space-y-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricsCard
                title="Gross Yield"
                value={`${analysis.grossYield.toFixed(2)}%`}
                trend={analysis.grossYield > 7 ? 'up' : analysis.grossYield < 4 ? 'down' : 'neutral'}
                tooltip="Annual Rent / Purchase Price"
              />
              <MetricsCard
                title="Net Yield"
                value={`${analysis.netYield.toFixed(2)}%`}
                subtext="After expenses"
                tooltip="Net Income / Total Investment"
              />
              <MetricsCard
                title="Cash-on-Cash"
                value={`${analysis.cashOnCash.toFixed(2)}%`}
                tooltip="Annual Cashflow / Total Cash Invested"
              />
              <MetricsCard
                title="Monthly Flow"
                value={formatCurrency(Math.floor(analysis.monthlyCashFlow))}
                trend={analysis.monthlyCashFlow > 0 ? 'up' : 'down'}
                tooltip="Net Monthly Profit"
              />
            </div>

            {/* Charts Section */}
            <Charts analysis={analysis} input={formData} />

            {/* AI Insights Result Section */}
            {loadingState === LoadingState.ANALYZING ? (
              <MarketInsightSkeleton />
            ) : marketInsight ? (
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-slate-800">AI Market Intelligence</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    marketInsight.demandLevel === 'High' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    marketInsight.demandLevel === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {marketInsight.demandLevel} Demand
                  </div>
                </div>

                {/* Row 1: Rent Estimates & Trends */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Est. Rent Block */}
                    <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 flex flex-col justify-between">
                         <div>
                            <h4 className="text-xs font-bold text-indigo-500 uppercase mb-2">Est. Monthly Rent</h4>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-indigo-900">{formatCurrency(marketInsight.rentRangeLow)}</span>
                                <span className="text-indigo-400 font-medium">-</span>
                                <span className="text-xl font-bold text-indigo-700">{formatCurrency(marketInsight.rentRangeHigh)}</span>
                            </div>
                         </div>
                         <p className="text-xs text-indigo-600/80 mt-3">
                            Based on comparable {formData.bedrooms || '2'}-bed properties in the area.
                         </p>
                    </div>

                    {/* Historical Trend Chart */}
                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm relative overflow-hidden">
                         <div className="flex items-center justify-between mb-2">
                             <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <BarChart3 className="w-3 h-3" /> 3-Year Rental Trend
                             </h4>
                         </div>
                         <div className="h-24 w-full">
                           {marketInsight.rentHistory && marketInsight.rentHistory.length > 0 ? (
                               <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={marketInsight.rentHistory}>
                                      <defs>
                                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                          </linearGradient>
                                      </defs>
                                      <Tooltip 
                                        contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px'}}
                                        formatter={(value: number) => [formatCurrency(value), 'Avg Rent']}
                                      />
                                      <Area 
                                        type="monotone" 
                                        dataKey="price" 
                                        stroke="#6366f1" 
                                        strokeWidth={2}
                                        fillOpacity={1} 
                                        fill="url(#colorPrice)"
                                        animationDuration={1500}
                                        animationEasing="ease-in-out"
                                      />
                                  </AreaChart>
                               </ResponsiveContainer>
                           ) : (
                               <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">No trend data available</div>
                           )}
                         </div>
                    </div>
                </div>

                {/* Row 2: Livability Scores */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 p-5 bg-slate-50 rounded-xl border border-slate-100">
                   <ScoreBar 
                      label="Walkability" 
                      score={marketInsight.walkabilityScore} 
                      icon={Footprints} 
                      colorClass="text-emerald-500" 
                   />
                   <ScoreBar 
                      label="Safety Index" 
                      score={marketInsight.safetyScore} 
                      icon={ShieldCheck} 
                      colorClass="text-blue-500" 
                   />
                   <ScoreBar 
                      label="Transit" 
                      score={marketInsight.transitScore} 
                      icon={TrainFront} 
                      colorClass="text-purple-500" 
                   />
                </div>

                {/* Row 3: Pros & Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Pros */}
                    <div>
                         <h4 className="text-xs font-bold text-emerald-700 uppercase mb-3 flex items-center gap-1.5 border-b border-emerald-100 pb-2">
                             <ThumbsUp className="w-3.5 h-3.5" /> Investment Pros
                         </h4>
                         <ul className="space-y-2">
                             {marketInsight.pros && marketInsight.pros.length > 0 ? (
                                 marketInsight.pros.slice(0, 4).map((pro, i) => (
                                     <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                         <Check className="w-3.5 h-3.5 text-emerald-500 mt-1 shrink-0" />
                                         <span>{pro}</span>
                                     </li>
                                 ))
                             ) : (
                                 <li className="text-slate-400 text-sm italic">No pros identified</li>
                             )}
                         </ul>
                    </div>

                    {/* Cons */}
                    <div>
                         <h4 className="text-xs font-bold text-rose-700 uppercase mb-3 flex items-center gap-1.5 border-b border-rose-100 pb-2">
                             <ThumbsDown className="w-3.5 h-3.5" /> Investment Risks
                         </h4>
                         <ul className="space-y-2">
                             {marketInsight.cons && marketInsight.cons.length > 0 ? (
                                 marketInsight.cons.slice(0, 4).map((con, i) => (
                                     <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                         <AlertCircle className="w-3.5 h-3.5 text-rose-500 mt-1 shrink-0" />
                                         <span>{con}</span>
                                     </li>
                                 ))
                             ) : (
                                 <li className="text-slate-400 text-sm italic">No risks identified</li>
                             )}
                         </ul>
                    </div>
                </div>

                {/* Formatted Content */}
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Executive Summary</h4>
                  <FormattedText text={marketInsight.summary} />
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-8 text-center">
                 <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                    <TrendingUp className="w-6 h-6 text-slate-400" />
                 </div>
                 <h3 className="text-slate-900 font-medium">No Market Analysis Yet</h3>
                 <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                   Run the smart analysis to get real-time rental estimates, pros/cons, and data sources for {formData.address || "this location"}.
                 </p>
              </div>
            )}
          </div>
        </div>

        {/* Mortgage Calculator Modal */}
        <MortgageCalculatorModal 
          isOpen={isMortgageModalOpen} 
          onClose={() => setIsMortgageModalOpen(false)}
          onApply={handleMortgageApply}
          initialPrincipal={Number(formData.price) || 0}
        />
      </main>
    </div>
  );
};

export default App;