import React, { useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  Menu,
  X,
  Activity,
  HeartHandshake, 
  DollarSign,     
  Calendar,
  Crown,
  Play
} from "lucide-react";

// NOTA: Removemos os imports de imagem.
// Como as imagens estão na pasta 'public/assets', usamos o caminho direto no src="/..."

const Section: React.FC<{ id?: string; className?: string; children: React.ReactNode }> = ({ id, className, children }) => (
  <section id={id} className={`py-20 md:py-28 px-6 transition-all duration-700 ${className || ""}`}>{children}</section>
);

const SectionHeader: React.FC<{ title: string, subtitle: string, color?: string, light?: boolean }> = ({ title, subtitle, color, light }) => (
    <div className="max-w-3xl mx-auto text-center mb-16">
        <p className={`text-sm font-bold uppercase tracking-widest mb-3 ${color || (light ? "text-blue-400" : "text-blue-600")}`}>{subtitle}</p>
        <h2 className={`text-4xl md:text-5xl font-extrabold leading-snug ${light ? "text-white" : "text-slate-900"}`}>{title}</h2>
    </div>
);

const FaqItem = ({ q, a, open, toggle }: any) => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
    <button onClick={toggle} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors">
      <span className="font-semibold text-slate-900 text-lg">{q}</span>
      {open ? <ChevronUp className="text-blue-600" /> : <ChevronDown className="text-slate-400" />}
    </button>
    {open && <div className="px-5 pb-5 text-slate-600 leading-relaxed border-t border-slate-100">{a}</div>}
  </div>
);

