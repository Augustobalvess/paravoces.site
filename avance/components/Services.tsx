import React, { useState, useEffect } from 'react';
import { Plus, Tag, Clock, DollarSign, Trash2, Edit2, X, Save, AlertCircle, Menu } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from './Sidebar';

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  color?: string;
  is_package?: boolean;
  is_active: boolean;
  clinic_id?: string;
}

const Services: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // NOVO: Estado para travar o botão
  
  // Dados
  const [services, setServices] = useState<Service[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null); 
  
  // Estados de UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState<string | null>(null); 
  
  const [formData, setFormData] = useState({
    name: '',
    durationMinutes: 30,
    price: 0,
    color: 'bg-blue-100 text-blue-700',
    isPackage: false
  });

  const colors = [
    'bg-emerald-100 text-emerald-700',
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
    'bg-rose-100 text-rose-700',
    'bg-indigo-100 text-indigo-700'
  ];

  // --- 1. BUSCAR DADOS ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('clinic_id')
            .eq('id', user.id)
            .single();
            
        if (profile) {
            setClinicId(profile.clinic_id);
        }
      }

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- LÓGICA DE SALVAR ---
  const handleOpenModal = (service?: Service) => {
    if (service) {
        setEditingId(service.id);
        setFormData({
            name: service.name,
            durationMinutes: service.duration_minutes,
            price: service.price,
            color: service.color || 'bg-blue-100 text-blue-700',
            isPackage: service.is_package || false
        });
    } else {
        setEditingId(null);
        setFormData({
            name: '',
            durationMinutes: 30,
            price: 0,
            color: 'bg-blue-100 text-blue-700',
            isPackage: false
        });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return; // Impede duplo clique
    
    if (!clinicId) {
        alert("Erro: Não foi possível identificar sua clínica. Tente recarregar a página.");
        return;
    }

    setIsSaving(true); // Bloqueia o botão

    const payload = {
        name: formData.name,
        duration_minutes: formData.durationMinutes,
        price: formData.price,
        color: formData.color,
        is_package: formData.isPackage,
        is_active: true,
        clinic_id: clinicId 
    };

    try {
        if (editingId) {
            const { error } = await supabase.from('services').update(payload).eq('id', editingId);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('services').insert([payload]);
            if (error) throw error;
        }
        
        await fetchData();
        setIsModalOpen(false);

    } catch (error: any) {
        alert('Erro ao salvar: ' + error.message);
    } finally {
        setIsSaving(false); // Libera o botão
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirmDeleteModal(id);
  };

  const handleFinalDelete = async (id: string) => {
    setIsLoading(true); // Reusa isLoading para o delete, pois ele recarrega a lista
    try {
        const { error } = await supabase
            .from('services')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
        
        await fetchData(); 
        setShowConfirmDeleteModal(null);

    } catch (error: any) {
        alert('Erro ao excluir: ' + error.message);
        setIsLoading(false);
    }
  };

  // --- COMPONENTE SKELETON ---
  const ServiceSkeleton = () => (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse h-48 flex flex-col">
        <div className="w-12 h-12 rounded-xl bg-slate-200 mb-4" />
        <div className="h-5 bg-slate-200 rounded w-3/4 mb-4" />
        <div className="space-y-3 mt-auto">
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-200 rounded w-1/3" />
        </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 md:ml-64 p-4 md:p-8 h-screen overflow-y-auto pb-24">
        
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-white border border-slate-200 rounded-lg text-slate-600">
                    <Menu size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Catálogo de Serviços</h2>
                    <p className="text-slate-500 text-sm">Gerencie preços, durações e pacotes.</p>
                </div>
            </div>
            <button 
            onClick={() => handleOpenModal()}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 md:py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 transition-colors w-full md:w-auto"
            >
            <Plus size={18} />
            Novo Serviço
            </button>
        </header>

        {/* --- RENDERIZAÇÃO CONDICIONAL --- */}
        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => <ServiceSkeleton key={i} />)}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {services.map((service) => (
                <div 
                    key={service.id} 
                    onClick={() => handleOpenModal(service)}
                    className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group relative cursor-pointer flex flex-col"
                >
                    {service.is_package && (
                        <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md">
                            Pacote
                        </div>
                    )}
                    
                    <div className={`w-12 h-12 rounded-xl ${service.color || 'bg-blue-100 text-blue-700'} flex items-center justify-center mb-4`}>
                    <Tag size={20} />
                    </div>
                    
                    <h3 className="font-bold text-lg text-slate-900 mb-1">{service.name}</h3>
                    
                    <div className="space-y-3 mt-4 flex-1">
                        <div className="flex items-center text-slate-500 text-sm">
                            <Clock size={16} className="mr-2 text-slate-400" />
                            {service.duration_minutes > 0 ? `${service.duration_minutes} minutos` : 'Duração Variável'}
                        </div>
                        <div className="flex items-center text-slate-500 text-sm">
                            <DollarSign size={16} className="mr-2 text-slate-400" />
                            <span className="font-semibold text-slate-700">R$ {service.price.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-50 flex gap-2 justify-end md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(service); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <Edit2 size={20} />
                        </button>
                        <button 
                            onClick={(e) => handleDelete(e, service.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors z-10 relative"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
                ))}
                
                {services.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                        <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
                        <p>Nenhum serviço ativo cadastrado.</p>
                    </div>
                )}
            </div>
        )}

        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-900">{editingId ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                    <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-slate-400" /></button>
                </div>
                <div className="overflow-y-auto p-6">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Nome do Serviço</label>
                            <input 
                                required
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Preço (R$)</label>
                                <input 
                                    type="number"
                                    required
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                    value={formData.price}
                                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Duração (min)</label>
                                <input 
                                    type="number"
                                    required
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                    value={formData.durationMinutes}
                                    onChange={e => setFormData({...formData, durationMinutes: parseFloat(e.target.value)})}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2">Cor na Agenda</label>
                            <div className="flex gap-2 flex-wrap">
                                {colors.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setFormData({...formData, color: c})}
                                        className={`w-10 h-10 rounded-full ${c.split(' ')[0]} border-4 ${formData.color === c ? 'border-slate-600' : 'border-transparent'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input 
                                type="checkbox" 
                                id="isPackage"
                                checked={formData.isPackage}
                                onChange={e => setFormData({...formData, isPackage: e.target.checked})}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="isPackage" className="text-sm text-slate-700">É um pacote promocional?</label>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSaving} // Desabilita enquanto salva
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <Save size={18} />
                            {isSaving ? 'Salvando...' : 'Salvar Serviço'}
                        </button>
                    </form>
                </div>
            </div>
            </div>
        )}
        
        {/* --- MODAL: CONFIRMAÇÃO DE EXCLUSÃO --- */}
        {showConfirmDeleteModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 border border-slate-100 p-8 text-center">
                
                <div className="mx-auto bg-rose-100 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <X size={24} className="text-rose-600" />
                </div>
                
                <h3 className="font-bold text-xl text-slate-900 mb-2">
                  Remover Serviço?
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Essa ação não pode ser desfeita e removerá o serviço da agenda.
                </p>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowConfirmDeleteModal(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinalDelete(showConfirmDeleteModal!)}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-rose-600 text-white font-medium rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Removendo...' : 'Sim, Remover'}
                  </button>
                </div>
              </div>
            </div>
          )}
      </main>
    </div>
  );
};

export default Services;