import React, { useEffect, useState } from 'react';
import {
  Search, Plus, Clock, MessageCircle, X, Trash2, Home, Building2, Check, Edit2,
  ChevronLeft, ChevronRight, ChevronDown, CheckCircle, Menu, UserPlus, Save, CreditCard, Calendar, 
  Calendar as CalendarIcon, History
} from 'lucide-react';
import Sidebar from './Sidebar';
import { supabase } from '../lib/supabaseClient';
import { Patient, Appointment, Service, Collaborator } from '../types';

/**
 * AGENDA OTIMIZADA
 * - Botão de Histórico separado
 * - Atualização Otimista (Zero Delay)
 */

type ViewMode = 'day' | 'week' | 'month' | 'year' | 'history';

// --- Máscaras ---
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const Agenda: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  const [showQuickPatientModal, setShowQuickPatientModal] = useState(false);
  const [quickPatientData, setQuickPatientData] = useState({
    name: '',
    phone: '',
    cpf: '',
    birthDate: ''
  });

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null); 
  const [editingAptId, setEditingAptId] = useState<string | null>(null);
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState<string | null>(null); 
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState('nossa clínica'); 
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  const [newApt, setNewApt] = useState({
    patientId: '',
    serviceIds: [] as string[],
    collaboratorId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    location: 'clinic' as 'clinic' | 'home'
  });

  const activePatients = (patients || []).filter((p: any) => p.isActive !== false);
  const activeServices = services; 
  const activeCollaborators = collaborators; 

  const filteredPatients = activePatients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // --- Helpers ---
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const factor = direction === 'next' ? 1 : -1;
    const newDate = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + factor);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (factor * 7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + factor);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + factor);
        break;
      case 'history':
        newDate.setMonth(newDate.getMonth() + factor);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const getHeaderTitle = () => {
    if (viewMode === 'history') return 'Histórico Geral';
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    return currentDate.toLocaleDateString('pt-BR', options).replace(/^\w/, c => c.toUpperCase());
  };

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const selectedServices = activeServices.filter(s => newApt.serviceIds.includes(s.id));
  const currentPrice = selectedServices.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
  
  const getPatient = (id: string) => activePatients.find(p => p.id === id) || patients.find(p => p.id === id);
  const getCollaborator = (id: string) => activeCollaborators.find(c => c.id === id) || collaborators.find(c => c.id === id);


  // --- Fetch Data ---
  const fetchAllData = async () => {
    if (appointments.length === 0) setIsLoading(true);
    
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes?.data?.user;

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('clinic_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          setClinicId(profile.clinic_id);
          
          if (profile.clinic_id) {
              const { data: clinicData } = await supabase.from('clinics').select('name').eq('id', profile.clinic_id).single();
              
              const fetchedName = clinicData?.name;
              if (fetchedName && typeof fetchedName === 'string') {
                  let cleanedName = fetchedName;
                  if (cleanedName.includes('@')) {
                      cleanedName = cleanedName.split('@')[0];
                      if (cleanedName.includes('.')) cleanedName = cleanedName.split('.')[0];
                  }
                  if (cleanedName.trim()) setClinicName(cleanedName.trim());
              }
          }
        }
      }

      const patientsQuery = clinicId
        ? supabase.from('patients').select('*').eq('clinic_id', clinicId).order('name', { ascending: true })
        : supabase.from('patients').select('*').order('name', { ascending: true });

      const servicesQuery = clinicId
        ? supabase.from('services').select('*').eq('clinic_id', clinicId).eq('is_active', true) 
        : supabase.from('services').select('*').eq('is_active', true);

      const collabsQuery = clinicId
        ? supabase.from('collaborators').select('*').eq('clinic_id', clinicId).eq('is_active', true) 
        : supabase.from('collaborators').select('*').eq('is_active', true);

      const apptsQuery = clinicId
        ? supabase.from('appointments').select('*').eq('clinic_id', clinicId)
        : supabase.from('appointments').select('*');

      const [patRes, servRes, colRes, aptRes] = await Promise.all([
        patientsQuery, servicesQuery, collabsQuery, apptsQuery
      ]);

      setPatients(patRes.data || []);
      setServices((servRes.data || []).map((s: any) => ({ ...s, color: s.color || 'bg-blue-100 text-blue-700' })));
      setCollaborators(colRes.data || []);

      const formattedApts: Appointment[] = (aptRes.data || []).map((a: any) => formatAppointmentFromDB(a));

      setAppointments(formattedApts);
    } catch (err) {
      console.error('Erro ao carregar dados da agenda:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAppointmentFromDB = (a: any): Appointment => {
    const start = a.start_time ? new Date(a.start_time) : null;
    const end = a.end_time ? new Date(a.end_time) : null;
    return {
      id: a.id,
      patientId: a.patient_id,
      collaboratorId: a.collaborator_id,
      serviceIds: a.service_ids || (a.service_id ? [a.service_id] : []),
      date: start ? start.toISOString().split('T')[0] : (a.date || new Date().toISOString().split('T')[0]),
      startTime: start ? start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : (a.start_time || '09:00'),
      endTime: end ? end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : (a.end_time || '10:00'),
      status: a.status,
      price: a.price || 0,
      location: a.location || 'clinic'
    } as Appointment;
  };

  useEffect(() => {
    fetchAllData();
    const channel = supabase
      .channel('agenda_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
          // Só recarrega tudo se a mudança NÃO foi feita por nós mesmos (para evitar piscar tela)
          // Mas como não temos ID do cliente aqui fácil, recarregamos em background.
          // A atualização otimista já tratou a UI imediata.
          console.log('Update externo recebido', payload);
          fetchAllData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clinicId]);

  // --- Handlers ---

  const handleSaveQuickPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPatientData.name.trim() || !clinicId) return;
    setIsLoading(true);

    try {
      const newPatientPayload = {
        clinic_id: clinicId,
        name: quickPatientData.name,
        phone: quickPatientData.phone.replace(/\D/g, ''),
        cpf: quickPatientData.cpf.replace(/\D/g, ''),
        birth_date: quickPatientData.birthDate || null,
        email: '',
        address: { street: '', number: '', neighborhood: '', city: '' },
        lastVisit: 'Novo',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(quickPatientData.name)}&background=random`,
        medicalRecords: [],
        isActive: true
      };
      const { data, error } = await supabase.from('patients').insert([newPatientPayload]).select().single();
      if (error) throw error;
      if (data) {
        setPatients(prev => [...prev, data].sort((a: any, b: any) => a.name.localeCompare(b.name)));
        setNewApt(prev => ({ ...prev, patientId: data.id }));
        setPatientSearch(data.name);
        setQuickPatientData({ name: '', phone: '', cpf: '', birthDate: '' });
        setShowQuickPatientModal(false);
      }
    } catch (err: any) {
      alert('Erro ao cadastrar paciente: ' + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleService = (serviceId: string) => {
    setNewApt(prev => {
      const exists = prev.serviceIds.includes(serviceId);
      return exists ? { ...prev, serviceIds: prev.serviceIds.filter(id => id !== serviceId) } : { ...prev, serviceIds: [...prev.serviceIds, serviceId] };
    });
  };

  const handleOpenModal = (apt?: Appointment, preSelectedDate?: string, preSelectedTime?: string) => {
    if (apt) {
      setEditingAptId(apt.id);
      const currentPatient = activePatients.find(p => p.id === apt.patientId);
      setPatientSearch(currentPatient ? currentPatient.name : '');
      setNewApt({
        patientId: apt.patientId,
        serviceIds: apt.serviceIds || [],
        collaboratorId: apt.collaboratorId,
        date: apt.date,
        startTime: apt.startTime,
        endTime: apt.endTime,
        location: apt.location
      });
    } else {
      setEditingAptId(null);
      setPatientSearch('');
      let autoEndTime = '10:00';
      if (preSelectedTime) {
        const [h, m] = preSelectedTime.split(':').map(Number);
        const endH = h + 1;
        autoEndTime = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
      setNewApt({
        patientId: '',
        serviceIds: [],
        collaboratorId: '',
        date: preSelectedDate || new Date().toISOString().split('T')[0],
        startTime: preSelectedTime || '09:00',
        endTime: autoEndTime,
        location: 'clinic'
      });
    }
    setShowModal(true);
    setActiveMenuId(null);
    setIsPatientDropdownOpen(false);
  };

  // --- OTIMIZAÇÃO AQUI: Salva no banco E atualiza a tela na hora ---
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;
    setIsLoading(true);

    try {
      const startDateTime = new Date(`${newApt.date}T${newApt.startTime}`);
      const endDateTime = new Date(`${newApt.date}T${newApt.endTime}`);
      const basePayload = {
        clinic_id: clinicId,
        patient_id: newApt.patientId,
        collaborator_id: newApt.collaboratorId,
        service_ids: newApt.serviceIds,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: editingAptId ? undefined : 'pending', 
        price: currentPrice,
        location: newApt.location,
        source: 'app'
      };
      
      const payload: any = Object.entries(basePayload).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = value;
        return acc;
      }, {} as any);
      
      let savedData: any = null;

      if (editingAptId) {
        // Atualiza no banco
        const { data, error } = await supabase.from('appointments').update(payload).eq('id', editingAptId).select().single();
        if (error) throw error;
        savedData = data;
        
        // ATUALIZAÇÃO OTIMISTA (Atualiza a lista local IMEDIATAMENTE)
        setAppointments(prev => prev.map(a => a.id === editingAptId ? formatAppointmentFromDB(savedData) : a));
      } else {
        // Insere no banco
        const { data, error } = await supabase.from('appointments').insert([payload]).select().single();
        if (error) throw error;
        savedData = data;

        // ATUALIZAÇÃO OTIMISTA (Adiciona na lista local IMEDIATAMENTE)
        setAppointments(prev => [...prev, formatAppointmentFromDB(savedData)]);
      }

      setShowModal(false);
    } catch (err: any) {
      alert('Erro ao salvar agendamento: ' + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAppointment = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); e.preventDefault();
    setShowConfirmCancelModal(id); setActiveMenuId(null);
  };
  
  // --- OTIMIZAÇÃO AQUI TAMBÉM ---
  const handleFinalCancelAppointment = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('appointments').update({ status: 'canceled' }).eq('id', id);
      if (error) throw error;

      // ATUALIZAÇÃO OTIMISTA: Remove visualmente na hora
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'canceled' } : a));
      
    } catch (err) {
      alert('Erro ao cancelar.');
    } finally {
      setShowConfirmCancelModal(null); setIsLoading(false);
    }
  };

  const handleWhatsApp = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient && patient.phone) {
      window.open(`https://wa.me/55${patient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${patient.name}, confirmando seu agendamento na ${clinicName}.`)}`, '_blank');
    } else {
      alert('Paciente sem telefone.');
    }
  };

  const hours = Array.from({ length: 19 }, (_, i) => 5 + i);

  // --- RENDER VIEWS ---

  const renderHistoryView = () => {
      // Filtra por cancelados OU datas passadas
      const historyApts = appointments.filter(a => {
        const isCanceled = a.status === 'canceled' || a.status === 'cancelled';
        const aptDate = new Date(`${a.date}T${a.endTime}`);
        const isPast = aptDate < new Date();
        return isCanceled || isPast;
      }).sort((a, b) => b.date.localeCompare(a.date));

      return (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
              {/* --- CABEÇALHO DO HISTÓRICO COM BOTÃO FECHAR --- */}
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900 text-lg">Histórico de Atendimentos</h3>
                      <span className="text-xs font-medium text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                        {historyApts.length} registros
                      </span>
                  </div>
                  
                  {/* BOTÃO X PARA SAIR */}
                  <button 
                      onClick={() => setViewMode('week')} 
                      className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
                      title="Voltar para Agenda"
                  >
                      <X size={20} />
                  </button>
              </div>
              
              {historyApts.length > 0 ? historyApts.map(apt => {
                  const patient = getPatient(apt.patientId);
                  const isCanceled = apt.status === 'canceled' || apt.status === 'cancelled';
                  
                  return (
                    <div key={apt.id} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${isCanceled ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                                {isCanceled ? 'X' : <CheckCircle size={20} />}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-base">{patient?.name || 'Paciente Removido'}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                   <Calendar size={12} /> {new Date(apt.date).toLocaleDateString()} • {apt.startTime}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md tracking-wide ${isCanceled ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {isCanceled ? 'Cancelado' : 'Concluído'}
                            </span>
                            <p className="text-sm font-bold text-slate-700 mt-2">R$ {apt.price}</p>
                        </div>
                    </div>
                  );
              }) : (
                <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    <History size={48} className="mx-auto mb-2 opacity-20" />
                    <p>Nenhum histórico disponível.</p>
                </div>
              )}
          </div>
      );
  };

  const renderAppointmentCard = (apt: Appointment, isWeekView: boolean) => {
    const patient = getPatient(apt.patientId);
    const collaborator = getCollaborator(apt.collaboratorId);
    const aptServices = activeServices.filter(s => apt.serviceIds?.includes(s.id));
    const primaryService = aptServices[0] || services.find(s => apt.serviceIds?.includes(s.id));

    const startMin = timeToMinutes(apt.startTime);
    const endMin = timeToMinutes(apt.endTime);
    const duration = endMin - startMin;
    const dayStartMin = 5 * 60;
    const pixelsPerMinute = 64 / 60;
    const top = (startMin - dayStartMin) * pixelsPerMinute;
    const height = duration * pixelsPerMinute;

    const isCanceled = apt.status === 'canceled' || apt.status === 'cancelled';
    const isConfirmed = apt.status === 'confirmed' || (apt as any).payment_status === 'paid';
    
    if (isCanceled) return null;
    if (searchTerm && !patient?.name.toLowerCase().includes(searchTerm.toLowerCase())) return null;

    const cardClass = isConfirmed 
      ? 'bg-emerald-50 border-emerald-500' 
      : (primaryService?.color?.replace('text', 'border') || 'border-brand-500') + ' bg-white';

    return (
      <div
        key={apt.id}
        className={`absolute left-1 right-1 rounded-lg p-2 border-l-4 shadow-sm hover:shadow-md transition-all group overflow-hidden z-10 ${cardClass}`}
        style={{ top: `${top}px`, height: `${Math.max(height, 40)}px` }}
        onClick={(e) => { e.stopPropagation(); }} 
      >
        <div className="flex justify-between items-center relative h-full">
          <div className="min-w-0 flex flex-col justify-center h-full">
            <h4 className={`font-bold text-sm flex items-center gap-1 truncate text-slate-800`}>{patient?.name}</h4>
            {(isWeekView || height > 50) && (
              <>
                <p className="text-[10px] text-slate-500 truncate">{collaborator?.name}</p>
                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400">
                  <Clock size={10} /> {apt.startTime} - {apt.endTime}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 z-20 h-full">
            {isConfirmed && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal(apt); }} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors leading-tight"><Edit2 size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); handleWhatsApp(apt.patientId); }} className="text-sm text-green-500 hover:text-green-700 flex items-center gap-1 transition-colors leading-tight"><MessageCircle size={14} /></button>
            <button onClick={(e) => handleCancelAppointment(e, apt.id)} className="text-sm text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors leading-tight"><Trash2 size={14} /></button>
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = getStartOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));

    return (
      <div className="flex flex-col h-full bg-white rounded-b-2xl overflow-hidden">
        <div className="flex-1 overflow-auto relative">
          <div className="min-w-[800px] flex flex-col h-full relative">
            <div className="flex border-b border-slate-300 sticky top-0 bg-white z-30 shadow-sm">
              <div className="w-16 border-r border-slate-300 flex-shrink-0 bg-white sticky left-0 z-40"></div> 
              <div className="flex-1 grid grid-cols-7">
                {weekDays.map((day, i) => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div key={i} className="py-4 text-center border-r border-slate-300 last:border-r-0 bg-white">
                      <span className={`text-xs font-semibold uppercase mb-1 block ${isToday ? 'text-slate-900' : 'text-slate-500'}`}>
                        {day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                      </span>
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-lg font-normal ${isToday ? 'bg-slate-900 text-white shadow-md shadow-slate-300' : 'text-slate-700'}`}>
                        {day.getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex min-h-[1200px]">
              <div className="w-16 border-r border-slate-300 flex-shrink-0 bg-white select-none sticky left-0 z-30">
                {hours.map((h, i) => (
                  <div key={h} className="h-16 relative bg-white">
                    <span className="absolute -top-2.5 right-2 text-xs text-slate-400 font-medium px-1">{h}:00</span>
                  </div>
                ))}
              </div>
              <div className="flex-1 grid grid-cols-7 relative">
                {hours.map((h, i) => <div key={`line-${h}`} className="absolute w-full border-t border-slate-300" style={{ top: `${i * 64}px` }}></div>)}
                {weekDays.map((day, i) => {
                  const dateStr = day.toISOString().split('T')[0];
                  const dayApts = appointments.filter(a => a.date === dateStr);
                  return (
                    <div key={i} className="border-r border-slate-300 last:border-r-0 relative h-full">
                      {hours.map((h, index) => (
                        <div key={h} className="absolute w-full border-b border-transparent hover:bg-slate-50/40 transition-colors z-0 cursor-pointer"
                          style={{ top: `${index * 64}px`, height: '64px' }}
                          onClick={(e) => { e.stopPropagation(); const timeStr = `${h.toString().padStart(2, '0')}:00`; handleOpenModal(undefined, dateStr, timeStr); }}
                        />
                      ))}
                      {dayApts.map(apt => renderAppointmentCard(apt, true))}
                      {isSameDay(day, new Date()) && (
                        <div className="absolute w-full border-t-2 border-slate-900 z-20 pointer-events-none flex items-center" style={{ top: `${((new Date().getHours() * 60 + new Date().getMinutes()) - 300) * (64 / 60)}px` }}>
                          <div className="w-2 h-2 bg-slate-900 rounded-full -ml-1"></div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    return (
      <div className="flex flex-col h-full bg-white rounded-b-2xl overflow-hidden">
        <div className="flex border-b border-slate-300 pl-16 md:pl-20">
          <div className="py-4 text-left px-4">
            <span className="text-xs font-semibold uppercase text-slate-900 block">{currentDate.toLocaleDateString('pt-BR', { weekday: 'long' })}</span>
            <div className="text-3xl font-medium text-slate-900">{currentDate.getDate()}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto relative pt-6">
          <div className="flex min-h-[1200px]">
            <div className="w-16 md:w-20 border-r border-slate-300 flex-shrink-0 bg-white select-none">
              {hours.map((h) => (
                <div key={h} className="h-16 relative border-b border-transparent">
                  <span className="absolute -top-2.5 right-2 text-xs text-slate-400 font-medium bg-white px-1">{h}:00</span>
                </div>
              ))}
            </div>
            <div className="flex-1 relative bg-white">
              {hours.map((h, i) => <div key={`line-${h}`} className="absolute w-full border-t border-slate-300" style={{ top: `${i * 64}px` }}></div>)}
              <div className="relative h-full">
                {hours.map((h, index) => (
                  <div key={h} className="absolute w-full border-b border-transparent hover:bg-slate-50/40 transition-colors z-0 cursor-pointer"
                    style={{ top: `${index * 64}px`, height: '64px' }}
                    onClick={(e) => { e.stopPropagation(); const dateStr = currentDate.toISOString().split('T')[0]; const timeStr = `${h.toString().padStart(2, '0')}:00`; handleOpenModal(undefined, dateStr, timeStr); }}
                  />
                ))}
                {appointments.filter(a => a.date === currentDate.toISOString().split('T')[0]).map(apt => renderAppointmentCard(apt, true))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const calendarDays = [];
    for (let i = 0; i < startingDay; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(year, month, i));

    return (
      <div className="h-full bg-white rounded-b-2xl overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 border-b border-slate-300 bg-slate-50">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase">{day}</div>)}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-6">
          {calendarDays.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="bg-slate-50/30 border-b border-r border-slate-400"></div>;
            const dateStr = date.toISOString().split('T')[0];
            const dayApts = appointments.filter(a => a.date === dateStr && (a.status !== 'canceled' && a.status !== 'cancelled')); 
            const isToday = isSameDay(date, new Date());
            return (
              <div key={idx} className={`border-b border-r border-slate-400 p-1 md:p-2 min-h-[80px] hover:bg-slate-50 transition-colors cursor-pointer flex flex-col gap-1 ${isToday ? 'bg-slate-50/50' : ''}`}
                onClick={() => { setCurrentDate(date); setViewMode('day'); }}
              >
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-slate-900 text-white' : 'text-slate-700'}`}>{date.getDate()}</span>
                <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                  {dayApts.slice(0, 3).map(apt => {
                    const service = activeServices.find(s => apt.serviceIds?.includes(s.id));
                    return (
                      <div key={apt.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate border-l-2 ${service?.color || 'bg-blue-100 text-blue-700 border-blue-500'}`}>
                        {apt.startTime} {getPatient(apt.patientId)?.name}
                      </div>
                    )
                  })}
                  {dayApts.length > 3 && <span className="text-[10px] text-slate-400 pl-1">+ {dayApts.length - 3} mais</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => new Date(currentDate.getFullYear(), i, 1));
    return (
      <div className="h-full bg-white rounded-b-2xl overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {months.map((monthDate, idx) => (
            <div key={idx} className="border border-slate-100 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setCurrentDate(monthDate); setViewMode('month'); }}>
              <h4 className="font-bold text-slate-900 mb-2">{monthDate.toLocaleDateString('pt-BR', { month: 'long' })}</h4>
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: new Date(currentDate.getFullYear(), idx + 1, 0).getDate() }, (_, d) => d + 1).map(day => (
                  <span key={day} className="text-[10px] text-slate-500 p-0.5">{day}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // --- JSX ---
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentView={''} setCurrentView={() => { }} niche={''} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative md:ml-64 transition-all duration-300">
        <div className="p-4 md:p-6 flex flex-col h-full overflow-hidden relative" onClick={() => { setActiveMenuId(null); setShowViewMenu(false); }}>

          {/* --- HEADER --- */}
          <header className="flex flex-col md:flex-row justify-between md:items-center mb-2 md:mb-4 gap-3 md:gap-4 flex-shrink-0 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 md:gap-4 pl-2">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"><Menu size={20} /></button>
              <button onClick={goToToday} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors hidden md:block">Hoje</button>
              <div className="flex items-center gap-1">
                <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"><ChevronLeft size={20} /></button>
                <button onClick={() => navigateDate('next')} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"><ChevronRight size={20} /></button>
              </div>
              <h2 className="text-lg md:text-xl font-medium text-slate-900 min-w-[120px] md:min-w-[200px] truncate">{getHeaderTitle()}</h2>
            </div>

            <div className="flex items-center gap-3 pr-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-sm text-slate-900" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>

              {/* Botão de Histórico Separado (Visível em Desktop) */}
              <button 
                onClick={() => setViewMode('history')} 
                className={`hidden md:flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors ${viewMode === 'history' ? 'bg-slate-100 ring-2 ring-slate-100' : ''}`}
              >
                  <History size={16} className="text-slate-500" />
                  <span>Histórico</span>
              </button>

              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowViewMenu(!showViewMenu); }} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
                  <span className="hidden md:inline">
                    {viewMode === 'day' && 'Dia'}
                    {viewMode === 'week' && 'Semana'}
                    {viewMode === 'month' && 'Mês'}
                    {viewMode === 'year' && 'Ano'}
                    {viewMode === 'history' && 'Histórico'}
                  </span>
                  <span className="md:hidden">Ver</span>
                  <ChevronDown size={14} />
                </button>
                
                {showViewMenu && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-100 shadow-lg rounded-lg py-1 z-50 animate-in fade-in zoom-in-95">
                    <button onClick={() => { setViewMode('day'); setShowViewMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">Dia</button>
                    <button onClick={() => { setViewMode('week'); setShowViewMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">Semana</button>
                    <button onClick={() => { setViewMode('month'); setShowViewMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">Mês</button>
                    <button onClick={() => { setViewMode('year'); setShowViewMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">Ano</button>
                    {/* Mantido no mobile apenas, se quiser remover daqui também me avise */}
                    <div className="md:hidden border-t border-slate-100 my-1"></div>
                    <button onClick={() => { setViewMode('history'); setShowViewMenu(false); }} className="md:hidden w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2"><History size={14}/> Histórico</button>
                  </div>
                )}
              </div>

              <button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-slate-800 text-white p-2 md:px-4 md:py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors">
                  <Plus size={20} /> <span className="hidden md:inline">Agendar</span>
              </button>
            </div>
          </header>

          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'year' && renderYearView()}
            {viewMode === 'history' && renderHistoryView()}
          </div>

          <button onClick={() => handleOpenModal()} className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-95 transition-transform">
            <Plus size={28} />
          </button>

          {/* --- MODAL PRINCIPAL --- */}
          {showModal && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in p-4 h-full w-full fixed top-0 left-0">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 border border-slate-100 max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                  <h3 className="font-bold text-lg text-slate-900">{editingAptId ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <div className="overflow-y-auto p-6 flex-1">
                  <form onSubmit={handleSaveAppointment} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Data</label>
                      <input type="date" required className="w-full p-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none" value={newApt.date} onChange={e => setNewApt({ ...newApt, date: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Início</label>
                        <input type="time" required className="w-full p-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none" value={newApt.startTime} onChange={e => setNewApt({ ...newApt, startTime: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Fim</label>
                        <input type="time" required className="w-full p-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none" value={newApt.endTime} onChange={e => setNewApt({ ...newApt, endTime: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">Local de Atendimento</label>
                      <div className="bg-slate-100 p-1.5 rounded-xl grid grid-cols-2 gap-1">
                        <button type="button" onClick={() => setNewApt({ ...newApt, location: 'clinic' })} className={`py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${newApt.location === 'clinic' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'bg-transparent text-slate-600 hover:bg-slate-200/50'}`}>
                          <Building2 size={16} /> Na Clínica
                        </button>
                        <button type="button" onClick={() => setNewApt({ ...newApt, location: 'home' })} className={`py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${newApt.location === 'home' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'bg-transparent text-slate-600 hover:bg-slate-200/50'}`}>
                          <Home size={16} /> Domicílio
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Paciente</label>
                      <div className="flex gap-2 relative">
                        <div className="flex-1 relative">
                          <div className="relative">
                            <input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none pr-10" placeholder="Busque o paciente..." value={patientSearch} onChange={(e) => { setPatientSearch(e.target.value); setIsPatientDropdownOpen(true); if (e.target.value === '') setNewApt({ ...newApt, patientId: '' }); }} onFocus={() => setIsPatientDropdownOpen(true)} />
                            <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                          {isPatientDropdownOpen && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50">
                              {filteredPatients.length > 0 ? (
                                filteredPatients.map(p => (
                                  <div key={p.id} className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 last:border-0" onClick={() => { setNewApt({ ...newApt, patientId: p.id }); setPatientSearch(p.name); setIsPatientDropdownOpen(false); }}>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold">{p.name.charAt(0)}</div>
                                    <div>
                                      <div className="text-sm font-medium text-slate-900">{p.name}</div>
                                      <div className="text-xs text-slate-500">{p.phone}</div>
                                    </div>
                                  </div>
                                ))
                              ) : <div className="p-4 text-center text-sm text-slate-500">Nenhum paciente encontrado.</div>}
                            </div>
                          )}
                        </div>
                        <button type="button" onClick={() => setShowQuickPatientModal(true)} className="p-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200" title="Cadastrar novo paciente"><UserPlus size={20} /></button>
                      </div>
                      {isPatientDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsPatientDropdownOpen(false)}></div>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Profissional</label>
                      <select required className="w-full p-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none" value={newApt.collaboratorId} onChange={e => setNewApt({ ...newApt, collaboratorId: e.target.value })}>
                        <option value="">Selecione o doutor(a)...</option>
                        {activeCollaborators.map(c => <option key={c.id} value={c.id}>{c.name} - {c.role}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">Serviços</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {activeServices.map(s => {
                          const isSelected = newApt.serviceIds.includes(s.id);
                          return (
                            <div key={s.id} onClick={() => handleToggleService(s.id)} className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${isSelected ? 'border-slate-500 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-slate-900 border-slate-900' : 'border-slate-300'}`}>{isSelected && <Check size={12} className="text-white" />}</div>
                                <span className={`text-sm ${isSelected ? 'font-medium text-slate-900' : 'text-slate-600'}`}>{s.name}</span>
                              </div>
                              <span className="text-xs font-semibold text-slate-500">R$ {s.price}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100">
                      <span className="text-sm font-medium text-slate-600">Total Estimado</span>
                      <span className="text-xl font-bold text-slate-900">R$ {currentPrice.toFixed(2)}</span>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
                      {isLoading ? 'Salvando...' : (editingAptId ? 'Salvar Alterações' : 'Confirmar Agendamento')}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* --- MODAL: CADASTRO RÁPIDO DE PACIENTE --- */}
          {showQuickPatientModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-slate-900">Novo Paciente Rápido</h3>
                  <button onClick={() => setShowQuickPatientModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <form onSubmit={handleSaveQuickPatient} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Nome Completo</label>
                    <input required autoFocus className="w-full p-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none" placeholder="Ex: Maria Silva" value={quickPatientData.name} onChange={e => setQuickPatientData({ ...quickPatientData, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">CPF</label>
                      <div className="relative">
                        <CreditCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" className="w-full pl-9 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none" placeholder="000.000..." maxLength={14} value={quickPatientData.cpf} onChange={e => setQuickPatientData({ ...quickPatientData, cpf: maskCPF(e.target.value) })} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Nascimento</label>
                      <div className="relative">
                        <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="date" className="w-full pl-9 pr-2 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none" value={quickPatientData.birthDate} onChange={e => setQuickPatientData({ ...quickPatientData, birthDate: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Telefone / WhatsApp</label>
                    <input type="tel" maxLength={15} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none" placeholder="(00) 00000-0000" value={quickPatientData.phone} onChange={e => setQuickPatientData({ ...quickPatientData, phone: maskPhone(e.target.value) })} />
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-70">
                      <Save size={18} /> {isLoading ? 'Salvando...' : 'Salvar e Selecionar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* --- MODAL: CONFIRMAÇÃO DE CANCELAMENTO --- */}
          {showConfirmCancelModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 border border-slate-100 p-8 text-center">
                <div className="mx-auto bg-rose-100 rounded-full w-14 h-14 flex items-center justify-center mb-4"><X size={24} className="text-rose-600" /></div>
                <h3 className="font-bold text-xl text-slate-900 mb-2">Remover?</h3>
                <p className="text-sm text-slate-500 mb-6">Essa ação não pode ser desfeita.</p>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowConfirmCancelModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                  <button type="button" onClick={() => handleFinalCancelAppointment(showConfirmCancelModal!)} disabled={isLoading} className="flex-1 py-3 bg-rose-600 text-white font-medium rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 disabled:opacity-70 disabled:cursor-not-allowed">{isLoading ? 'Removendo...' : 'Sim, Remover'}</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Agenda;