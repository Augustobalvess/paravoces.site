import React, { useState } from 'react';
import { Activity, Apple, Brain, MoreHorizontal, ArrowRight, CheckCircle, Lock, ChevronLeft, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient'; 
import { useNavigate } from 'react-router-dom'; 

// --- FUNÇÕES DE MÁSCARA ---

// Formata o CPF em tempo real (000.000.000-00)
const formatCPF = (value: string): string => {
  // 1. Remove tudo que não for dígito
  const digits = value.replace(/\D/g, '');
  
  // 2. Aplica a máscara
  // Tenta aplicar a máscara completa primeiro
  const match = digits.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
  
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
  }
  
  // 3. Formatação parcial
  let formatted = digits;
  if (formatted.length > 3) formatted = formatted.substring(0, 3) + '.' + formatted.substring(3);
  if (formatted.length > 7) formatted = formatted.substring(0, 7) + '.' + formatted.substring(7);
  if (formatted.length > 11) formatted = formatted.substring(0, 11) + '-' + formatted.substring(11);
  
  return formatted.substring(0, 14); // Limita ao tamanho máximo do CPF formatado
};

// Formata o Telefone/WhatsApp em tempo real ((99) 99999-9999)
const formatPhone = (value: string): string => {
  // 1. Remove tudo que não for dígito
  const digits = value.replace(/\D/g, '');
  
  // 2. Aplica a máscara
  let formatted = digits;
  
  if (formatted.length > 0) {
    formatted = '(' + formatted;
  }
  if (formatted.length > 3) {
    formatted = formatted.substring(0, 3) + ') ' + formatted.substring(3);
  }
  
  // Verifica se é 8 ou 9 dígitos (celular ou fixo)
  // Se for > 10, tentamos formatar para (99) 99999-9999 (15 caracteres)
  if (formatted.length > 10) { 
    // Insere o hífen antes do 4º ou 5º dígito, dependendo do total de dígitos
    formatted = formatted.substring(0, 10) + '-' + formatted.substring(10);
  } else if (formatted.length > 9) { 
    // Insere o hífen para o formato (99) 9999-9999 (14 caracteres)
    formatted = formatted.substring(0, 9) + '-' + formatted.substring(9);
  }

  // Limita o tamanho total (máximo 15 caracteres)
  return formatted.substring(0, 15); 
};

// --- COMPONENTE ONBOARDING ---

export default function Onboarding() {
  const [step, setStep] = useState<'niche' | 'signup'>('niche');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Estado do Formulário
  const [formData, setFormData] = useState({
    name: '',
    clinicName: '',
    email: '',
    phone: '',
    cpf: '',
    password: '',
  });

  // Funções de Handler atualizadas para usar as máscaras
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'cpf') {
      newValue = formatCPF(value);
    } else if (name === 'phone') {
      newValue = formatPhone(value);
    }

    setFormData({
      ...formData,
      [name]: newValue,
    });
  };


  const niches = [
    { id: 'nutricionista', label: 'Nutrição', icon: Apple, desc: 'Dietas, Bioimpedância e Acompanhamento.' },
    { id: 'fisioterapeuta', label: 'Fisioterapia', icon: Activity, desc: 'Reabilitação, Osteopatia e Sessões.' },
    { id: 'psicologo', label: 'Psicologia', icon: Brain, desc: 'Terapia, Anotações Clínicas Seguras.' },
    { id: 'outros', label: 'Outra Especialidade', icon: MoreHorizontal, desc: 'Configuração genérica para saúde.' },
  ];

  const handleNicheSelect = (nicheId: string) => {
    setSelectedNiche(nicheId);
    setStep('signup');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNiche) return;

    setLoading(true);

    try {
      // Remove a formatação para enviar APENAS os dígitos ao Supabase
      const rawCpf = formData.cpf.replace(/\D/g, '');
      const rawPhone = formData.phone.replace(/\D/g, '');

      // 1. Cria o usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            role: selectedNiche,
            clinic_name: formData.clinicName || `Clínica de ${formData.name}`,
            phone: rawPhone, // Envia o telefone sem formatação
            cpf: rawCpf, // Envia o CPF sem formatação
          },
        },
      });

      if (error) throw error;

      navigate('/dashboard');

    } catch (error: any) {
      alert('Erro ao criar conta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Visualização 1: Seleção de Nicho
  if (step === 'niche') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-600/30">
             <Activity className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Bem-vindo ao HealthFlow</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
            Vamos personalizar sua experiência. Qual é a especialidade principal da sua clínica?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl w-full">
          {niches.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNicheSelect(item.id)}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-500 hover:ring-2 hover:ring-blue-100 hover:shadow-xl transition-all duration-300 group text-left flex flex-col h-full"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-700">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.label}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
                  {item.desc}
                </p>
                <div className="flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                  Selecionar <ArrowRight size={16} className="ml-2" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Botão de Login Funcionando */}
        <button 
          onClick={() => navigate('/login')} 
          className="mt-12 text-slate-400 hover:text-slate-600 font-medium"
        >
            Já tem uma conta? Fazer Login
        </button>
      </div>
    );
  }

  // Visualização 2: Formulário de Cadastro
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100 relative">
        {/* BOTÃO DE VOLTAR ATUALIZADO (com melhor área de clique) */}
        <button 
          onClick={() => setStep('niche')}
          className="absolute top-6 left-6 p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Voltar para seleção de nicho"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="text-center mb-8 mt-4">
            <h2 className="text-2xl font-bold text-slate-900">Crie sua Conta</h2>
            <p className="text-slate-500 text-sm mt-2">Comece seu teste grátis de 7 dias.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input 
              required
              type="text" 
              name="name" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Dr. João Silva"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Clínica</label>
             <div className="relative">
                 <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   required
                   type="text" 
                   name="clinicName" 
                   className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                   placeholder="Clínica Silva e Saúde"
                   value={formData.clinicName}
                   onChange={handleChange}
                 />
             </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
            <input 
              required
              type="text" 
              name="cpf" 
              maxLength={14} 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={handleChange} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Profissional</label>
            <input 
              required
              type="email" 
              name="email" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="joao@clinica.com"
              value={formData.email}
              onChange={handleChange} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
            <input 
              required
              type="tel" 
              name="phone" 
              maxLength={15} 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="(11) 99999-9999"
              value={formData.phone}
              onChange={handleChange} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input 
              required
              type="password" 
              name="password" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange} 
            />
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mt-4 shadow-inner">
            <h4 className="flex items-center text-white font-bold text-sm mb-2">
              <CheckCircle size={16} className="mr-2 text-emerald-400" /> 7 Dias Grátis
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Você terá acesso total à plataforma. Após o período de teste, a assinatura será de <strong>R$ 197/mês</strong>. Cancele quando quiser.
            </p>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
          >
            {loading ? (
              'Criando Conta...'
            ) : (
              <>
                <Lock size={18} className="mr-2" />
                Criar Conta e Acessar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}