import React, { useState, useEffect } from 'react';
import { PropertyInput, AnalysisResult, MarketInsight, LoadingState, SavedProperty } from './types';
import { calculateROI, formatCurrency, calculateLPT, calculateInsurance } from './utils/calculations';
import { parsePropertyDescription } from './services/smartImport';
import { analyzeMarket } from './services/gemini';
import { DEFAULT_PROPERTY } from './constants';
import MortgageCalculatorModal from './components/MortgageCalculatorModal';
import LoginModal from './components/LoginModal';
import SavedAnalysisList from './components/SavedAnalysisList';
import CalculatorView from './components/Calculator';
import Settings from './components/Settings';
import MarketNews from './components/MarketNews';
import TrustedContacts from './components/TrustedContacts';
import {
  Calculator,
  Building,
  Menu,
  Settings as SettingsIcon,
  User,
  LogOut,
  Bookmark,
  FileText,
  Users
} from 'lucide-react';

const App: React.FC = () => {
  // Initialize with DEFAULT_PROPERTY to ensure no undefined fields
  const [formData, setFormData] = useState<PropertyInput>({ ...DEFAULT_PROPERTY });
  const [analysis, setAnalysis] = useState<AnalysisResult>(calculateROI(DEFAULT_PROPERTY));
  const [marketInsight, setMarketInsight] = useState<MarketInsight | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [pasteText, setPasteText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const [shareSuccess, setShareSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isMortgageModalOpen, setIsMortgageModalOpen] = useState(false);
  
  // Navigation State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('calculator');

  // Auth State
  const [user, setUser] = useState<{name: string, email: string, plan: string, avatar: string} | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const navItems = [
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'saved', label: 'Saved Analysis', icon: Bookmark },
    { id: 'contacts', label: 'Trusted Contacts', icon: Users },
    { id: 'page3', label: 'Market News', icon: FileText },
    { id: 'page4', label: 'Settings', icon: SettingsIcon },
  ];

  const navigateTo = (pageId: string) => {
    setCurrentPage(pageId);
    setIsSidebarOpen(false);
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = (e: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setUser(null);
    // Optional: Clear settings on logout if strict profile separation is needed
    // localStorage.removeItem('eirestate_settings'); 
  };

  // Helper to apply settings to form data
  const applySettingsToForm = (settings: any) => {
    if (!settings || !settings.defaults) return;
    const { defaults } = settings;
    
    setFormData(prev => ({
      ...prev,
      managementFeePercent: defaults.mgmtFee !== undefined && defaults.mgmtFee !== '' ? Number(defaults.mgmtFee) : prev.managementFeePercent,
      maintenanceReservePercent: defaults.maintenance !== undefined && defaults.maintenance !== '' ? Number(defaults.maintenance) : prev.maintenanceReservePercent,
      vacancyRate: defaults.vacancy !== undefined && defaults.vacancy !== '' ? Number(defaults.vacancy) : prev.vacancyRate
    }));
  };

  // Hydrate from URL params and Settings on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const savedSettings = localStorage.getItem('eirestate_settings');

    if (params.toString()) {
      // Priority 1: URL Params (Share Link)
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
    } else {
      // Priority 2: User Settings (if no params)
      if (savedSettings) {
         try {
           const parsedSettings = JSON.parse(savedSettings);
           applySettingsToForm(parsedSettings);
         } catch(e) {
           console.error("Error parsing settings", e);
         }
      }
      // Fallback: DEFAULT_PROPERTY (already set in useState)
    }
  }, []);

  const handleSettingsChange = (newSettings: any) => {
    applySettingsToForm(newSettings);
  };

  // Auto-calculate LPT when price changes
  useEffect(() => {
    if (!formData) return;

    const price = Number(formData.price);
    if (price > 0) {
      const updatedLPT = calculateLPT(price);
      if (formData.propertyTaxYearly !== updatedLPT) {
        setFormData(prev => {
          if (!prev) return { ...DEFAULT_PROPERTY, propertyTaxYearly: updatedLPT };
          return { ...prev, propertyTaxYearly: updatedLPT };
        });
      }
    } else {
      if (formData.propertyTaxYearly !== '') {
         setFormData(prev => {
           if (!prev) return DEFAULT_PROPERTY;
           return { ...prev, propertyTaxYearly: '' };
         });
      }
    }
  }, [formData?.price]);

  // Auto-calculate Insurance
  useEffect(() => {
    if (!formData) return;

    const sqMeters = Number(formData.sqMeters);
    const type = formData.propertyType || 'House';
    const address = formData.address || '';
    
    if (sqMeters > 0) {
      const updatedInsurance = calculateInsurance(0, type, sqMeters, address);
      if (formData.insuranceYearly !== updatedInsurance) {
        setFormData(prev => {
          if (!prev) return { ...DEFAULT_PROPERTY, insuranceYearly: updatedInsurance };
          return { ...prev, insuranceYearly: updatedInsurance };
        });
      }
    } else if (formData.insuranceYearly !== '') {
        setFormData(prev => {
          if (!prev) return DEFAULT_PROPERTY;
          return { ...prev, insuranceYearly: '' };
        });
    }
  }, [formData?.sqMeters, formData?.propertyType, formData?.address]);

  // Recalculate whenever form data changes
  useEffect(() => {
    const currentData = formData || DEFAULT_PROPERTY;

    const newErrors: {[key: string]: string} = {};
    const monthlyRent = Number(currentData.monthlyRent);
    const rehabCost = Number(currentData.rehabCost);
    const bedrooms = Number(currentData.bedrooms);
    const bathrooms = Number(currentData.bathrooms);
    const sqMeters = Number(currentData.sqMeters);
    const tax = Number(currentData.propertyTaxYearly);
    const insurance = Number(currentData.insuranceYearly);
    const fee = Number(currentData.managementFeePercent);
    const mortgage = Number(currentData.mortgageMonthly);
    const maintenance = Number(currentData.maintenanceReservePercent);
    const vacancy = Number(currentData.vacancyRate);
    const other = Number(currentData.otherExpensesYearly);

    if (monthlyRent < 0) newErrors.monthlyRent = "Rent cannot be negative";
    if (rehabCost < 0) newErrors.rehabCost = "Cost cannot be negative";
    if (bedrooms < 0) newErrors.bedrooms = "Bedrooms cannot be negative";
    if (bathrooms < 0) newErrors.bathrooms = "Bathrooms cannot be negative";
    if (sqMeters < 0) newErrors.sqMeters = "Area cannot be negative";
    if (tax < 0) newErrors.propertyTaxYearly = "Tax cannot be negative";
    if (insurance < 0) newErrors.insuranceYearly = "Insurance cannot be negative";
    if (fee < 0) newErrors.managementFeePercent = "Fee cannot be negative";
    if (mortgage < 0) newErrors.mortgageMonthly = "Mortgage cannot be negative";
    if (maintenance < 0) newErrors.maintenanceReservePercent = "Maintenance cannot be negative";
    if (vacancy < 0) newErrors.vacancyRate = "Vacancy cannot be negative";
    if (other < 0) newErrors.otherExpensesYearly = "Expenses cannot be negative";
    
    setErrors(newErrors);
    setAnalysis(calculateROI(currentData));
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    const { name, value } = e.target;
    if (name === 'address' || name === 'description' || name === 'propertyType') {
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }
    if (value === '') {
      setFormData(prev => ({ ...prev, [name]: '' }));
    } else {
      if (/^\d*\.?\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleSmartFill = async () => {
    const trimmedInput = pasteText.trim();
    if (!trimmedInput) return;
    const daftUrlRegex = /^https?:\/\/(www\.)?daft\.ie\/for-sale\/.+/i;
    
    if (!daftUrlRegex.test(trimmedInput)) {
      setParseError("Please enter a valid 'daft.ie/for-sale/' URL.");
      return;
    }

    setLoadingState(LoadingState.PARSING);
    setParseError(null);
    try {
      const parsedData = await parsePropertyDescription(trimmedInput);
      setFormData(prev => {
        const safePrev = prev || { ...DEFAULT_PROPERTY };
        const nextState = { ...safePrev };
        
        if (parsedData.address) nextState.address = parsedData.address;
        if (parsedData.price !== undefined) nextState.price = parsedData.price;
        if (parsedData.bedrooms !== undefined) nextState.bedrooms = parsedData.bedrooms;
        if (parsedData.bathrooms !== undefined) nextState.bathrooms = parsedData.bathrooms;
        if (parsedData.sqMeters !== undefined) nextState.sqMeters = parsedData.sqMeters;
        if (parsedData.propertyType) nextState.propertyType = parsedData.propertyType;
        if (parsedData.monthlyRent !== undefined) nextState.monthlyRent = parsedData.monthlyRent;
        if (parsedData.description) nextState.description = parsedData.description;

        const priceNum = Number(nextState.price);
        if (priceNum > 0) {
            nextState.propertyTaxYearly = calculateLPT(priceNum);
        } else {
            nextState.propertyTaxYearly = 0;
        }

        const sqMetersNum = Number(nextState.sqMeters);
        if (sqMetersNum > 0) {
             nextState.insuranceYearly = calculateInsurance(0, nextState.propertyType || 'House', sqMetersNum, nextState.address || '');
        } else {
             nextState.insuranceYearly = 0;
        }

        return nextState;
      });
      setActiveTab('manual'); 
    } catch (err: any) {
      setParseError(err.message || "Failed to extract data. Please try again or enter details manually.");
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleMarketAnalysis = async () => {
    const currentData = formData || DEFAULT_PROPERTY;
    
    setLoadingState(LoadingState.ANALYZING);
    try {
      const insight = await analyzeMarket(
        currentData.address || "Dublin, Ireland",
        `${currentData.bedrooms || 2}-bed ${currentData.propertyType || 'House'}`,
        Number(currentData.price) || 0
      );
      setMarketInsight(insight);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleShare = async () => {
    if (!formData) return;
    const params = new URLSearchParams();
    (Object.keys(formData) as Array<keyof PropertyInput>).forEach(key => {
      const value = formData[key];
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleSaveAnalysis = () => {
    if (!formData) return;
    
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    const newSave: SavedProperty = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      input: formData
    };

    const existing = localStorage.getItem('eirestate_saved');
    let saves: SavedProperty[] = [];
    if (existing) {
      try {
        saves = JSON.parse(existing);
      } catch (e) { saves = []; }
    }
    
    saves.push(newSave);
    localStorage.setItem('eirestate_saved', JSON.stringify(saves));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleLoadSaved = (input: PropertyInput) => {
    if (input && typeof input === 'object') {
      setFormData({ ...DEFAULT_PROPERTY, ...input });
    } else {
      console.error("Attempted to load invalid property input");
    }
  };

  const handleMortgageApply = (amount: number) => {
    setFormData(prev => ({
      ...prev,
      mortgageMonthly: amount
    }));
  };

  return (
    <div className="flex min-h-screen font-sans text-slate-900 bg-slate-50">
      
      {/* Sidebar (Desktop) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">ÉirEstate AI</h1>
                <p className="text-xs text-slate-400">Invest smarter.</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  currentPage === item.id 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${currentPage === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            {user ? (
               <div className="bg-slate-800 rounded-xl p-3 flex items-center justify-between group cursor-pointer" onClick={(e) => {
                  navigateTo('page4');
               }}>
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                      {user.avatar}
                   </div>
                   <div className="overflow-hidden">
                     <p className="text-sm font-bold text-white truncate w-24">{user.name}</p>
                     <p className="text-xs text-emerald-400">{user.plan}</p>
                   </div>
                 </div>
                 <button 
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Sign Out"
                 >
                   <LogOut className="w-4 h-4" />
                 </button>
               </div>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl flex items-center gap-3 transition-colors"
              >
                <div className="bg-slate-700 p-1.5 rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Sign In</p>
                  <p className="text-xs text-slate-400">Sync your portfolio</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 p-1.5 rounded-lg">
                <Building className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900">ÉirEstate</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {currentPage === 'calculator' && (
            <CalculatorView 
              formData={formData || DEFAULT_PROPERTY}
              analysis={analysis}
              marketInsight={marketInsight}
              loadingState={loadingState}
              errors={errors}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              pasteText={pasteText}
              setPasteText={setPasteText}
              parseError={parseError}
              onInputChange={handleInputChange}
              onSmartFill={handleSmartFill}
              onMarketAnalysis={handleMarketAnalysis}
              onSaveAnalysis={handleSaveAnalysis}
              onShare={handleShare}
              onOpenMortgageModal={() => setIsMortgageModalOpen(true)}
              saveSuccess={saveSuccess}
              shareSuccess={shareSuccess}
            />
          )}

          {currentPage === 'saved' && (
            <SavedAnalysisList 
              onLoad={handleLoadSaved}
              onNavigate={() => navigateTo('calculator')}
            />
          )}

          {currentPage === 'contacts' && (
            <TrustedContacts />
          )}

          {currentPage === 'page3' && (
            <MarketNews />
          )}

          {currentPage === 'page4' && (
             <Settings 
                user={user} 
                onLogin={() => setIsLoginModalOpen(true)} 
                onLogout={handleLogout} 
                onSettingsChange={handleSettingsChange}
             />
          )}

        </div>
      </main>

      <MortgageCalculatorModal 
        isOpen={isMortgageModalOpen}
        onClose={() => setIsMortgageModalOpen(false)}
        onApply={handleMortgageApply}
        initialPrincipal={Number(formData?.price) || 0}
      />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />

    </div>
  );
};

export default App;