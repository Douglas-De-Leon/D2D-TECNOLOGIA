import React, { useState, useEffect } from 'react';
import { User, Lock, Save, Camera } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { updateItem } from '../services/db';
import { SystemUser } from '../types';

const Profile: React.FC = () => {
  const [user, setUser] = useState<SystemUser | null>(null);
  const [formData, setFormData] = useState({
      password: '',
      confirmPassword: '',
      avatar: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
      const stored = localStorage.getItem('mapos_user');
      if (stored) {
          setUser(JSON.parse(stored));
      }
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              setFormData({...formData, avatar: base64String});
              // Atualiza visualmente imediatamente
              if (user) {
                  setUser({...user, avatar_url: base64String});
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setMessage(null);

      if (!user) return;

      if (formData.password && formData.password !== formData.confirmPassword) {
          setMessage({type: 'error', text: 'As senhas não coincidem.'});
          setLoading(false);
          return;
      }

      try {
          const updates: any = { id: user.id };
          
          if (formData.password) {
              updates.password = formData.password;
          }
          if (formData.avatar) {
              updates.avatar_url = formData.avatar;
          }

          if (Object.keys(updates).length > 1) { // id sempre existe
              await updateItem('users', updates);
              
              // Atualiza Local Storage
              const updatedUser = { ...user, ...updates };
              localStorage.setItem('mapos_user', JSON.stringify(updatedUser));
              setUser(updatedUser);
              
              setMessage({type: 'success', text: 'Perfil atualizado com sucesso!'});
              // Limpa campos de senha
              setFormData({...formData, password: '', confirmPassword: ''});
              
              // Dispara evento para atualizar header (simples hack para sync)
              window.location.reload(); 
          } else {
              setMessage({type: 'success', text: 'Nenhuma alteração detectada.'});
          }
      } catch (err) {
          console.error(err);
          setMessage({type: 'error', text: 'Erro ao salvar perfil.'});
      } finally {
          setLoading(false);
      }
  };

  if (!user) return <div>Carregando...</div>;

  return (
    <div>
      <PageHeader title="Meu Perfil" showButton={false} />

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-brand-blue h-32 w-full relative">
                <div className="absolute -bottom-16 left-8">
                     <div className="relative group">
                        <div className="h-32 w-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                    <User className="h-16 w-16 text-gray-400" />
                                </div>
                            )}
                        </div>
                        <label className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-100 transition-colors">
                            <Camera className="h-5 w-5 text-gray-700" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                        </label>
                     </div>
                </div>
            </div>

            <div className="pt-20 px-8 pb-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-500">{user.email}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase">
                            {user.level === 'technician' ? 'Funcionário' : user.level === 'client' ? 'Cliente' : user.level}
                        </span>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6 max-w-lg">
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <Lock className="h-5 w-5 mr-2" />
                            Alterar Senha
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                                <input 
                                    type="password" 
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-brand-blue focus:border-brand-blue"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    placeholder="Deixe em branco para manter a atual"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                                <input 
                                    type="password" 
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-brand-blue focus:border-brand-blue"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex items-center px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;