const FeatureCard: React.FC<{ title: string; desc: string; icon?: React.ReactNode; accent?: string }> = ({ title, desc, icon, accent }) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-md group-hover:scale-110 transition-transform ${accent || "bg-blue-600"}`}>
      {icon || <CheckCircle size={28} />}
    </div>
    <h3 className="text-2xl font-bold mb-3 text-slate-900">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{desc}</p>
  </div>
);

const TestimonialCard: React.FC<{ name: string; role: string; content: string; avatar?: string; stars?: number }> = ({ name, role, content, avatar, stars = 5 }) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className="flex items-center gap-4 mb-6">
      <img src={avatar} alt={name} className="w-14 h-14 rounded-full object-cover border-2 border-blue-100 shadow-sm" />
      <div>
        <p className="font-bold text-slate-900 text-lg">{name}</p>
        <p className="text-sm text-slate-500 font-medium">{role}</p>
      </div>
    </div>
    <div className="flex gap-1 text-amber-400 mb-4">
      {[...Array(stars)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
    </div>
    <p className="text-slate-700 italic leading-relaxed text-lg">“{content}”</p>
  </div>
);

const LandingPage: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (i: number) => setOpenFaq(openFaq === i ? null : i);

  const faqs = [
    { q: "O teste de 7 dias é realmente grátis?", a: "Sim! Acesso completo durante 7 dias, sem cartão de crédito. Se não quiser continuar, cancele antes do fim do teste." },
    { q: "Serve para quais profissionais?", a: "Nutricionistas, Fisioterapeutas, Psicólogos, Terapeutas Ocupacionais e clínicas multidisciplinares." },
    { q: "Posso acessar pelo celular?", a: "Totalmente. A interface é mobile-first e oferece ótima experiência em qualquer dispositivo." },
    { q: "Preciso instalar algo?", a: "Não. A HealthFlow é uma plataforma web (SaaS), funciona diretamente no navegador." }
  ];

  const testimonials = [
    { name: "Dra. Júlia Mendes", role: "Nutricionista | São Paulo", content: "Reduzi o tempo administrativo pela metade e meu faturamento subiu graças aos relatórios claros.", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80" },
    { name: "Dr. Ricardo Silva", role: "Fisioterapeuta | Rio de Janeiro", content: "O financeiro agora é previsível. O controle de sessões e pacotes é super eficiente. Recomendo.", avatar: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=400&q=80" },
    { name: "Clínica Bem Estar", role: "Multidisciplinar | Curitiba", content: "Unificamos agendas de 5 profissionais e as confirmações automáticas zeraram as faltas.", avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&q=80" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden selection:bg-blue-100">
      
      <nav className="fixed top-0 left-0 right-0 bg-slate-900 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-600/20">
              <Activity size={24} />
            </div>
            <span className="text-xl font-bold text-white">HealthFlow</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-300 hover:text-white transition-colors">Funcionalidades</a>
            <a href="#testimonials" className="text-slate-300 hover:text-white transition-colors">Depoimentos</a>
            <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">Preços</a>
            
            <a href="/login" className="text-white font-bold hover:text-slate-200 transition-colors">
              Entrar
            </a>
            
            <a
              href="/cadastro"
              className="bg-white text-slate-900 px-5 py-2.5 rounded-xl font-bold shadow hover:bg-slate-100 transition-colors"
            >
              Testar Grátis
            </a>
          </div>

          <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white p-6 border-t border-slate-100 shadow-xl absolute w-full">
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 text-slate-600 font-medium">Funcionalidades</a>
            <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 text-slate-600 font-medium">Depoimentos</a>
            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 text-slate-600 font-medium">Preços</a>
            <div className="mt-6 flex flex-col gap-3">
              <a href="/login" className="w-full py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 text-center">
                Entrar
              </a>
              <a href="/cadastro" className="w-full py-3 bg-blue-600 rounded-xl text-white font-bold shadow-lg text-center">
                Começar Agora
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <header className="pt-32 md:pt-48 pb-20 md:pb-32 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-8 border border-blue-100">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              Gestão Inteligente v2.0
            </div>

            <h3 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 text-slate-900">
              O Sistema Operacional da sua <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Clinica.</span>
            </h3>

            <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
              Centralize agenda, prontuário e financeiro. Economize <strong>10h por semana</strong> e foque no que importa: seus pacientes.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a href="/cadastro" className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:shadow-2xl transition-all transform hover:-translate-y-1">
                Começar Grátis <ArrowRight size={20} />
              </a>
            </div>

            <div className="mt-12 flex items-center gap-8 border-t border-slate-100 pt-8">
              <div>
                <div className="text-3xl font-bold text-slate-900">5k+</div>
                <div className="text-sm text-slate-500 font-medium">Profissionais</div>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div>
                <div className="text-3xl font-bold text-slate-900">10h</div>
                <div className="text-sm text-slate-500 font-medium">Economia/Semana</div>
              </div>
            </div>
          </div>

          <div className="relative lg:order-2 order-1 transform hover:scale-[1.02] transition-transform duration-700">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-20 animate-pulse"></div>
            
            {/* MOCKUP PRINCIPAL - CAMINHO PÚBLICO */}
            <div className="relative bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200">
              <img src="/assets/dash.png" alt="Dashboard" className="w-full h-auto object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* FEATURE CARDS - VANTAGENS */}
      <Section className="bg-white">
        <div className="max-w-7xl mx-auto">
            <SectionHeader title="Tudo que você precisa." subtitle="Funcionalidades" />
            <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard 
                    title="Agenda Inteligente" 
                    desc="Confirmações automáticas via WhatsApp, lista de espera e gestão visual de horários." 
                    icon={<Calendar size={28} />} 
                    accent="bg-blue-600 shadow-blue-200"
                />
                <FeatureCard 
                    title="Prontuário Seguro" 
                    desc="Histórico completo, upload de exames, anamnese personalizável e conformidade LGPD." 
                    icon={<HeartHandshake size={28} />} 
                    accent="bg-emerald-500 shadow-emerald-200"
                />
                <FeatureCard 
                    title="Controle Financeiro" 
                    desc="Fluxo de caixa, contas a pagar/receber e relatórios de faturamento em tempo real." 
                    icon={<DollarSign size={28} />} 
                    accent="bg-amber-500 shadow-amber-200"
                />
            </div>
        </div>
      </Section>

      {/* DETALHES DAS FEATURES */}
      <Section id="features" className="bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-24">
            
            {/* Feature 1 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold mb-4 uppercase">Agenda</div>
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-slate-900 leading-tight">Adeus, faltas de última hora.</h2>
                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">Automatize o contato com seus pacientes. O HealthFlow envia lembretes e confirmações, mantendo sua agenda sempre otimizada.</p>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-4 text-slate-700 font-medium"><div className="bg-green-100 p-1 rounded-full"><Check className="text-green-600" size={16} /></div> Confirmação via WhatsApp</li>
                        <li className="flex items-center gap-4 text-slate-700 font-medium"><div className="bg-green-100 p-1 rounded-full"><Check className="text-green-600" size={16} /></div> Lista de espera inteligente</li>
                        <li className="flex items-center gap-4 text-slate-700 font-medium"><div className="bg-green-100 p-1 rounded-full"><Check className="text-green-600" size={16} /></div> Visualização diária, semanal e mensal</li>
                    </ul>
                </div>
                
                {/* MOCKUP 2 - CAMINHO PÚBLICO */}
                <div className="order-1 lg:order-2 relative transform hover:scale-[1.01] transition-transform duration-500">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-blue-400 to-emerald-400 rounded-[2.5rem] blur opacity-10"></div>
                    <div className="relative bg-white rounded-[2rem] shadow-2xl border border-slate-200 p-3">
                        <img src="/assets/agenda.png" alt="Agenda" className="rounded-[1.5rem] w-full h-auto object-cover" />
                    </div>
                </div>
            </div>

            {/* Feature 2 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* MOCKUP 3 - CAMINHO PÚBLICO */}
                <div className="relative transform hover:scale-[1.01] transition-transform duration-500">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-amber-400 to-orange-400 rounded-[2.5rem] blur opacity-10"></div>
                    <div className="relative bg-white rounded-[2rem] shadow-2xl border border-slate-200 p-3">
                        <img src="/assets/faturamento.png" alt="Financeiro" className="rounded-[1.5rem] w-full h-auto object-cover" />
                    </div>
                </div>

                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold mb-4 uppercase">Financeiro</div>
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-slate-900 leading-tight">Seu faturamento sob controle.</h2>
                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">Visualize seu faturamento em tempo real. Saiba quais serviços são mais lucrativos e preveja seu fechamento de mês com gráficos simples.</p>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-4 text-slate-700 font-medium"><div className="bg-amber-100 p-1 rounded-full"><Check className="text-amber-600" size={16} /></div> Fluxo de caixa em tempo real</li>
                        <li className="flex items-center gap-4 text-slate-700 font-medium"><div className="bg-amber-100 p-1 rounded-full"><Check className="text-amber-600" size={16} /></div> Gestão de Pacotes e Sessões</li>
                        <li className="flex items-center gap-4 text-slate-700 font-medium"><div className="bg-amber-100 p-1 rounded-full"><Check className="text-amber-600" size={16} /></div> Relatórios de serviços mais vendidos</li>
                    </ul>
                </div>
            </div>

            {/* Feature 3 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-green-200 text-green-600 text-xs font-bold mb-4 uppercase">Prontuário</div>
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-slate-900 leading-tight">Prontuários seguros e acessíveis.</h2>
                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">Acesse o histórico do paciente de qualquer lugar. Criptografia de ponta a ponta garante que apenas você tenha acesso aos dados sensíveis.</p>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-4 text-slate-700 font-medium"><div className="bg-green-100 p-1 rounded-full"><Check className="text-green-600" size={16} /></div> Histórico completo de evolução</li>
                        <li className="flex items-center gap-4 text-slate-700 font-medium"><div className="bg-green-100 p-1 rounded-full"><Check className="text-green-600" size={16} /></div> Anexos de exames e fotos</li>
                        <li className="flex items-center gap-4 text-slate-700 font-medium"><div className="bg-green-100 p-1 rounded-full"><Check className="text-green-600" size={16} /></div> Conformidade com LGPD</li>
                    </ul>
                </div>
                
                {/* MOCKUP 4 - CAMINHO PÚBLICO */}
                <div className="order-1 lg:order-2 relative transform hover:scale-[1.01] transition-transform duration-500">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-green-400 to-emerald-400 rounded-[2.5rem] blur opacity-10"></div>
                    <div className="relative bg-white rounded-[2rem] shadow-2xl border border-slate-200 p-3">
                        <img src="/assets/pront.png" alt="Prontuário" className="rounded-[1.5rem] w-full h-auto object-cover" />
                    </div>
                </div>
            </div>
        </div>
      </Section>

      {/* PRICING */}
      <Section id="pricing" className="bg-slate-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-30"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-30"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <SectionHeader title="Um plano. Acesso ilimitado." subtitle="Preço Simples" color="text-blue-400" light={true} />

          <div className="flex justify-center">
            {/* Pricing Card */}
            <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl transform hover:scale-105 transition-transform duration-300 relative border-4 border-blue-500/30">
              
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg uppercase tracking-wide flex items-center gap-2">
                <Crown size={14} fill="currentColor" /> Oferta Exclusiva
              </div>

              <div className="text-center mt-6">
                  <div className="text-slate-500 font-medium mb-2 uppercase tracking-wide text-xs">Plano Pro</div>
                  <div className="flex items-center justify-center text-slate-900">
                      <span className="text-2xl font-bold mr-1">R$</span>
                      <span className="text-7xl font-extrabold tracking-tighter">97</span>
                      <span className="text-slate-400 font-medium self-end mb-2 ml-1">/mês</span>
                  </div>
                  <p className="text-slate-500 mt-4 text-sm px-4">Tudo o que sua clínica precisa para crescer, sem limites de uso.</p>
              </div>

              <div className="my-8 h-px bg-slate-100 w-full"></div>

              <ul className="space-y-4 mb-10">
                {[
                    "Pacientes Ilimitados", 
                    "Agenda Inteligente com WhatsApp", 
                    "Prontuário Eletrônico Seguro",
                    "Controle Financeiro Completo",
                    "Multi-Usuários e Acessos",
                    "Suporte Prioritário Humanizado"
                ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                        <div className="bg-blue-100 p-1 rounded-full text-blue-600"><Check size={14} strokeWidth={3} /></div>
                        {item}
                    </li>
                ))}
              </ul>

              {/* BOTÃO PRICING -> /cadastro */}
              <a href="/cadastro" className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-2 group">
                <Play size={20} className="fill-white group-hover:scale-110 transition-transform" /> Começar Teste de 7 Dias
              </a>
              <p className="text-center text-xs text-slate-400 mt-4">Sem fidelidade. Cancele quando quiser.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section id="testimonials" className="bg-white">
        <div className="max-w-7xl mx-auto">
          <SectionHeader title="Quem usa, recomenda." subtitle="Depoimentos" />
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => <TestimonialCard key={i} {...t} />)}
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">Perguntas frequentes</h2>
          <div className="space-y-4">
            {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} open={openFaq === i} toggle={() => toggleFaq(i)} />)}
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-3">
                     <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-600/20"><Activity size={24} /></div>
                    <div>
                        <div className="font-bold text-white text-xl">HealthFlow</div>
                        <div className="text-xs text-slate-500">Tecnologia para saúde.</div>
                    </div>
                </div>
                <div className="flex gap-8 text-sm font-medium">
                    <a href="#" className="hover:text-white transition">Sobre</a>
                    <a href="#" className="hover:text-white transition">Termos</a>
                    <a href="#" className="hover:text-white transition">Privacidade</a>
                    <a href="#" className="hover:text-white transition">Contato</a>
                </div>
            </div>
            <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
                © {new Date().getFullYear()} HealthFlow. Feito para clínicas que querem crescer.
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;