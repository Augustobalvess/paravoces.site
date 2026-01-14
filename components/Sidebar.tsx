import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LayoutDashboard, CalendarDays, Users, Settings, Sparkles, Activity, Stethoscope, X, DollarSign } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface ProfileStatus {
  subscription_status?: string;
  trial_ends_at?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  // Props opcionais para compatibilidade antiga
  planStatus?: any;
  currentView?: any;
  setCurrentView?: any;
  niche?: any;
}

const CACHE_KEY = 'healthflow_profile_status';
const THEME_KEY = 'healthflow_theme';

const calculateTrialStatus = (trialEndsAt: string | undefined | null) => {
    const TOTAL_TRIAL_DAYS = 7;
    if (!trialEndsAt) {
        return { daysRemaining: 7, usagePercentage: 0, totalDays: TOTAL_TRIAL_DAYS, isActive: false };
    }
    const trialEnd = new Date(trialEndsAt);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const daysUsed = TOTAL_TRIAL_DAYS - daysRemaining;
    const usagePercentage = Math.min(100, (daysUsed / TOTAL_TRIAL_DAYS) * 100);
    return { daysRemaining, usagePercentage: Math.round(usagePercentage), totalDays: TOTAL_TRIAL_DAYS, isActive: daysRemaining > 0 };
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // -- ESTADOS DE TEMA (CLÍNICA, LOGO, COR) --
  const [theme, setTheme] = useState({
    clinicName: 'HealthFlow',
    logoUrl: null as string | null,
    brandColor: '#0ea5e9' // Azul padrão
  });

  // -- CARREGAR TEMA DO LOCALSTORAGE --
  const loadTheme = () => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setTheme({
        clinicName: parsed.clinicName || 'HealthFlow',
        logoUrl: parsed.logoUrl || null,
        brandColor: parsed.brandColor || '#0ea5e9'
      });
    } else {
        // Se não tiver no storage, tenta buscar do banco uma vez (fallback)
        fetchClinicInfo();
    }
  };

  const fetchClinicInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if(user) {
        const { data } = await supabase.from('profiles').select('clinic_name, logo_url, brand_color').eq('id', user.id).single();
        if(data) {
            const newTheme = {
                clinicName: data.clinic_name || 'HealthFlow',
                logoUrl: data.logo_url || null,
                brandColor: data.brand_color || '#0ea5e9'
            };
            setTheme(newTheme);
            localStorage.setItem(THEME_KEY, JSON.stringify(newTheme));
        }
    }
  };

  // -- LISTENERS DE ATUALIZAÇÃO --
  useEffect(() => {
    loadTheme();
    // Escuta o evento disparado pelo Settings.tsx
    window.addEventListener('themeUpdated', loadTheme);
    return () => window.removeEventListener('themeUpdated', loadTheme);
  }, []);

  // -- LÓGICA DO TRIAL (MANTIDA IGUAL) --
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  });
  const [userId, setUserId] = useState<string | null>(null); 
  const fetchUserProfile = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
        setUserId(authUser.id);
        const { data: profileDB } = await supabase.from('profiles').select('subscription_status, trial_ends_at').eq('id', authUser.id).single();
        if (profileDB) {
            setProfileStatus(profileDB);
            localStorage.setItem(CACHE_KEY, JSON.stringify(profileDB));
        }
    }
  }, []);
  useEffect(() => { fetchUserProfile(); }, [fetchUserProfile]);
  const isTrial = profileStatus?.subscription_status === 'trial';
  const { daysRemaining, usagePercentage, totalDays, isActive } = calculateTrialStatus(profileStatus?.trial_ends_at);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/agenda', label: 'Agenda', icon: CalendarDays },
    { path: '/finance', label: 'Financeiro', icon: DollarSign },
    { path: '/pacientes', label: 'Pacientes', icon: Users },
    { path: '/servicos', label: 'Serviços', icon: Sparkles },
    { path: '/colaboradores', label: 'Colaboradores', icon: Stethoscope },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={onClose} />
      )}

      <div className={`fixed top-0 left-0 h-screen bg-white border-r border-slate-200 z-50 shadow-xl md:shadow-none transition-transform duration-300 ease-in-out w-72 md:w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        
        {/* HEADER DA SIDEBAR COM LOGO E NOME DINÂMICOS */}
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center space-x-3 overflow-hidden">
            {theme.logoUrl ? (
                <img src={theme.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-100" />
            ) : (
                <div className="p-2 rounded-xl text-white shadow-sm" style={{ backgroundColor: theme.brandColor }}>
                    <Activity size={24} />
                </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate">{theme.clinicName}</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Gestão Inteligente</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
           {menuItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); onClose(); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group text-sm font-medium ${active ? 'bg-slate-50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    style={active ? { color: theme.brandColor, backgroundColor: `${theme.brandColor}15` } : {}}
                  >
                    <Icon size={20} className={active ? '' : 'text-slate-400 group-hover:text-slate-600'} style={active ? { color: theme.brandColor } : {}} />
                    <span>{item.label}</span>
                  </button>
                );
            })}
        </nav>
        
        <div className="p-4 border-t border-slate-100 mt-auto">
          <button 
            onClick={() => navigate('/configuracoes')}
            className={`flex items-center space-x-3 px-4 py-3.5 w-full transition-colors rounded-xl text-sm font-medium ${location.pathname.startsWith('/configuracoes') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Settings size={20} />
            <span>Configurações</span>
          </button>

          {isTrial && isActive && (
            <div className="mt-4 px-4 py-4 bg-slate-900 rounded-xl text-white shadow-lg shadow-slate-900/20 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-white">Trial Gratuito</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${daysRemaining <= 1 ? 'bg-red-500' : 'bg-white/20'}`}>
                      {daysRemaining <= 1 ? 'Último Dia' : 'Ativo'}
                  </span>
              </div>
              
              <div className="w-full bg-slate-700 h-1.5 rounded-full mb-2 overflow-hidden">
                <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${usagePercentage}%`, backgroundColor: theme.brandColor }}></div>
              </div>
              <p className="text-[10px] text-slate-400 flex justify-between">
                  <span className="text-white font-semibold">Restam {daysRemaining} dias</span>
                  <span className="text-slate-400">{totalDays} dias total</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;