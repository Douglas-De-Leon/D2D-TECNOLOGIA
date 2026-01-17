
import React, { useState, useEffect } from 'react';
import { Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';
import { login } from '../services/auth';
import { SystemUser, CompanySettings } from '../types';
import { getSettings } from '../services/db';

interface LoginProps {
  onLoginSuccess: (user: SystemUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('dougdeleon@gmail.com');
  const [password, setPassword] = useState('29092019Ic#');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.success && result.user) {
        onLoginSuccess(result.user);
    } else {
        setError(result.error || 'Falha na autenticação');
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
            <div className="flex flex-col items-center mb-2">
                <div className="w-12 h-12 bg-brand-blue rounded-lg flex items-center justify-center transform rotate-45 shadow-lg mb-4">
                    <div className="w-6 h-6 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex flex-col leading-tight items-center">
                    <span className="text-3xl font-black text-gray-800 tracking-tighter">DDOS</span>
                    <span className="text-xs font-bold text-brand-blue tracking-[0.4em] -mt-1 ml-1">TECNOLOGIA</span>
                </div>
            </div>
            <p className="text-gray-500 text-sm mt-2">Faça login para continuar</p>
        </div>

        {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm h-10 border" 
                        placeholder="dougdeleon@gmail.com"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm h-10 border" 
                        placeholder="••••••"
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-70 transition-colors"
            >
                {loading ? 'Entrando...' : (
                    <>
                        Entrar <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                )}
            </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
                Sistema de Gestão de Ordens de Serviço
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
