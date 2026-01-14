import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  User,
  CreditCard,
  Shield,
  LogOut,
  Edit3,
  X,
  Save,
  Calendar,
  Menu,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  Lock,
  Mail,
  LifeBuoy,
  MessageCircle,
  Crown,
  AlertTriangle,
  ChevronRight,
  Palette,
  Plus 
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

// --- Types
interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  clinic_name?: string;
  phone?: string;
  cpf?: string;
  avatar_url?: string | null;
  role?: string;
  subscription_status?: string;
  trial_ends_at?: string;
  clinic_id?: string;
  brand_color?: string;
  logo_url?: string;
}

// Cores da Marca
const BRAND_COLORS = [
  '#0ea5e9', // Azul (Padrão)
  '#10b981', // Verde
  '#6366f1', // Roxo Azulado
  '#f43f5e', // Rosa
  '#8b5cf6', // Roxo
  '#f59e0b', // Laranja
  '#0099ff', // Azul Custom
];

// --- Util: compress image
const compressImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 300;
        const scale = max / Math.max(img.width, img.height);
        const width = img.width > max ? img.width * scale : img.width;
        const height = img.height > max ? img.height * scale : img.height;
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });

// --- Component
const Settings: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const colorInputRef = useRef<HTMLInputElement | null>(null); 

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Inicializa o form com os valores padrão para não quebrar
  const [formData, setFormData] = useState({
    full_name: '',
    clinic_name: '',
    phone: '',
    cpf: '',
    email: '',
    avatar_url: '' as string | null,
    brand_color: '#0ea5e9',
    logo_url: '' as string | null
  });

  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  const showNotification = useCallback((msg: string) => {
    setToast({ show: true, msg });
    window.setTimeout(() => setToast({ show: false, msg: '' }), 4000);
  }, []);

  const maskCPF = useCallback((value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }, []);

  const maskPhone = useCallback((value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2');
  }, []);

  // Upload genérico (funciona para avatar e logo)
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar_url' | 'logo_url' = 'avatar_url') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImage(file);
      setFormData(prev => ({ ...prev, [field]: b64 }));
    } catch (err) {
      console.error('compress error', err);
      alert('Erro ao processar imagem.');
    }
  }, []);

  // --- BUSCAR DADOS DO PERFIL ---
  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const authUser = data?.user ?? null;
      if (!authUser) {
        setUser(null);
        return;
      }

      const metadata = (authUser as any).user_metadata ?? {};
      const { data: profileDB, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileErr && profileErr.code !== 'PGRST116') {
        console.warn('profile fetch error', profileErr);
      }

      // Prepara objeto com dados do banco ou fallback
      const profileData: UserProfile = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: profileDB?.full_name || metadata.full_name || '',
        clinic_name: profileDB?.clinic_name || metadata.clinic_name || '',
        phone: profileDB?.phone || metadata.phone || '',
        cpf: profileDB?.cpf || metadata.cpf || '',
        avatar_url: profileDB?.avatar_url || metadata.avatar_url || null,
        role: 'admin',
        subscription_status: profileDB?.subscription_status || 'trial',
        trial_ends_at: profileDB?.trial_ends_at ?? undefined,
        clinic_id: profileDB?.clinic_id ?? undefined,
        brand_color: profileDB?.brand_color || '#0ea5e9',
        logo_url: profileDB?.logo_url || null
      };

      setUser(profileData);
      
      setFormData({
        full_name: profileData.full_name,
        clinic_name: profileData.clinic_name || '',
        phone: profileData.phone ? maskPhone(profileData.phone) : '',
        cpf: profileData.cpf ? maskCPF(profileData.cpf) : '',
        email: profileData.email,
        avatar_url: profileData.avatar_url ?? null,
        brand_color: profileData.brand_color || '#0ea5e9', 
        logo_url: profileData.logo_url || null
      });

    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
    } finally {
      setTimeout(() => setLoading(false), 250);
    }
  }, [maskCPF, maskPhone]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // --- SALVAR PERFIL (CORRIGIDO COM UPSERT) ---
  const handleSaveProfile = useCallback(
    async (e: React.FormEvent | React.MouseEvent) => {
      e.preventDefault();
      if (passwords.newPassword && passwords.newPassword !== passwords.confirmPassword) {
        alert('As senhas não coincidem.');
        return;
      }

      try {
        const updates: any = { data: { ...formData } };

        if (formData.email && formData.email !== user?.email) updates.email = formData.email;
        if (passwords.newPassword) updates.password = passwords.newPassword;

        // 1. Atualiza Auth
        const { error: authError } = await supabase.auth.updateUser(updates);
        if (authError) throw authError;

        // 2. Atualiza Profile usando UPSERT (Garante criação se não existir)
        const { error: profileErr } = await supabase
          .from('profiles')
          .upsert({
            id: user?.id, // ID é obrigatório para upsert
            full_name: formData.full_name,
            clinic_name: formData.clinic_name,
            phone: formData.phone,
            cpf: formData.cpf,
            avatar_url: formData.avatar_url,
            brand_color: formData.brand_color,
            logo_url: formData.logo_url,
            updated_at: new Date().toISOString()
          });

        if (profileErr) {
            console.error('Erro ao salvar profile:', profileErr);
            throw profileErr;
        }

        // 3. Atualiza Clinics (se necessário)
        const targetId = user?.clinic_id || user?.id;
        if (targetId) {
          const { error: clinicErr } = await supabase
            .from('clinics')
            .update({ name: formData.clinic_name })
            .eq('id', targetId);
          if (clinicErr) console.warn('clinic update warning', clinicErr);
        }

        // 4. Atualiza LocalStorage para mudança imediata
        const themeData = {
            clinicName: formData.clinic_name,
            logoUrl: formData.logo_url,
            brandColor: formData.brand_color
        };
        localStorage.setItem('healthflow_theme', JSON.stringify(themeData));
        window.dispatchEvent(new Event('themeUpdated'));

        if (passwords.newPassword) {
          showNotification('Senha alterada com sucesso!');
          setPasswords({ newPassword: '', confirmPassword: '' });
        } else if (formData.email !== user?.email) {
          showNotification('Verifique seu novo e-mail para confirmação.');
        } else {
          showNotification('Configurações salvas com sucesso!');
        }

        setIsEditing(false);
        // Recarrega dados após um breve delay para garantir persistência
        setTimeout(() => fetchUserProfile(), 500);

      } catch (err: any) {
        console.error('save error', err);
        alert('Erro ao atualizar: ' + (err?.message ?? String(err)));
      }
    },
    [formData, passwords, user, fetchUserProfile, showNotification]
  );

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/');
  }, [navigate]);

  const getDaysRemaining = useCallback(() => {
    if (!user?.trial_ends_at) return 0;
    const end = new Date(user.trial_ends_at).getTime();
    const diff = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [user]);

  const getNextBillingDate = useCallback(() => {
    if (!user?.trial_ends_at) return '...';
    return new Date(user.trial_ends_at).toLocaleDateString('pt-BR');
  }, [user]);

  const handleAddCard = useCallback(() => {
    alert('Integração com Gateway de Pagamento (Adicionar Cartão) será aberta aqui.');
  }, []);

  const handleWhatsAppSupport = useCallback(() => {
    const message = 'Olá, preciso de ajuda com o HealthFlow.';
    window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(message)}`, '_blank');
  }, []);

  const SettingsSkeleton = () => (
    <div className="animate-pulse w-full max-w-5xl">
      <div className="h-8 bg-slate-200 rounded-lg w-48 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 h-[400px]" />
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 h-[250px]" />
          <div className="bg-white p-6 rounded-2xl border border-slate-100 h-[150px]" />
        </div>
      </div>
    </div>
  );

  const setField = (key: keyof typeof formData, value: string | null) =>
    setFormData(prev => ({ ...prev, [key]: value ?? '' }));

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 md:ml-64 p-4 md:p-8 h-screen overflow-y-auto">
        {loading ? (
          <>
            <header className="flex items-center gap-4 mb-8 md:hidden">
              <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400">
                <Menu size={24} />
              </button>
            </header>
            <SettingsSkeleton />
          </>
        ) : (
          <>
            <header className="flex items-center gap-4 mb-8">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-white border border-slate-200 rounded-lg text-slate-600">
                <Menu size={24} />
              </button>
              <h2 className="text-2xl font-bold text-slate-900">Configurações da Conta</h2>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl items-start">
              
              {/* === COLUNA ESQUERDA (PERFIL + IDENTIDADE VISUAL) === */}
              <div className="space-y-6">
                
                {/* 1. CARD PERFIL */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative animate-in fade-in">
                  <div className="flex items-center gap-4 mb-6">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl border-2 border-white shadow-sm">
                        {user?.full_name?.charAt(0) ?? 'U'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{user?.full_name}</h3>
                      <p className="text-slate-500 text-sm">{user?.email}</p>
                    </div>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="flex justify-center mb-4">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="relative w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors overflow-hidden group"
                        >
                          <input ref={fileInputRef} type="file" onChange={(e) => handleFileUpload(e, 'avatar_url')} accept="image/*" className="hidden" />
                          {formData.avatar_url ? (
                            <>
                              <img src={formData.avatar_url} className="w-full h-full object-cover" alt="Preview" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ImageIcon className="text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center text-slate-400">
                              <Upload size={20} />
                              <span className="text-[10px] mt-1">Alterar Foto</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Nome Completo</label>
                        <input className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.full_name} onChange={e => setField('full_name', e.target.value)} />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Telefone</label>
                        <input className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.phone} onChange={e => setField('phone', maskPhone(e.target.value))} maxLength={15} placeholder="(00) 00000-0000" />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">CPF</label>
                        <input className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.cpf} onChange={e => setField('cpf', maskCPF(e.target.value))} maxLength={14} placeholder="000.000.000-00" />
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                          <Shield size={16} /> Segurança
                        </h4>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">E-mail de Acesso</label>
                            <div className="relative">
                              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.email} onChange={e => setField('email', e.target.value)} />
                            </div>
                            {formData.email !== user?.email && <p className="text-[10px] text-amber-600 mt-1">Confirmação necessária.</p>}
                          </div>

                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Nova Senha</label>
                            <div className="relative">
                              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input type="password" className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Deixe em branco para não alterar" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} />
                            </div>
                          </div>

                          {passwords.newPassword && (
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Confirmar Nova Senha</label>
                              <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="password" className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Repita a nova senha" value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <button type="button" onClick={() => { setIsEditing(false); setPasswords({ newPassword: '', confirmPassword: '' }); }} className="flex-1 py-2.5 bg-slate-50 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancelar</button>
                        <button type="submit" className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"><Save size={16} /> Salvar</button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="flex justify-between border-b border-slate-50 pb-3">
                        <span className="text-slate-500 text-sm">Clínica</span>
                        <span className="font-medium text-slate-900 text-sm">{user?.clinic_name || 'Não informado'}</span>
                      </div>

                      <div className="flex justify-between border-b border-slate-50 pb-3">
                        <span className="text-slate-500 text-sm">Telefone</span>
                        <span className="font-medium text-slate-900 text-sm">{user?.phone || 'Não informado'}</span>
                      </div>

                      <div className="flex justify-between border-b border-slate-50 pb-3">
                        <span className="text-slate-500 text-sm">CPF</span>
                        <span className="font-medium text-slate-900 text-sm">{user?.cpf || 'Não informado'}</span>
                      </div>

                      <button onClick={() => setIsEditing(true)} className="w-full mt-4 text-slate-700 text-sm font-medium border border-slate-200 hover:bg-slate-50 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                        <Edit3 size={16} /> Editar Perfil
                      </button>
                    </div>
                  )}
                </div>
                
                {/* 2. CARD: IDENTIDADE VISUAL COM SELETOR CUSTOMIZADO */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-in fade-in delay-75">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                            <Palette size={18} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm">Identidade Visual</h3>
                    </div>

                    <div className="flex items-start gap-6">
                        {/* Upload Logo */}
                        <div 
                            onClick={() => logoInputRef.current?.click()}
                            className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition-colors shrink-0 overflow-hidden bg-slate-50/30"
                        >
                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo_url')} />
                            {formData.logo_url ? (
                                <img src={formData.logo_url} className="w-full h-full object-contain p-1" alt="Logo" />
                            ) : (
                                <>
                                    <Upload size={20} className="text-slate-300 mb-1" />
                                    <span className="text-[10px] text-slate-400 font-medium">LOGO</span>
                                </>
                            )}
                        </div>

                        <div className="flex-1 space-y-1 pt-1">
                            <h4 className="text-xs font-bold text-slate-900">Logo da Clínica</h4>
                            <p className="text-[10px] text-slate-400">Formatos aceitos: JPG, PNG. Máximo 2MB.</p>
                            <button onClick={() => logoInputRef.current?.click()} className="text-xs text-blue-600 font-bold mt-2 hover:underline">Alterar Imagem</button>
                        </div>
                    </div>

                    <div className="mt-8">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 block">Cor da Marca</label>
                        <div className="flex gap-3 flex-wrap">
                            {BRAND_COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setFormData({...formData, brand_color: color})}
                                    className={`w-10 h-10 rounded-xl border-2 transition-all ${formData.brand_color === color ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}

                            {/* SELETOR DE COR PERSONALIZADO (PLUS) */}
                            <div className="relative">
                                <button
                                    onClick={() => colorInputRef.current?.click()}
                                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center bg-white hover:bg-slate-50 transition-all ${!BRAND_COLORS.includes(formData.brand_color || '') ? 'border-slate-900' : 'border-slate-200'}`}
                                >
                                    {!BRAND_COLORS.includes(formData.brand_color || '') ? (
                                        <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: formData.brand_color }} />
                                    ) : (
                                        <Plus size={20} className="text-slate-400" />
                                    )}
                                </button>
                                <input 
                                    ref={colorInputRef}
                                    type="color" 
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    value={formData.brand_color}
                                    onChange={(e) => setFormData({...formData, brand_color: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Nome da Clínica</label>
                        <input 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                            value={formData.clinic_name}
                            onChange={e => setFormData({...formData, clinic_name: e.target.value})}
                            placeholder="Ex: Clínica HealthFlow"
                        />
                    </div>
                    
                    <button 
                        onClick={handleSaveProfile}
                        className="w-full mt-6 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98]"
                    >
                        Salvar Alterações
                    </button>
                </div>
              
              </div>

              {/* === COLUNA DIREITA (ASSINATURA + AJUDA) === */}
              <div className="flex flex-col gap-8">
                {/* CARD DE ASSINATURA */}
                <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden animate-in fade-in delay-100">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20" />
                  <div className="flex items-center gap-2 mb-6 text-blue-400">
                    <CreditCard size={20} />
                    <span className="font-bold uppercase tracking-wider text-xs">Assinatura</span>
                  </div>

                  <div className="mb-6">
                    <p className="text-slate-400 text-sm mb-1">Plano Atual</p>
                    <h3 className="text-2xl font-bold">HealthFlow Pro</h3>
                    <p className="text-sm mt-2 flex items-center gap-2">
                      <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold border border-emerald-500/30">{user?.subscription_status === 'trial' ? 'PERÍODO DE TESTE' : 'ATIVO'}</span>
                    </p>
                  </div>

                  <button onClick={handleAddCard} className="w-full bg-white/10 border border-white/20 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2 mb-3">
                    <CreditCard size={18} /> Adicionar Cartão
                  </button>

                  <button onClick={() => setIsSubModalOpen(true)} className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">
                    Detalhes do Plano
                  </button>
                </div>

                {/* CARD DE SUPORTE */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in delay-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><LifeBuoy size={20} /></div>
                    <h3 className="font-bold text-slate-900">Precisa de Ajuda?</h3>
                  </div>

                  <p className="text-sm text-slate-500 mb-6 leading-relaxed">Nossa equipe de suporte está disponível de Segunda a Sexta, das 08h às 18h.</p>

                  <div className="space-y-3">
                    <button onClick={handleWhatsAppSupport} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                      <MessageCircle size={18} /> Falar no WhatsApp
                    </button>
                    <a href="mailto:suporte@healthflow.com" className="w-full py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                      <Mail size={18} /> Enviar E-mail
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200 flex justify-end max-w-5xl">
              <button onClick={handleLogout} className="flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium px-4 py-2 rounded-lg hover:bg-rose-50 transition-colors">
                <LogOut size={18} /> Sair da Conta
              </button>
            </div>
          </>
        )}

        {/* Toast */}
        {toast.show && (
          <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50">
            <div className="bg-emerald-500 rounded-full p-1"><CheckCircle size={16} className="text-white" /></div>
            <span className="font-medium text-sm">{toast.msg}</span>
          </div>
        )}

        {/* MODAL ASSINATURA */}
        {isSubModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in p-4">
            <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 relative text-white border border-slate-800">
              <button onClick={() => setIsSubModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>

              <div className="flex items-center gap-2 mb-6 text-blue-400">
                <CreditCard size={20} />
                <span className="font-bold uppercase tracking-wider text-xs">Assinatura</span>
              </div>

              <div className="mb-8">
                <p className="text-slate-400 text-sm mb-1">Plano Atual</p>
                <h3 className="text-2xl font-bold">HealthFlow Pro</h3>
                <p className="text-sm mt-3 flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded text-xs font-bold border border-emerald-500/30">
                    {user?.subscription_status === 'trial' ? 'PERÍODO DE TESTE' : 'ATIVO'}
                  </span>
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-5 mb-8 border border-slate-700/50 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Dias Restantes</span>
                  <span className="text-white font-medium text-lg">{getDaysRemaining()} dias</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Valor Recorrente</span>
                  <span className="text-white font-medium text-lg">R$ 97,00 / mês</span>
                </div>

                <div className="h-px bg-slate-700/50 w-full my-1" />

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Pagamento</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <CreditCard size={16} className="text-slate-500" />
                      <span className="text-slate-300 text-base">Não cadastrado</span>
                    </div>
                    <button onClick={handleAddCard} className="text-xs font-bold text-blue-400 hover:text-blue-300 underline transition-colors">Alterar</button>
                  </div>
                </div>

                <div className="h-px bg-slate-700/50 w-full my-1" />

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Próxima Cobrança</span>
                  <span className="text-white font-medium text-lg">{getNextBillingDate()}</span>
                </div>
              </div>

              <button className="w-full py-3.5 border border-rose-500/30 text-rose-400 font-bold rounded-xl hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-2 group">
                <AlertTriangle size={18} className="group-hover:scale-110 transition-transform" />
                Cancelar Assinatura
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;