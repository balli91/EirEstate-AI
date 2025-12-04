
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Bell, 
  Save, 
  CreditCard, 
  LogOut, 
  Check,
  Globe,
  Briefcase,
  Hammer,
  DoorOpen,
  Euro
} from 'lucide-react';

interface SettingsProps {
  user: any;
  onLogin: () => void;
  onLogout: (e: any) => void;
  onSettingsChange?: (settings: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onLogin, onLogout, onSettingsChange }) => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Preferences State
  // UPDATED: Defaults match constants.ts (Mgmt 8, Maint 5, Vacancy 4)
  const [defaults, setDefaults] = useState({
    mgmtFee: '8',
    maintenance: '5',
    vacancy: '4',
    currency: 'EUR'
  });

  const [notifications, setNotifications] = useState({
    email: true,
    marketing: false
  });
  
  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem('eirestate_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDefaults(prev => ({...prev, ...(parsed.defaults || {})}));
        setNotifications(prev => ({...prev, ...(parsed.notifications || {})}));
      } catch (e) {}
    }
  }, []);

  const handleSave = () => {
    setLoading(true);
    const settingsObj = {
      defaults,
      notifications
    };
    
    // Simulate API save / Local persistence
    setTimeout(() => {
      localStorage.setItem('eirestate_settings', JSON.stringify(settingsObj));
      if (onSettingsChange) {
        onSettingsChange(settingsObj);
      }
      setLoading(false);
      setSuccessMsg('Settings saved successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-2">Manage your account, preferences, and default calculation values.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Account */}
            <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 text-center border-b border-slate-50">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-emerald-700">
                             {user?.avatar || <User className="w-8 h-8" />}
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">{user?.name || 'Guest'}</h2>
                        <p className="text-sm text-slate-500">{user?.email || 'Not signed in'}</p>
                        
                        {!user && (
                             <button 
                                onClick={onLogin}
                                className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors w-full"
                             >
                                Sign In / Sign Up
                             </button>
                        )}
                    </div>
                    {user && (
                        <div className="p-4 bg-slate-50">
                             <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-slate-500">Plan</span>
                                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-xs">{user.plan}</span>
                             </div>
                             <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Member Since</span>
                                <span className="font-medium text-slate-900">Feb 2024</span>
                             </div>
                             <button 
                                onClick={onLogout}
                                className="mt-4 w-full flex items-center justify-center gap-2 text-rose-600 text-sm font-medium hover:bg-rose-50 py-2 rounded-lg transition-colors"
                             >
                                <LogOut className="w-4 h-4" /> Sign Out
                             </button>
                        </div>
                    )}
                </div>

                {/* Theme & Region (Updated to match main page style) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-600" /> Regional
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Currency</label>
                            <div className="relative">
                                <Euro className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    value="EUR (€)" 
                                    readOnly
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-500 bg-slate-100 cursor-not-allowed select-none"
                                />
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Language</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    value="English" 
                                    readOnly
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-500 bg-slate-100 cursor-not-allowed select-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Preferences */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Calculator Defaults (Updated style) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                         <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-emerald-600" /> Default Values
                        </h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">Set default values for new property analyses to save time.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Management Fee (%)</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                                <input 
                                    type="number" 
                                    value={defaults.mgmtFee}
                                    onChange={(e) => setDefaults({...defaults, mgmtFee: e.target.value})}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Maintenance Reserve (%)</label>
                            <div className="relative">
                                <Hammer className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                                <input 
                                    type="number" 
                                    value={defaults.maintenance}
                                    onChange={(e) => setDefaults({...defaults, maintenance: e.target.value})}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vacancy Rate (%)</label>
                            <div className="relative">
                                <DoorOpen className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                                <input 
                                    type="number" 
                                    value={defaults.vacancy}
                                    onChange={(e) => setDefaults({...defaults, vacancy: e.target.value})}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-600" /> Notifications
                    </h3>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Email Reports</p>
                                    <p className="text-xs text-slate-500">Receive weekly summaries of your saved properties.</p>
                                </div>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={notifications.email}
                                onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                            />
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : successMsg ? 'Saved!' : 'Save Changes'}
                        {!loading && !successMsg && <Save className="w-4 h-4" />}
                        {successMsg && <Check className="w-4 h-4" />}
                    </button>
                </div>

            </div>
        </div>
    </div>
  );
};

export default Settings;
