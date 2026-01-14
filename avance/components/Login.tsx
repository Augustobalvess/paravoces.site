import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight } from 'lucide-react'; // Ícones opcionais, se não tiver, pode remover os ícones do JSX

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert('Erro ao entrar: ' + error.message);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50">
        
        {/* Cabeçalho */}
       <div className="max-w-4xl w-full text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-600/30">
             {/* Nota: Ajustei a cor bg-brand-500 para bg-blue-600 para garantir que apareça se você não tiver a cor customizada configurada */}
             <Activity className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">HealthFlow</h2>
          <p className="text-gray-500 mt-2 text-sm">Gerencie sua clínica com inteligência.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Input Email */}
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">E-mail</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          {/* Input Senha */}
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Senha</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </span>
            ) : (
              'Acessar Painel'
            )}
          </button>
        </form>

        {/* Rodapé do Card */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline transition-colors">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}