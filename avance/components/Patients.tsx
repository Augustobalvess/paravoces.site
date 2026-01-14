import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Phone, CreditCard, MapPin, FileText, X, Edit3, Save, User, Calendar, StickyNote, RotateCcw, Menu, Trash2, CheckCircle, AlertTriangle, Paperclip, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from './Sidebar';

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  cpf: string | null;
  birth_date: string | null;
  address: any;
  created_at?: string;
}

interface TimelineItem {
  id: string;
  type: 'appointment' | 'note';
  date: string;
  title: string;
  description: string;
  attachment?: string | null;
  icon: any;
  colorClass: string;
}

// Compressão de Imagem
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 800 / Math.max(img.width, img.height);
        const width = img.width > 800 ? img.width * scale : img.width;
        const height = img.height > 800 ? img.height * scale : img.height;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// --- MÁSCARAS DE INPUT ---

const maskCPF = (value: string) => {
  return value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').substring(0, 11);
    
    let formatted = digits;
    
    if (formatted.length > 0) {
      formatted = '(' + formatted;
    }
    if (formatted.length > 3) {
      formatted = formatted.substring(0, 3) + ') ' + formatted.substring(3);
    }
    
    // Verifica se é 8 ou 9 dígitos (celular ou fixo)
    if (formatted.length > 10) { // Se for 9 dígitos (ex: (11) 99999-9999)
      formatted = formatted.substring(0, 10) + '-' + formatted.substring(10);
    } else if (formatted.length > 9) { // Se for 8 dígitos (ex: (11) 9999-9999)
      formatted = formatted.substring(0, 9) + '-' + formatted.substring(9);
    }

    // Limita o tamanho total (máximo 15 caracteres)
    return formatted.substring(0, 15); 
};

// --- COMPONENTE ---

