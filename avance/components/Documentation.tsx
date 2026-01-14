import React from 'react';
import { Database, BookOpen } from 'lucide-react';
import { DB_SCHEMA_DOCS, USER_STORIES_DOCS } from '../constants';

const Documentation: React.FC = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <BookOpen size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900">User Stories (Jornadas)</h2>
                <p className="text-slate-500">O foco na experiência do usuário para MVP.</p>
            </div>
        </div>
        <div className="prose prose-slate max-w-none">
            <pre className="bg-slate-50 p-6 rounded-xl text-sm text-slate-700 font-mono overflow-auto whitespace-pre-wrap">
                {USER_STORIES_DOCS}
            </pre>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Database size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Schema de Banco de Dados</h2>
                <p className="text-slate-500">Estrutura SQL sugerida para Supabase/PostgreSQL.</p>
            </div>
        </div>
        <div className="prose prose-slate max-w-none">
            <pre className="bg-slate-900 p-6 rounded-xl text-sm text-blue-300 font-mono overflow-auto h-[500px]">
                {DB_SCHEMA_DOCS}
            </pre>
        </div>
      </div>
    </div>
  );
};

export default Documentation;