
import React, { useEffect, useState } from 'react';
import { Save, Building, Users, Edit2, Trash2, Plus, Shield, Check, X, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { getSettings, saveSettings, getAll, addItem, updateItem, deleteItem } from '../services/db';
import { CompanySettings, SystemUser, UserPermission } from '../types';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'company' | 'users'>('company');
  const [loading, setLoading] = useState(true);

  const modules = [
    { id: 'dashboard', label: 'Início / Dashboard' },
    { id: 'usuarios', label: 'Gerenciar Clientes' },
    { id: 'sales', label: 'Vendas' },
    { id: 'orders', label: 'Ordens de Serviço' },
    { id: 'warranties', label: 'Termos de Garantia' },
    { id: 'files', label: 'Arquivos' },
    { id: 'finance', label: 'Financeiro / Lançamentos' },
    { id: 'reports', label: 'Relatórios' },
    { id: 'settings', label: 'Configurações do Sistema' }
  ];

  const defaultPermissions: UserPermission[] = modules.map(m => ({
    module: m.id,
    view: true,
    add: false,
    edit: false,
    delete: false
  }));

  const [companyData, setCompanyData] = useState<CompanySettings>({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    theme: 'Padrão',
    logo_url: ''
  });

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [userForm, setUserForm] = useState({
      name: '',
      email: '',
      password: '',
      level: 'manager' as 'admin' | 'technician' | 'client' | 'manager',
      permissions: defaultPermissions
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    const settings = await getSettings();
    if (settings) setCompanyData(settings);
    await loadUsers();
    setLoading(false);
  };

  const loadUsers = async () => {
      const usersData = await getAll<SystemUser>('users');
      setUsers(usersData.sort((a, b) => (a.id || 0) - (b.id || 0)));
  };

  // --- Lógica da Empresa ---

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setCompanyData({ ...companyData, [e.target.name]: e.target.value });
  };

  const handleCompanySave = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await saveSettings(companyData);
          alert('Configurações da empresa salvas com sucesso!');
          window.location.reload(); 
      } catch (error) {
          console.error(error);
          alert('Erro ao salvar configurações.');
      }
  };

  // --- Lógica de Usuários ---

  const togglePermission = (moduleId: string, field: keyof Omit<UserPermission, 'module'>) => {
    setUserForm(prev => ({
        ...prev,
        permissions: prev.permissions.map(p => 
            p.module === moduleId ? { ...p, [field]: !p[field] } : p
        )
    }));
  };

  const openUserModal = (user?: SystemUser) => {
      if (user) {
          setEditingUser(user);
          setUserForm({
              name: user.name,
              email: user.email,
              password: '', 
              level: user.level as any,
              permissions: user.permissions && user.permissions.length > 0 ? user.permissions : defaultPermissions
          });
      } else {
          setEditingUser(null);
          setUserForm({
              name: '',
              email: '',
              password: '',
              level: 'manager',
              permissions: defaultPermissions
          });
      }
      setIsUserModalOpen(true);
  };

  const handleUserSave = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const payload: any = {
              name: userForm.name,
              email: userForm.email,
              level: userForm.level,
              permissions: userForm.permissions
          };

          if (userForm.password) payload.password = userForm.password;

          if (editingUser && editingUser.id) {
              payload.id = editingUser.id;
              await updateItem('users', payload);
          } else {
              await addItem('users', payload);
          }

          setIsUserModalOpen(false);
          loadUsers();
      } catch (error: any) {
          alert(`Erro ao salvar acesso.`);
      }
  };

  const getLevelBadge = (level: string) => {
      switch (level) {
          case 'admin': return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-tight">Administrador</span>;
          case 'technician': return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-tight">Técnico</span>;
          case 'client': return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-tight">Cliente</span>;
          case 'manager': return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-tight">Gerente</span>;
          default: return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-tight">Acesso</span>;
      }
  };

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div>
      <PageHeader title="Configurações do Sistema" showButton={false} />

      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-lg px-4 shadow-sm">
        <button onClick={() => setActiveTab('company')} className={`flex items-center py-4 px-6 border-b-2 font-medium text-sm transition-colors ${activeTab === 'company' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Building className="h-4 w-4 mr-2" />Dados da Empresa</button>
        <button onClick={() => setActiveTab('users')} className={`flex items-center py-4 px-6 border-b-2 font-medium text-sm transition-colors ${activeTab === 'users' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Users className="h-4 w-4 mr-2" />Usuários e Permissões</button>
      </div>

      {activeTab === 'company' && (
        <form onSubmit={handleCompanySave} className="bg-white rounded-b-lg rounded-tr-lg shadow-sm animate-fade-in p-8">
            <div className="space-y-5 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="relative">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nome da Empresa</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Building className="h-4 w-4 text-gray-400" />
                            </div>
                            <input type="text" name="name" required value={companyData.name} onChange={handleCompanyChange} className="pl-10 block w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-blue outline-none transition-shadow" />
                        </div>
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">CNPJ</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <CreditCard className="h-4 w-4 text-gray-400" />
                            </div>
                            <input type="text" name="cnpj" value={companyData.cnpj} onChange={handleCompanyChange} className="pl-10 block w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-blue outline-none transition-shadow" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="relative">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email Principal</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-gray-400" />
                            </div>
                            <input type="email" name="email" value={companyData.email} onChange={handleCompanyChange} className="pl-10 block w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-blue outline-none transition-shadow" />
                        </div>
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Telefone / WhatsApp</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="h-4 w-4 text-gray-400" />
                            </div>
                            <input type="text" name="phone" value={companyData.phone} onChange={handleCompanyChange} className="pl-10 block w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-blue outline-none transition-shadow" />
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Endereço Completo</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-4 w-4 text-gray-400" />
                        </div>
                        <input type="text" name="address" value={companyData.address} onChange={handleCompanyChange} className="pl-10 block w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-blue outline-none transition-shadow" />
                    </div>
                </div>

                <div className="relative">
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tema do Sistema</label>
                        <select name="theme" value={companyData.theme} onChange={handleCompanyChange} className="block w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-blue outline-none transition-shadow bg-white">
                            <option value="Padrão">Padrão (Azul)</option>
                            <option value="Escuro">Modo Escuro (Em breve)</option>
                        </select>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="flex items-center bg-brand-blue text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-colors shadow-md font-bold text-sm">
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Configurações
                    </button>
                </div>
            </div>
        </form>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-b-lg rounded-tr-lg shadow-sm animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div><h3 className="text-lg font-medium text-gray-900">Gerenciar Acessos</h3><p className="text-sm text-gray-500">Configure permissões detalhadas por usuário.</p></div>
                <button onClick={() => openUserModal()} className="flex items-center bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"><Plus className="h-4 w-4 mr-2" />Novo Acesso</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr><th className="px-6 py-3">Nome</th><th className="px-6 py-3 text-center">Nível</th><th className="px-6 py-3 text-center">Ações</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4"><div className="flex flex-col"><span className="font-medium">{u.name}</span><span className="text-xs text-gray-400">{u.email}</span></div></td>
                                <td className="px-6 py-4 text-center">{getLevelBadge(u.level)}</td>
                                <td className="px-6 py-4 flex justify-center space-x-2">
                                    <button onClick={() => openUserModal(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="h-4 w-4" /></button>
                                    <button onClick={() => u.id && deleteItem('users', u.id).then(loadUsers)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={editingUser ? "Editar Acesso" : "Novo Acesso"}>
        <form onSubmit={handleUserSave} className="space-y-4 max-w-3xl">
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold uppercase text-gray-500">Nome</label><input type="text" required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-brand-blue outline-none" /></div>
                <div><label className="text-xs font-bold uppercase text-gray-500">Email</label><input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-brand-blue outline-none" /></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold uppercase text-gray-500">Nível</label><select value={userForm.level} onChange={e => setUserForm({...userForm, level: e.target.value as any})} className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-brand-blue outline-none bg-white"><option value="admin">Administrador</option><option value="manager">Gerente</option><option value="technician">Técnico</option><option value="client">Cliente</option></select></div>
                <div><label className="text-xs font-bold uppercase text-gray-500">Senha</label><input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} placeholder={editingUser ? "Manter atual" : "Crie uma senha"} className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-brand-blue outline-none" /></div>
            </div>

            <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-600 uppercase">Matriz de Permissões Granular</span>
                    <Shield className="h-4 w-4 text-brand-blue" />
                </div>
                <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-[11px] text-left">
                        <thead className="bg-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-2">Módulo</th>
                                <th className="px-2 py-2 text-center w-12">Ver</th>
                                <th className="px-2 py-2 text-center w-12">Add</th>
                                <th className="px-2 py-2 text-center w-12">Edit</th>
                                <th className="px-2 py-2 text-center w-12">Exc</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {userForm.permissions.map((perm) => (
                                <tr key={perm.module} className="hover:bg-blue-50">
                                    <td className="px-4 py-2 font-medium text-gray-700">{modules.find(m => m.id === perm.module)?.label}</td>
                                    <td className="px-2 py-2 text-center">
                                        <button type="button" onClick={() => togglePermission(perm.module, 'view')} className={`p-1.5 rounded-md border transition-all ${perm.view ? 'bg-blue-500 border-blue-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-300'}`}>
                                            {perm.view ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                        </button>
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        <button type="button" onClick={() => togglePermission(perm.module, 'add')} className={`p-1.5 rounded-md border transition-all ${perm.add ? 'bg-green-500 border-green-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-300'}`}>
                                            {perm.add ? <Plus className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                        </button>
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        <button type="button" onClick={() => togglePermission(perm.module, 'edit')} className={`p-1.5 rounded-md border transition-all ${perm.edit ? 'bg-yellow-500 border-yellow-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-300'}`}>
                                            {perm.edit ? <Edit2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                        </button>
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        <button type="button" onClick={() => togglePermission(perm.module, 'delete')} className={`p-1.5 rounded-md border transition-all ${perm.delete ? 'bg-red-500 border-red-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-300'}`}>
                                            {perm.delete ? <Trash2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t mt-4 space-x-2">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-sm text-gray-500 bg-white border rounded-md hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-6 py-2 text-sm text-white bg-brand-blue rounded-md hover:bg-blue-600 font-bold shadow-md">Salvar Usuário</button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;
