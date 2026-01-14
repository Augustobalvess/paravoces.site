import { createClient } from '@supabase/supabase-js';

// No Vite, usamos import.meta.env para ler as variáveis
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação de segurança: Se não tiver chave, avisa no console em vez de travar tudo com tela branca
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas.');
  console.error('Verifique se o arquivo .env.local existe e se as variáveis começam com VITE_');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);