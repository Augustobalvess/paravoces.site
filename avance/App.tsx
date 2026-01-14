import { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import { Lock } from "lucide-react";

// COMPONENTES
import LandingPage from "./components/page";
import Login from "./components/Login";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import Agenda from "./components/Agenda";
import Finance from "./components/Finance";
import Patients from "./components/Patients";
import Services from "./components/Services";
import Collaborators from "./components/Collaborators";
import Settings from "./components/Settings";
import Documentation from "./components/Documentation";

// 🛡️ PROTEÇÃO VISUAL
import DisableDevTools from "./components/DisableDevTools"; 

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  
  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      // 1. Pega a sessão atual
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        setSession(currentSession);
        lastTokenRef.current = currentSession.access_token;

        // --- CORREÇÃO AQUI ---
        // Vamos checar o banco de dados manualmente para garantir o Trial
        
        // 1. Verifica se tem assinatura paga (RPC)
        const { data: isPaid } = await supabase.rpc('is_subscription_valid');

        // 2. Verifica se o Trial ainda vale (Profile)
        const { data: profile } = await supabase
          .from('profiles')
          .select('trial_ends_at')
          .eq('id', currentSession.user.id)
          .single();

        const now = new Date();
        const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
        
        // Lógica: É válido se (Pagou OU (Tem data de trial E data é futura))
        const isTrialValid = trialEnd && trialEnd > now;
        const hasAccess = isPaid || isTrialValid;
        
        // Se NÃO tiver acesso, bloqueia
        if (!hasAccess) {
           setIsLocked(true);
           console.log("Bloqueio ativo: Nem assinatura, nem trial válidos.");
        } else {
           setIsLocked(false); // Garante que desbloqueia se renovou ou corrigiu
        }
      }
      
      setLoading(false);
    };

    initApp();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (!newSession && !lastTokenRef.current) return;

        if (newSession?.access_token === lastTokenRef.current) {
            return;
        }

        lastTokenRef.current = newSession?.access_token || null;
        setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        Carregando HealthFlow...
      </div>
    );
  }

  // TELA DE BLOQUEIO (TRIAL EXPIRADO)
  if (session && isLocked) {
    return (
      <div className="fixed inset-0 z-[999] bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
            <Lock size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Período de Teste Finalizado</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">Para continuar utilizando o HealthFlow, ative a assinatura PRO.</p>
          <div className="bg-slate-50 p-4 rounded-xl mb-8 border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600 font-medium">Plano Pro</span>
              <span className="text-slate-900 font-bold">R$ 97,00/mês</span>
            </div>
            <div className="text-xs text-slate-400 text-left">Cobrança recorrente. Cancele quando quiser.</div>
          </div>
          <button onClick={() => alert("Aqui abriria o Checkout")} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-transform active:scale-95 shadow-lg shadow-slate-900/20">Assinar Agora</button>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="mt-6 text-slate-400 text-sm hover:text-slate-600 underline">Sair da conta</button>
        </div>
      </div>
    );
  }

  // PROTEÇÃO DAS ROTAS
  const ProtectedRoute = ({ element }: { element: JSX.Element }) => {
    if (!session) return <Navigate to="/" />;
    if (isLocked) return <Navigate to="/" />; // Se estiver bloqueado, volta para home (que mostrará o lock screen por causa da lógica acima) ou mantém no lock
    // Nota: Como o Lock Screen é renderizado ANTES das rotas ali em cima (if session && isLocked),
    // o usuário nem chega a entrar no ProtectedRoute se estiver travado.
    return element;
  };

  return (
    <BrowserRouter>
      <DisableDevTools />
      <Routes>
        <Route path="/" element={!session ? <LandingPage /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/cadastro" element={!session ? <Onboarding /> : <Navigate to="/dashboard" />} />

        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/agenda" element={<ProtectedRoute element={<Agenda />} />} />
        <Route path="/finance" element={<ProtectedRoute element={<Finance />} />} />
        <Route path="/pacientes" element={<ProtectedRoute element={<Patients />} />} />
        <Route path="/servicos" element={<ProtectedRoute element={<Services />} />} />
        <Route path="/colaboradores" element={<ProtectedRoute element={<Collaborators />} />} />
        <Route path="/configuracoes" element={<ProtectedRoute element={<Settings />} />} />
        
        <Route path="/docs" element={<Documentation />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}