const Patients: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Prontuário
  const [noteText, setNoteText] = useState('');
  const [noteAttachment, setNoteAttachment] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // NOVOS ESTADOS E REFERÊNCIAS
  const importFileRef = useRef<HTMLInputElement>(null); 
  const [isImporting, setIsImporting] = useState(false); 
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({ 
    name: '', phone: '', email: '', cpf: '', birthDate: '',
    street: '', number: '', neighborhood: '', city: ''
  });

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // --- HANDLERS DE INPUT ---
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, cpf: maskCPF(e.target.value) });
  };
  
  // HANDLER PARA TELEFONE
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: maskPhone(e.target.value) });
  };
  // --- FIM DOS HANDLERS DE INPUT ---
  
  // --- FUNÇÕES DE IMPORT/EXPORT ---
  const handleExport = () => {
      // Lógica de Exportação: Cria um CSV simples dos pacientes e inicia o download
      setShowActionsMenu(false);
      
      if (patients.length === 0) {
          showNotification('Nenhum paciente para exportar.');
          return;
      }

      // 1. Cria o cabeçalho
      const headers = ['id', 'name', 'phone', 'email', 'cpf', 'birth_date', 'city'];
      
      // 2. Mapeia os dados, tratando strings e campos aninhados/nulos
      const csvContent = patients.map(p => {
          return [
              `"${p.id}"`,
              `"${p.name}"`,
              `"${p.phone.replace(/\D/g, '')}"`,
              `"${p.email || ''}"`,
              `"${(p.cpf || '').replace(/\D/g, '')}"`,
              `"${p.birth_date || ''}"`,
              `"${p.address?.city || ''}"`
          ].join(',');
      }).join('\n');
      
      const finalCSV = headers.join(',') + '\n' + csvContent;

      // 3. Cria o Blob e o link de download
      const blob = new Blob([finalCSV], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", `pacientes_export_${new Date().toISOString().split('T')[0]}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showNotification('Exportação concluída!');
      }
  };

  // FUNÇÃO QUE ABRE O SELETOR DE ARQUIVOS (chamada pelo botão de Importar)
  const handleImport = () => {
      setShowActionsMenu(false);
      importFileRef.current?.click();
  };

  // FUNÇÃO QUE PROCESSA O ARQUIVO SELECIONADO
  const handleProcessImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith('.csv')) {
          alert('Por favor, selecione um arquivo CSV válido.');
          return;
      }
      
      setIsImporting(true);
      
      // Lógica real de processamento de CSV para inserção no Supabase ficaria aqui. 
      // O código abaixo é uma simulação de leitura:
      
      const reader = new FileReader();
      reader.onload = (event) => {
          const csvData = event.target?.result;
          console.log("CSV lido. Pronto para processar e inserir no Supabase.", csvData);
          
          // Simulação de processamento bem-sucedido:
          showNotification('Simulação: Lista de pacientes importada com sucesso!');
          
          fetchPatients();
          setIsImporting(false);
      };
      reader.onerror = (err) => {
          alert("Erro ao ler o arquivo.");
          setIsImporting(false);
      };
      reader.readAsText(file);
      
      // Limpa o valor do input file para permitir nova seleção
      if(importFileRef.current) importFileRef.current.value = '';
  };
  // --- FIM DAS FUNÇÕES DE IMPORT/EXPORT ---


  const fetchPatients = async () => {
    if(patients.length === 0) setIsLoading(true);
    try {
      const { data, error } = await supabase.from('patients').select('*').order('name', { ascending: true });
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatientHistory = async (patientId: string) => {
    setTimeline([]);
    
    const aptPromise = supabase
      .from('appointments')
      .select(`id, start_time, status, notes, service:services ( name )`)
      .eq('patient_id', patientId);

    const notesPromise = supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId);

    const [aptRes, notesRes] = await Promise.all([aptPromise, notesPromise]);

    const history: TimelineItem[] = [];

    (aptRes.data || []).forEach(apt => {
        history.push({
            id: apt.id,
            type: 'appointment',
            date: apt.start_time,
            title: apt.service?.name || 'Consulta',
            description: `Status: ${apt.status}. ${apt.notes ? 'Obs: ' + apt.notes : ''}`,
            icon: Calendar,
            colorClass: 'bg-blue-50 text-blue-700'
        });
    });

    (notesRes.data || []).forEach(note => {
        history.push({
            id: note.id,
            type: 'note',
            date: note.created_at,
            title: 'Evolução Clínica',
            description: note.description,
            attachment: note.attachment,
            icon: StickyNote,
            colorClass: 'bg-emerald-50 text-emerald-700'
        });
    });

    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTimeline(history);
  };

  const handleSaveNote = async () => {
      if (!noteText.trim() && !noteAttachment) return;
      if (!viewingPatient) return;
      
      setSavingNote(true);

      const payload = {
          patient_id: viewingPatient.id,
          description: noteText,
          attachment: noteAttachment
      };

      try {
          if (editingNoteId) {
              const { error } = await supabase
                  .from('medical_records')
                  .update({ description: noteText, attachment: noteAttachment })
                  .eq('id', editingNoteId);
              
              if (error) throw error;
              showNotification('Evolução atualizada!');
          } else {
              const { error } = await supabase.from('medical_records').insert([payload]);
              if (error) throw error;
              showNotification('Evolução salva!');
          }

          setNoteText('');
          setNoteAttachment(null);
          setEditingNoteId(null);
          
          fetchPatientHistory(viewingPatient.id);

      } catch (error: any) {
          alert('Erro ao salvar: ' + error.message);
      } finally {
          setSavingNote(false);
      }
  };

  const handleEditNoteClick = (item: TimelineItem) => {
      if (item.type !== 'note') return;
      setNoteText(item.description);
      setNoteAttachment(item.attachment || null);
      setEditingNoteId(item.id);
      document.querySelector('#note-editor')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setNoteText('');
      setNoteAttachment(null);
      setEditingNoteId(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const compressed = await compressImage(file);
              setNoteAttachment(compressed);
          } catch (error) {
              alert("Erro ao processar imagem.");
          }
      }
  };

  const handleOpenModal = (patient?: Patient) => {
    if (patient) {
        setEditingId(patient.id);
        const address = patient.address || {};
        setFormData({
            name: patient.name,
            phone: patient.phone || '',
            email: patient.email || '',
            cpf: patient.cpf || '',
            birthDate: patient.birth_date || '',
            street: address.street || '',
            number: address.number || '',
            neighborhood: address.neighborhood || '',
            city: address.city || ''
        });
    } else {
        setEditingId(null);
        setFormData({ name: '', phone: '', email: '', cpf: '', birthDate: '', street: '', number: '', neighborhood: '', city: '' });
    }
    setShowModal(true);
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);

    const { data: { user } } = await supabase.auth.getUser();
    let clinicId = null;
    if (user) {
        const { data } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
        clinicId = data?.clinic_id;
    }

    if (!clinicId) { alert("Erro: Clínica não identificada."); return; }

    // Remove a máscara antes de salvar no payload
    const payload = {
        name: formData.name,
        phone: formData.phone.replace(/\D/g, ''),
        email: formData.email,
        cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : null,
        birth_date: formData.birthDate || null,
        clinic_id: clinicId,
        address: { 
            street: formData.street, number: formData.number, 
            neighborhood: formData.neighborhood, city: formData.city 
        }
    };

    try {
        if (editingId) {
            setPatients(prev => prev.map(p => p.id === editingId ? { ...p, ...payload, id: editingId } : p));
            showNotification('Paciente atualizado!');
            await supabase.from('patients').update(payload).eq('id', editingId);
        } else {
            const tempId = Math.random().toString();
            setPatients(prev => [...prev, { ...payload, id: tempId } as Patient]);
            showNotification('Paciente cadastrado!');
            const { data } = await supabase.from('patients').insert([payload]).select().single();
            if(data) setPatients(prev => prev.map(p => p.id === tempId ? data : p));
        }
    } catch (error: any) {
        alert('Erro ao salvar: ' + error.message);
        fetchPatients();
    }
  };

  const onRequestDelete = (id: string) => {
      setDeleteId(id);
      setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
      if (!deleteId) return;
      const idToDelete = deleteId;
      setPatients(prev => prev.filter(p => p.id !== idToDelete));
      setShowDeleteModal(false);
      setDeleteId(null);
      showNotification('Paciente removido.');
      try { await supabase.from('patients').delete().eq('id', idToDelete); } catch (error) { console.error(error); }
  };

  const calculateAge = (birthDateString: string | null) => {
    if (!birthDateString) return '---';
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const filteredPatients = patients.filter(p => {
    const searchClean = searchTerm.toLowerCase().replace(/\D/g, ''); // Remove símbolos do que foi digitado
    const cpfClean = (p.cpf || '').replace(/\D/g, ''); // Remove símbolos do CPF salvo no banco
    
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || // Busca por Nome
      p.cpf?.includes(searchTerm) || // Busca por CPF exato (com pontos)
      (searchClean.length > 0 && cpfClean.includes(searchClean)) // Busca por CPF só números
    );
  });

  const PatientSkeleton = () => (
      <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-4 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-slate-200"></div>
          <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-3 bg-slate-200 rounded w-1/4"></div>
          </div>
      </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 md:ml-64 p-4 md:p-8 h-screen overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-white border border-slate-200 rounded-lg text-slate-600"><Menu size={24} /></button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Pacientes</h2>
                    <p className="text-slate-500 text-sm">Base de dados completa de clientes.</p>
                </div>
            </div>
            
            {/* NOVO BLOCO DE AÇÕES DIRETAS E MELHOR ESPAÇAMENTO */}
            <div className="flex items-center gap-3 w-full md:w-auto relative">
                
                {/* 1. Botão de Exportar */}
                <button 
                    onClick={handleExport}
                    className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100"
                    disabled={isImporting}
                >
                    <FileText size={16} /> Exportar Lista
                </button>
                
                {/* 2. Botão de Importar + Input File Oculto */}
                <button 
                    onClick={handleImport}
                    className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100"
                    disabled={isImporting}
                >
                    {isImporting ? <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mr-1"></div> : <RotateCcw size={16} />} Importar Lista
                </button>
                <input 
                    type="file"
                    ref={importFileRef}
                    className="hidden"
                    accept=".csv"
                    onChange={handleProcessImportFile}
                    disabled={isImporting}
                />
                
                {/* 3. Botão de Cadastro (Ação Primária) */}
                <button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 md:py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 transition-colors flex-1 md:flex-none">
                    <Plus size={18} /> Cadastrar Paciente
                </button>
                
            </div>
        </header>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Buscar por nome ou CPF..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-base" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
        </div>

        {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {[1,2,3,4,5].map(i => <PatientSkeleton key={i} />)}
            </div>
        ) : (
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                        <tr><th className="px-6 py-4">Paciente</th><th className="px-6 py-4">CPF / Idade</th><th className="px-6 py-4">Contato</th><th className="px-6 py-4 text-right">Ações</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredPatients.map(patient => (
                            <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">{patient.name.charAt(0)}</div>
                                        <div className="min-w-0"><div className="font-medium text-slate-900 truncate">{patient.name}</div><div className="text-xs text-slate-400">Desde {new Date(patient.created_at || '').toLocaleDateString('pt-BR')}</div></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 text-sm">
                                    <div className="flex flex-col"><span className="flex items-center gap-2 font-mono text-xs"><CreditCard size={12} /> {patient.cpf || '---'}</span><span className="text-xs text-slate-400 mt-1">{calculateAge(patient.birth_date)} anos</span></div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 text-sm">
                                    <div className="flex flex-col"><span className="flex items-center gap-2"><Phone size={14} /> {patient.phone}</span>{patient.email && <span className="text-xs text-slate-400 truncate">{patient.email}</span>}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button title="Ver Prontuário" onClick={() => { setViewingPatient(patient); fetchPatientHistory(patient.id); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline flex items-center gap-1 mr-2"><FileText size={16} /> Prontuário</button>
                                        <button title="Editar" onClick={() => handleOpenModal(patient)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={16} /></button>
                                        <button title="Excluir" onClick={() => onRequestDelete(patient.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        <div className="md:hidden space-y-4">
            {!isLoading && filteredPatients.map(patient => (
                <div key={patient.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg">{patient.name.charAt(0)}</div>
                            <div><h3 className="font-bold text-slate-900 text-lg">{patient.name}</h3><p className="text-sm text-slate-500">{calculateAge(patient.birth_date)} anos</p></div>
                        </div>
                        <div className="flex gap-1"><button onClick={() => handleOpenModal(patient)} className="p-2 text-slate-400 bg-slate-50 rounded-lg"><Edit3 size={20} /></button></div>
                    </div>
                    <div className="space-y-3 mb-5">
                        <div className="flex items-center gap-3 text-slate-600"><Phone size={18} className="text-slate-400" /><span className="text-sm font-medium">{patient.phone}</span></div>
                    </div>
                    <button onClick={() => { setViewingPatient(patient); fetchPatientHistory(patient.id); }} className="w-full py-3 bg-blue-50 text-blue-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"><FileText size={18} /> Ver Prontuário</button>
                </div>
            ))}
        </div>

        {showToast && (
            <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50">
                <div className="bg-emerald-500 rounded-full p-1"><CheckCircle size={16} className="text-white" /></div>
                <span className="font-medium text-sm">{toastMessage}</span>
            </div>
        )}

        {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center p-6 border-b border-slate-100">
                        <h3 className="font-bold text-lg text-slate-900">{editingId ? 'Editar Paciente' : 'Novo Paciente'}</h3>
                        <button onClick={() => setShowModal(false)}><X className="text-slate-400 hover:text-slate-600" size={24} /></button>
                    </div>
                    <div className="overflow-y-auto p-6">
                        <form onSubmit={handleSavePatient} className="space-y-4">
                            <div><label className="block text-xs font-semibold text-slate-500 mb-1">Nome Completo</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl" /></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold text-slate-500 mb-1">CPF</label><input value={formData.cpf} onChange={handleCPFChange} maxLength={14} placeholder="000.000.000-00" className="w-full p-3 bg-white border border-slate-200 rounded-xl" /></div>
                                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Data Nasc.</label><input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl" /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Telefone</label><input required value={formData.phone} onChange={handlePhoneChange} maxLength={15} placeholder="(00) 00000-0000" className="w-full p-3 bg-white border border-slate-200 rounded-xl" /></div>
                                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@exemplo.com" className="w-full p-3 bg-white border border-slate-200 rounded-xl" /></div>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="font-semibold text-sm mb-2"><MapPin size={16} className="inline mr-1"/> Endereço</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2"><input placeholder="Rua" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                                    <div><input placeholder="Nº" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <input placeholder="Bairro" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} className="w-full p-3 border rounded-xl" />
                                    <input placeholder="Cidade" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full p-3 border rounded-xl" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 text-white bg-slate-900 rounded-xl font-bold mt-4">{editingId ? 'Salvar' : 'Cadastrar'}</button>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {viewingPatient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50 rounded-t-2xl">
                            <div className="flex gap-4">
                                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl border-4 border-white shadow-sm">{viewingPatient.name.charAt(0)}</div>
                                <div><h3 className="text-xl font-bold text-slate-900">{viewingPatient.name}</h3><p className="text-slate-500 text-sm">{calculateAge(viewingPatient.birth_date)} anos • {viewingPatient.phone}</p></div>
                            </div>
                            <button onClick={() => setViewingPatient(null)} className="p-2 bg-slate-200/50 rounded-full text-slate-500 hover:bg-slate-300 transition-colors"><X size={24} /></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
                        <div className="space-y-6">
                            {timeline.length > 0 ? (
                                timeline.map((record, index) => (
                                    <div key={index} className="flex gap-4 group">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${record.colorClass.split(' ')[0]}`}><record.icon size={18} className={record.colorClass.split(' ')[1]} /></div>
                                            <div className="w-0.5 h-full bg-slate-200 my-2 group-last:hidden"></div>
                                        </div>
                                        <div className="p-4 md:p-5 rounded-xl border bg-white border-slate-200 shadow-sm flex-1 relative">
                                            {/* CORREÇÃO AQUI: ADICIONEI O PR-10 */}
                                            <div className="flex flex-col md:flex-row md:justify-between mb-2 gap-1 pr-10">
                                                <div className="flex items-center gap-2"><span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${record.colorClass}`}>{record.title}</span></div>
                                                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{record.description}</p>
                                            
                                            {record.attachment && (
                                                <div className="mt-3"><img src={record.attachment} alt="Anexo" className="h-24 w-auto rounded-lg border border-slate-200 cursor-zoom-in hover:opacity-90 transition-opacity" onClick={() => setZoomImage(record.attachment || null)} /></div>
                                            )}

                                            {record.type === 'note' && (
                                                <button onClick={() => handleEditNoteClick(record)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Editar Evolução"><Edit3 size={16} /></button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (<div className="text-center py-10 text-slate-400"><p>Nenhum registro encontrado.</p></div>)}
                        </div>
                    </div>

                    <div id="note-editor" className="p-4 border-t border-slate-100 bg-white rounded-b-2xl shadow-inner">
                        {editingNoteId && (
                            <div className="flex justify-between items-center mb-2 px-1"><span className="text-xs font-bold text-blue-600 flex items-center gap-1"><Edit3 size={12}/> Editando Evolução</span><button onClick={handleCancelEdit} className="text-xs text-slate-400 hover:text-slate-600 hover:underline">Cancelar Edição</button></div>
                        )}
                        <div className="relative">
                            <textarea className="w-full p-4 border border-slate-200 rounded-xl text-base focus:ring-2 focus:ring-slate-900 outline-none resize-none h-24 bg-white text-slate-900 shadow-sm" placeholder="Adicionar nova evolução clínica..." value={noteText} onChange={(e) => setNoteText(e.target.value)}></textarea>
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                {noteAttachment ? (
                                    <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs"><ImageIcon size={14} /> <span>Foto anexada</span><button onClick={() => setNoteAttachment(null)} className="hover:text-red-500 ml-1"><X size={14}/></button></div>
                                ) : (
                                    <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-slate-600 transition-colors p-1" title="Anexar Foto/Exame"><Paperclip size={20} /></button>
                                )}
                            </div>
                        </div>
                        <button onClick={handleSaveNote} disabled={savingNote || (!noteText && !noteAttachment)} className={`w-full mt-3 px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg ${editingNoteId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'} text-white disabled:opacity-50`}>
                            {savingNote ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />} {editingNoteId ? 'Atualizar Evolução' : 'Salvar Evolução'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {zoomImage && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setZoomImage(null)}>
                <button className="absolute top-4 right-4 text-white hover:text-slate-300"><X size={32} /></button>
                <img src={zoomImage} alt="Zoom" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
            </div>
        )}

        {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center transform transition-all scale-100">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Remover Paciente?</h3>
                    <p className="text-slate-500 text-sm mb-6">Essa ação apagará todo o histórico.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">Cancelar</button>
                        <button onClick={confirmDelete} className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl shadow-lg">Sim, Remover</button>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default Patients;