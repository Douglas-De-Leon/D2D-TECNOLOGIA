import React, { useEffect, useState } from 'react';
import { Save, Building, Users, Edit2, Trash2, Plus, Shield, Check, AlertCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { getSettings, saveSettings, getAll, addItem, updateItem, deleteItem } from '../services/db';
import { CompanySettings, SystemUser } from '../types';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'company' | 'users'>('company');
  const [loading, setLoading] = useState(true);

  // --- State da Empresa ---
  const [companyData, setCompanyData] = useState<CompanySettings>({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    theme: 'Padrão'
  });

  // --- State de Usuários ---
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [userForm, setUserForm] = useState({
      name: '',
      email: '',
      password: '',
      level: 'technician' as 'admin' | 'technician' | 'client' | 'user'
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    // Carrega Configurações
    const settings = await getSettings();
    if (settings) {
        setCompanyData(settings);
    }

    // Carrega Usuários
    await loadUsers();
    setLoading(false);
  };

  const loadUsers = async () => {
      const usersData = await getAll<SystemUser>('users');
      setUsers(usersData.sort((a, b) => (a.id || 0) - (b.id || 0)));
  };

  // --- Handlers Empresa ---
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanySave = async () => {
    await saveSettings(companyData);
    alert('Configurações da empresa salvas com sucesso!');
  };

  // --- Handlers Usuários ---
  const openUserModal = (user?: SystemUser) => {
      if (user) {
          setEditingUser(user);
          setUserForm({
              name: user.name,
              email: user.email,
              password: '', // Não mostra a senha atual por segurança/hash
              level: user.level
          });
      } else {
          setEditingUser(null);
          setUserForm({
              name: '',
              email: '',
              password: '',
              level: 'technician'
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
              level: userForm.level
          };

          // Só envia senha se foi digitada (no caso de edição) ou se é novo
          if (userForm.password) {
              payload.password = userForm.password;
          } else if (!editingUser) {
              alert("A senha é obrigatória para novos usuários.");
              return;
          }

          if (editingUser && editingUser.id) {
              payload.id = editingUser.id;
              await updateItem('users', payload);
          } else {
              // Avatar padrão vazio
              payload.avatar_url = '';
              await addItem('users', payload);
          }

          setIsUserModalOpen(false);
          loadUsers();
      } catch (error: any) {
          console.error(error);
          // Melhor tratamento de erro para exibir mensagem legível
          const errorMessage = error.message || JSON.stringify(error);
          alert(`Erro ao salvar usuário: ${errorMessage}\n\nSe o erro mencionar 'avatar_url', recarregue a página para aplicar a atualização do banco de dados.`);
      }
  };

  const handleUserDelete = async (id: number) => {
      if (window.confirm("Tem certeza que deseja excluir este usuário? Ele perderá o acesso ao sistema.")) {
          await deleteItem('users', id);
          loadUsers();
      }
  };

  if (loading) return <div className="p-6">Carregando configurações...</div>;

  return (
    <div>
      <PageHeader title="Configurações do Sistema" showButton={false} />

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-lg px-4 shadow-sm">
        <button
            onClick={() => setActiveTab('company')}
            className={`flex items-center py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'company' 
                ? 'border-brand-blue text-brand-blue' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
            <Building className="h-4 w-4 mr-2" />
            Dados da Empresa
        </button>
        <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users' 
                ? 'border-brand-blue text-brand-blue' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
            <Users className="h-4 w-4 mr-2" />
            Usuários e Permissões
        </button>
      </div>

      {/* Tab Content: Empresa */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-b-lg rounded-tr-lg shadow-sm p-6 animate-fade-in">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Informações Gerais</h3>
            
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                <input 
                    type="text" 
                    name="name"
                    value={companyData.name}
                    onChange={handleCompanyChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
            </div>
            
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                <input 
                    type="text" 
                    name="cnpj"
                    value={companyData.cnpj}
                    onChange={handleCompanyChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                    type="email" 
                    name="email"
                    value={companyData.email}
                    onChange={handleCompanyChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input 
                    type="text" 
                    name="phone"
                    value={companyData.phone}
                    onChange={handleCompanyChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
            </div>

            <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input 
                    type="text" 
                    name="address"
                    value={companyData.address}
                    onChange={handleCompanyChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
            </div>

            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
                <select 
                    name="theme"
                    value={companyData.theme}
                    onChange={handleCompanyChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue"
                >
                    <option>Padrão</option>
                    <option>Escuro</option>
                    <option>Claro</option>
                </select>
            </div>

            <div className="col-span-1 md:col-span-2 pt-4">
                <button 
                    type="button" 
                    onClick={handleCompanySave}
                    className="flex items-center bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors font-medium"
                >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                </button>
            </div>
            </form>
        </div>
      )}

      {/* Tab Content: Usuários */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-b-lg rounded-tr-lg shadow-sm animate-fade-in overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Gerenciar Acessos</h3>
                    <p className="text-sm text-gray-500">Crie contas para funcionários e clientes e defina suas permissões.</p>
                </div>
                <button 
                    onClick={() => openUserModal()}
                    className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Usuário
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 font-medium">Nome</th>
                            <th className="px-6 py-3 font-medium">Email / Login</th>
                            <th className="px-6 py-3 font-medium">Nível de Permissão</th>
                            <th className="px-6 py-3 font-medium text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${user.level === 'admin' ? 'bg-red-100 text-red-800' : ''}
                                        ${user.level === 'technician' ? 'bg-blue-100 text-blue-800' : ''}
                                        ${user.level === 'client' ? 'bg-gray-100 text-gray-800' : ''}
                                        ${user.level === 'user' ? 'bg-yellow-100 text-yellow-800' : ''}
                                    `}>
                                        {user.level === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                                        {user.level === 'technician' ? 'Funcionário' : user.level === 'client' ? 'Cliente' : user.level === 'admin' ? 'Administrador' : 'Usuário'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex justify-center space-x-2">
                                    <button 
                                        onClick={() => openUserModal(user)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                        title="Editar Permissões"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button 
                                        onClick={() => user.id && handleUserDelete(user.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                        title="Remover Acesso"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {users.length === 0 && (
                <div className="p-8 text-center text-gray-500">Nenhum usuário encontrado.</div>
            )}
        </div>
      )}

      {/* Modal de Usuário */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? "Editar Usuário e Permissões" : "Novo Usuário"}
      >
        <form onSubmit={handleUserSave} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <input 
                    type="text" 
                    required 
                    value={userForm.name}
                    onChange={e => setUserForm({...userForm, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-brand-blue focus:border-brand-blue"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Email (Login)</label>
                <input 
                    type="email" 
                    required 
                    value={userForm.email}
                    onChange={e => setUserForm({...userForm, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-brand-blue focus:border-brand-blue"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <input 
                    type="password" 
                    value={userForm.password}
                    onChange={e => setUserForm({...userForm, password: e.target.value})}
                    placeholder={editingUser ? "Deixe em branco para manter a atual" : "Crie uma senha"}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-brand-blue focus:border-brand-blue"
                />
            </div>
            
            <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nível de Acesso (Permissões)</label>
                <div className="space-y-3">
                    <label className={`flex items-start p-3 border rounded-md cursor-pointer transition-colors ${userForm.level === 'admin' ? 'border-brand-blue bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input 
                            type="radio" 
                            name="level" 
                            value="admin"
                            checked={userForm.level === 'admin'}
                            onChange={() => setUserForm({...userForm, level: 'admin'})}
                            className="mt-1 h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300"
                        />
                        <div className="ml-3">
                            <span className="block text-sm font-medium text-gray-900">Administrador</span>
                            <span className="block text-xs text-gray-500">Acesso total a todas as configurações, financeiro e usuários.</span>
                        </div>
                    </label>

                    <label className={`flex items-start p-3 border rounded-md cursor-pointer transition-colors ${userForm.level === 'technician' ? 'border-brand-blue bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input 
                            type="radio" 
                            name="level" 
                            value="technician"
                            checked={userForm.level === 'technician'}
                            onChange={() => setUserForm({...userForm, level: 'technician'})}
                            className="mt-1 h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300"
                        />
                        <div className="ml-3">
                            <span className="block text-sm font-medium text-gray-900">Funcionário / Técnico</span>
                            <span className="block text-xs text-gray-500">Acesso a Clientes, Produtos e Serviços. Visualiza apenas OS e Vendas onde é o Responsável. Sem acesso a Configurações e Financeiro.</span>
                        </div>
                    </label>

                    <label className={`flex items-start p-3 border rounded-md cursor-pointer transition-colors ${userForm.level === 'client' ? 'border-brand-blue bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input 
                            type="radio" 
                            name="level" 
                            value="client"
                            checked={userForm.level === 'client'}
                            onChange={() => setUserForm({...userForm, level: 'client'})}
                            className="mt-1 h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300"
                        />
                        <div className="ml-3">
                            <span className="block text-sm font-medium text-gray-900">Cliente</span>
                            <span className="block text-xs text-gray-500">Acesso restrito. Visualiza apenas seus próprios arquivos, compras e ordens de serviço.</span>
                        </div>
                    </label>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t mt-4">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="mr-2 px-4 py-2 text-sm text-gray-700 bg-white border rounded-md hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-brand-blue rounded-md hover:bg-blue-600">Salvar Usuário</button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;