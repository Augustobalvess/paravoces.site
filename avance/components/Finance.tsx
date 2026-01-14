import React, { useState, useMemo, useEffect } from 'react';
import { 
  DollarSign, Search, CheckCircle, Clock, RefreshCw, 
  Calendar as CalendarIcon, Filter, Menu, Download, XCircle, ChevronDown,
  ChevronLeft, ChevronRight // Importei setas para a paginação
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from './Sidebar';

// --- TIPAGEM ---
interface Appointment {
  id: string;
  date: string;       
  start_time: string; 
  patient_id: string;
  collaborator_id: string;
  service_ids: string[];
  price: number;
  payment_status: 'paid' | 'pending' | 'canceled';
  status: string;
}

interface Collaborator {
  id: string;
  name: string;
}

interface Patient {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
}

type FilterType = 'all' | 'today' | '7days' | '30days';

const Finance: React.FC = () => {
  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  
  // Data State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Filter State
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterCollab, setFilterCollab] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // --- PAGINAÇÃO (Novo State) ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Mude aqui para 50 se preferir

  // --- 1. BUSCAR DADOS ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [aptRes, collabRes, patRes, servRes] = await Promise.all([
        supabase.from('appointments').select('*'), // Removi o order daqui para ordenar no front com segurança
        supabase.from('collaborators').select('id, name'),
        supabase.from('patients').select('id, name'),
        supabase.from('services').select('id, name')
      ]);

      if (aptRes.data) {
        const normalizedApts = aptRes.data.map((apt: any) => ({
            ...apt,
            payment_status: apt.payment_status || 'pending'
        }));
        setAppointments(normalizedApts);
      }
      if (collabRes.data) setCollaborators(collabRes.data);
      if (patRes.data) setPatients(patRes.data);
      if (servRes.data) setServices(servRes.data);

    } catch (error) {
      console.error("Erro ao carregar financeiro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Resetar para página 1 se filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterCollab, filterStatus, searchTerm]);

  // --- HELPER FUNCTIONS ---
  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'Paciente N/A';
  const getCollabName = (id: string) => collaborators.find(c => c.id === id)?.name || 'Doutor N/A';
  
  const getServiceName = (ids: string[] | null) => {
    if (!ids || ids.length === 0) return 'Consulta';
    const service = services.find(s => s.id === ids[0]);
    return service ? service.name : 'Serviço Removido';
  };

  // --- 2. FILTRAGEM ---
  const filteredApts = useMemo(() => {
    return appointments.filter(apt => {
        const matchCollab = filterCollab === 'all' || apt.collaborator_id === filterCollab;
        const matchStatus = filterStatus === 'all' || apt.payment_status === filterStatus;
        
        const patientName = getPatientName(apt.patient_id).toLowerCase();
        const matchSearch = patientName.includes(searchTerm.toLowerCase());
        
        // Lógica de Data Robusta
        let dateObj = new Date();
        if (apt.start_time && apt.start_time.includes('T')) {
            dateObj = new Date(apt.start_time);
        } else if (apt.date) {
            dateObj = new Date(apt.date + 'T00:00:00');
        }
        
        const today = new Date();
        today.setHours(0,0,0,0);
        const aptDateOnly = new Date(dateObj);
        aptDateOnly.setHours(0,0,0,0);

        let matchDate = true;

        if (filterType === 'today') {
            matchDate = aptDateOnly.getTime() === today.getTime();
        } else if (filterType === '7days') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);
            matchDate = aptDateOnly >= sevenDaysAgo;
        } else if (filterType === '30days') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);
            matchDate = aptDateOnly >= thirtyDaysAgo;
        }

        return matchCollab && matchStatus && matchSearch && matchDate;
    });
  }, [appointments, filterType, filterCollab, filterStatus, searchTerm, patients]);

  // --- 3. ORDENAÇÃO (GARANTIR ORDEM CORRETA 14-14-13-13) ---
  const sortedApts = useMemo(() => {
    return [...filteredApts].sort((a, b) => {
      // Pega data A
      let dateA = new Date(0);
      if (a.start_time && a.start_time.includes('T')) dateA = new Date(a.start_time);
      else if (a.date) dateA = new Date(a.date + 'T00:00:00');

      // Pega data B
      let dateB = new Date(0);
      if (b.start_time && b.start_time.includes('T')) dateB = new Date(b.start_time);
      else if (b.date) dateB = new Date(b.date + 'T00:00:00');

      // Ordena do MAIS RECENTE para o MAIS ANTIGO (Decrescente)
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredApts]);

  // --- 4. PAGINAÇÃO LOGIC ---
  const totalPages = Math.ceil(sortedApts.length / itemsPerPage);
  const currentData = sortedApts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // --- 5. TOTAIS (Baseado no filtro total, não na página) ---
  const totals = useMemo(() => {
      const activeApts = filteredApts.filter(a => a.payment_status !== 'canceled');
      
      const total = activeApts.reduce((acc, curr) => acc + (curr.price || 0), 0);
      const received = activeApts.filter(a => a.payment_status === 'paid').reduce((acc, curr) => acc + (curr.price || 0), 0);
      const pending = activeApts.filter(a => a.payment_status === 'pending').reduce((acc, curr) => acc + (curr.price || 0), 0);
      
      return { total, received, pending };
  }, [filteredApts]);

  // --- 6. AÇÕES ---
  const handleUpdateStatus = async (id: string, newStatus: 'paid' | 'pending' | 'canceled') => {
      setOpenStatusMenuId(null);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, payment_status: newStatus } : a));

      const { error } = await supabase
        .from('appointments')
        .update({ payment_status: newStatus })
        .eq('id', id);

      if (error) {
          alert("Erro ao atualizar status");
          fetchData(); 
      }
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Hora', 'Paciente', 'Profissional', 'Serviço', 'Valor', 'Status Pagamento'];
    const rows = sortedApts.map(apt => {
      let dateObj = new Date();
      if (apt.start_time && apt.start_time.includes('T')) dateObj = new Date(apt.start_time);
      else if (apt.date) dateObj = new Date(apt.date);

      return [
        dateObj.toLocaleDateString('pt-BR'),
        dateObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
        getPatientName(apt.patient_id),
        getCollabName(apt.collaborator_id),
        getServiceName(apt.service_ids),
        apt.price.toFixed(2).replace('.', ','),
        apt.payment_status === 'paid' ? 'Pago' : apt.payment_status === 'canceled' ? 'Cancelado' : 'Pendente'
      ];
    });

    const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 md:ml-64 p-4 md:p-8 h-screen overflow-y-auto pb-32"> 
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-white border border-slate-200 rounded-lg text-slate-600">
                    <Menu size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Financeiro</h2>
                    <p className="text-slate-500 text-sm">Gerencie seu fluxo de caixa.</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2 self-end md:self-auto">
                <button 
                    onClick={handleExportCSV}
                    className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-sm flex items-center gap-2 text-sm font-medium"
                >
                    <Download size={18} />
                    <span className="hidden md:inline">Exportar Relatório</span>
                </button>
                <button 
                    onClick={fetchData}
                    className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-400 hover:text-blue-600 transition-colors shadow-sm"
                    title="Atualizar dados"
                >
                    <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>
        </header>

        {/* CARDS DE TOTAIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <DollarSign size={80} />
                </div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <DollarSign size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Previsto</span>
                </div>
                <h3 className="text-3xl font-bold text-slate-900">R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                <p className="text-xs text-slate-400 mt-2">Exclui cancelados</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group border-b-4 border-b-emerald-500">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <CheckCircle size={80} />
                </div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                        <CheckCircle size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-emerald-600">Em Caixa</span>
                </div>
                <h3 className="text-3xl font-bold text-slate-900">R$ {totals.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                <div className="flex items-center gap-1 text-xs text-emerald-600 mt-2 font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Pagamento confirmado
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group border-b-4 border-b-amber-500">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Clock size={80} />
                </div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                        <Clock size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-amber-600">A Receber</span>
                </div>
                <h3 className="text-3xl font-bold text-slate-900">R$ {totals.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                <div className="flex items-center gap-1 text-xs text-amber-600 mt-2 font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Aguardando baixa
                </div>
            </div>
        </div>

        {/* CONTAINER DA TABELA */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
            
            {/* Barra de Ferramentas */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50 rounded-t-2xl">
                <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
                    <div className="relative flex-1 md:flex-none w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            placeholder="Buscar paciente..." 
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none w-full focus:ring-2 focus:ring-blue-500 transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                        {['all', 'today', '7days', '30days'].map((type) => (
                             <button 
                                key={type}
                                onClick={() => setFilterType(type as FilterType)} 
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filterType === type ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                             >
                                {type === 'all' && 'Tudo'}
                                {type === 'today' && 'Hoje'}
                                {type === '7days' && '7d'}
                                {type === '30days' && '30d'}
                             </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex gap-3 w-full lg:w-auto">
                    <select className="flex-1 lg:flex-none px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white outline-none cursor-pointer focus:border-blue-500" value={filterCollab} onChange={e => setFilterCollab(e.target.value)}>
                        <option value="all">TODOS OS MÉDICOS</option>
                        {collaborators.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                    </select>
                    <select className="flex-1 lg:flex-none px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white outline-none cursor-pointer focus:border-blue-500" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="all">STATUS: TODOS</option>
                        <option value="paid">PAGO</option>
                        <option value="pending">PENDENTE</option>
                        <option value="canceled">CANCELADO</option>
                    </select>
                </div>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto flex-1 pb-4"> 
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4">Paciente</th>
                            <th className="px-6 py-4">Serviço</th>
                            <th className="px-6 py-4">Profissional</th>
                            <th className="px-6 py-4">Valor</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentData.map((apt, index) => {
                            const isLastItems = index > currentData.length - 3;
                            
                            // --- LÓGICA DE DATA ---
                            let dateObj = new Date();
                            let timeDisplay = "---";

                            if (apt.start_time && apt.start_time.includes('T')) {
                                dateObj = new Date(apt.start_time);
                                timeDisplay = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            } else if (apt.date) {
                                const dateString = apt.date.includes('T') ? apt.date : `${apt.date}T00:00:00`;
                                dateObj = new Date(dateString);
                                timeDisplay = apt.start_time || "---";
                            }

                            return (
                                <tr key={apt.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 text-xs text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon size={14} className="text-blue-500" />
                                            {/* Data Corrigida */}
                                            <span className="font-bold">{dateObj.toLocaleDateString('pt-BR')}</span>
                                            {/* Hora Limpa */}
                                            <span className="opacity-50">• {timeDisplay}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{getPatientName(apt.patient_id)}</td>
                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                        <span className="bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">{getServiceName(apt.service_ids)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                                                {getCollabName(apt.collaborator_id).charAt(0)}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">{getCollabName(apt.collaborator_id)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-black text-slate-900">
                                        R$ {apt.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-center relative">
                                        <button 
                                            onClick={() => setOpenStatusMenuId(openStatusMenuId === apt.id ? null : apt.id)}
                                            className={`
                                                relative w-32 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-2
                                                ${apt.payment_status === 'paid' 
                                                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-200 shadow-sm' 
                                                    : apt.payment_status === 'canceled'
                                                    ? 'bg-rose-100 text-rose-700 border-rose-200'
                                                    : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'
                                                }
                                            `}
                                        >
                                            {apt.payment_status === 'paid' && 'Pago ✓'}
                                            {apt.payment_status === 'pending' && 'Pendente'}
                                            {apt.payment_status === 'canceled' && 'Cancelado'}
                                            <ChevronDown size={12} className="opacity-70" />
                                        </button>

                                        {openStatusMenuId === apt.id && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setOpenStatusMenuId(null)}></div>
                                                <div 
                                                    className={`absolute right-6 z-50 bg-white border border-slate-200 shadow-xl rounded-xl py-1 w-32 overflow-hidden animate-in fade-in zoom-in-95 
                                                    ${isLastItems ? 'bottom-full mb-2' : 'top-12'}`} 
                                                >
                                                    <button onClick={() => handleUpdateStatus(apt.id, 'paid')} className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
                                                        <CheckCircle size={12} /> Pago
                                                    </button>
                                                    <button onClick={() => handleUpdateStatus(apt.id, 'pending')} className="w-full text-left px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2">
                                                        <Clock size={12} /> Pendente
                                                    </button>
                                                    <div className="border-t border-slate-100 my-1"></div>
                                                    <button onClick={() => handleUpdateStatus(apt.id, 'canceled')} className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                                                        <XCircle size={12} /> Cancelado
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {!isLoading && filteredApts.length === 0 && (
                    <div className="py-24 text-center text-slate-400 flex flex-col items-center">
                        <div className="p-4 bg-slate-50 rounded-full mb-4 border border-slate-100">
                            <Filter size={32} className="opacity-30" />
                        </div>
                        <p className="font-bold text-slate-500">Nenhum lançamento encontrado</p>
                        <p className="text-xs mt-1">Tente ajustar seus filtros de busca ou período.</p>
                    </div>
                )}
            </div>
            
            {/* --- PAGINAÇÃO FOOTER (NOVO) --- */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 rounded-b-2xl">
                <div className="text-xs text-slate-500 font-medium">
                    Mostrando <span className="font-bold text-slate-900">{Math.min((currentPage - 1) * itemsPerPage + 1, sortedApts.length)}</span> - <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, sortedApts.length)}</span> de <span className="font-bold text-slate-900">{sortedApts.length}</span> transações
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    
                    <span className="text-xs font-bold text-slate-700 px-2">
                        Página {currentPage} de {totalPages || 1}
                    </span>

                    <button 
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Finance;