import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Stethoscope, Edit2, Trash2, X, Upload,
  AlertCircle, Menu, AlertTriangle, CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from './Sidebar';

interface Collaborator {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  is_active: boolean;
  clinic_id?: string;
}

// ---------------------------------------------------
//  COMPRESSÃO LEVE DE IMAGEM
// ---------------------------------------------------
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const maxSize = 300;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL("image/jpeg", 0.65));
      URL.revokeObjectURL(img.src);
    };
  });
};

const Collaborators: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    avatar: ''
  });

  // ---------------------------------------------------
  //  TOAST
  // ---------------------------------------------------
  const showNotification = useCallback((msg: string) => {
    setToastMessage(msg);
    setShowToast(true);

    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => {
      setShowToast(false);
    }, 2800);
  }, []);

  // ---------------------------------------------------
  //  1. FUNÇÃO DE BUSCAR DADOS (Igual ao Services.tsx)
  // ---------------------------------------------------
  const fetchData = async () => {
    // Não ativamos isLoading(true) aqui para evitar "piscar" a tela em updates, 
    // mas se quiser pode ativar.
    try {
      // Pega o clinic_id se ainda não tiver
      let currentClinicId = clinicId;
      if (!currentClinicId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('clinic_id')
                .eq('id', user.id)
                .single();
            if (profile) {
                currentClinicId = profile.clinic_id;
                setClinicId(profile.clinic_id);
            }
          }
      }

      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setCollaborators(data || []);
      
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega na montagem do componente
  useEffect(() => {
    fetchData();
  }, []);


  // ---------------------------------------------------
  //  HANDLERS
  // ---------------------------------------------------
  const handleOpenModal = useCallback((collab?: Collaborator) => {
    if (collab) {
      setEditingId(collab.id);
      setFormData({
        name: collab.name,
        role: collab.role,
        avatar: collab.avatar || ''
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', role: '', avatar: '' });
    }
    setShowModal(true);
  }, []);

  // --- HANDLE SAVE (CORRIGIDO: Agora chama fetchData) ---
  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clinicId) {
      // Tenta recuperar se falhou no load inicial
      alert("Aguarde o carregamento do perfil...");
      return;
    }

    const avatarUrl =
      formData.avatar ||
      `https://ui-avatars.com/api/?name=${formData.name}&background=random&color=fff`;

    const payload = {
      name: formData.name,
      role: formData.role,
      avatar: avatarUrl,
      is_active: true,
      clinic_id: clinicId
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('collaborators')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        showNotification("Atualizado com sucesso!");

      } else {
        const { error } = await supabase
          .from('collaborators')
          .insert([payload]);

        if (error) throw error;
        showNotification("Cadastrado com sucesso!");
      }

      // 🔄 ATUALIZA A LISTA IMEDIATAMENTE
      await fetchData();
      setShowModal(false);

    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar: " + err.message);
    }
  }, [clinicId, editingId, formData, showNotification]);

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;

    const id = deleteId;
    
    try {
        await supabase
        .from("collaborators")
        .update({ is_active: false })
        .eq("id", id);
        
        showNotification("Removido com sucesso.");
        
        // 🔄 ATUALIZA A LISTA APÓS DELETAR
        await fetchData(); 

    } catch (error) {
        alert("Erro ao excluir");
    } finally {
        setShowDeleteModal(false);
        setDeleteId(null);
    }
    
  }, [deleteId, showNotification]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img64 = await compressImage(file);
    setFormData(prev => ({ ...prev, avatar: img64 }));
  }, []);

  const CollaboratorSkeleton = () => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 h-28 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-slate-200" />
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto pb-24">

        {/* HEADER RESPONSIVO */}
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-white border border-slate-200 rounded-lg text-slate-600">
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Colaboradores</h2>
              <p className="text-slate-500 text-sm">Gerencie sua equipe médica.</p>
            </div>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 md:py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 transition-colors w-full md:w-auto"
          >
            <Plus size={18} /> 
            Novo Colaborador
          </button>
        </header>

        {/* LISTA */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <CollaboratorSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {collaborators.map(collab => (
              <div
                key={collab.id}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <img
                    src={collab.avatar}
                    alt={collab.name}
                    loading="lazy"
                    decoding="async"
                    fetchpriority="low"
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-100 object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-lg truncate">{collab.name}</h3>
                    <div className="flex items-center text-slate-500 text-sm mt-1 truncate">
                      <Stethoscope size={14} className="mr-1 shrink-0" />
                      <span className="truncate">{collab.role}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pl-2">
                  <button onClick={() => handleOpenModal(collab)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 size={20} />
                  </button>
                  <button onClick={() => { setDeleteId(collab.id); setShowDeleteModal(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}

            {collaborators.length === 0 && (
              <div className="col-span-full text-center py-12 md:py-16 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <AlertCircle className="mx-auto mb-3 opacity-50" size={32} />
                <p className="text-slate-400">Nenhum colaborador encontrado.</p>
              </div>
            )}
          </div>
        )}

        {/* TOAST */}
        {showToast && (
          <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in z-50">
            <div className="bg-emerald-500 rounded-full p-1">
              <CheckCircle size={16} />
            </div>
            <span className="font-medium text-sm">{toastMessage}</span>
          </div>
        )}

        {/* MODAL FORM */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">

              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-900">
                  {editingId ? "Editar" : "Novo Colaborador"}
                </h3>
                <button onClick={() => setShowModal(false)}>
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Nome</label>
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500">Cargo</label>
                  <input
                    required
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500">Foto</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative mt-1 border border-slate-200 border-dashed rounded-xl p-4 bg-slate-50 h-32 cursor-pointer flex items-center justify-center overflow-hidden hover:bg-slate-100 transition-colors"
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                    {!formData.avatar ? (
                      <div className="text-slate-400 flex flex-col items-center">
                        <Upload size={24} className="mb-2" />
                        <span className="text-xs">Upload Foto</span>
                      </div>
                    ) : (
                      <img src={formData.avatar} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg mt-4 hover:bg-slate-800 transition-colors"
                >
                  {editingId ? "Salvar Alterações" : "Salvar"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EXCLUSÃO */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">

              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Remover Colaborador?
              </h3>

              <p className="text-slate-500 text-sm mb-6">
                Essa ação não pode ser desfeita.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl shadow-lg hover:bg-rose-700 transition-colors"
                >
                  Sim, remover
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Collaborators;