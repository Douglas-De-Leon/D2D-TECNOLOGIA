import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Search, MapPin, User, Building, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { getAll, addItem, deleteItem, updateItem } from '../services/db';
import { supabase } from '../services/supabase';
import { Client } from '../types';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  
  // Estados para Adicionar/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Client>({
    name: '',
    type: 'Cliente',
    cpf: '',
    phone: '',
    email: '',
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Estados para Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const loadData = async () => {
    const data = await getAll<Client>('clients');
    setClients(data.sort((a, b) => (b.id || 0) - (a.id || 0)));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (client?: Client) => {
    if (client) {
      setFormData(client);
      setIsEditing(true);
    } else {
      setFormData({
        name: '',
        type: 'Cliente',
        cpf: '',
        phone: '',
        email: '',
        cep: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: ''
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && formData.id) {
        await updateItem('clients', formData);
      } else {
        await addItem('clients', formData);
        
        // --- AUTO-CRIAÇÃO DE USUÁRIO ---
        if (formData.email && formData.cpf && formData.type === 'Cliente') {
            // Verifica se usuário já existe
            const { data: existingUser } = await supabase.from('users').select('id').eq('email', formData.email).maybeSingle();
            
            if (!existingUser) {
                // Cria usuário com acesso nível 'client'
                await supabase.from('users').insert({
                    name: formData.name,
                    email: formData.email,
                    password: formData.cpf, // Senha padrão = CPF
                    level: 'client',
                    avatar_url: ''
                });
                console.log("Usuário de acesso criado automaticamente para o cliente.");
            }
        }
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar cadastro.");
    }
  };

  // Abre o modal de confirmação
  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  // Executa a exclusão de fato
  const confirmDelete = async () => {
    if (clientToDelete && clientToDelete.id) {
        const success = await deleteItem('clients', clientToDelete.id);
        if (success) {
            loadData();
            setIsDeleteModalOpen(false);
            setClientToDelete(null);
        } else {
            alert("Erro ao excluir. Verifique se o usuário tem permissão ou consulte o console.");
        }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <PageHeader title="Clientes / Fornecedores" buttonLabel="Adicionar" onButtonClick={() => openModal()} />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-end">
          <div className="relative">
             <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="pl-8 pr-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-brand-blue focus:border-brand-blue outline-none w-64"
             />
             <Search className="h-4 w-4 text-gray-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">CPF/CNPJ</th>
                <th className="px-6 py-3 font-medium">Contato</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                 <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Nenhum cadastro encontrado.</td></tr>
              ) : (
                clients.map((client) => (
                    <tr key={client.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{client.id}</td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-800">{client.name}</span>
                            <span className="text-xs text-gray-500">{client.email}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{client.cpf}</td>
                    <td className="px-6 py-4 text-gray-600">{client.phone}</td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            client.type === 'Fornecedor' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                            {client.type === 'Fornecedor' ? <Building className="w-3 h-3 mr-1"/> : <User className="w-3 h-3 mr-1"/>}
                            {client.type || 'Cliente'}
                        </span>
                    </td>
                    <td className="px-6 py-4 flex justify-center space-x-2">
                        <button 
                            className="p-1.5 bg-brand-blue text-white rounded hover:bg-blue-600 transition-colors" 
                            title="Editar"
                            onClick={() => openModal(client)}
                        >
                        <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                            className="p-1.5 bg-brand-red text-white rounded hover:bg-red-600 transition-colors" 
                            title="Excluir"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(client);
                            }}
                        >
                        <Trash2 className="h-4 w-4" />
                        </button>
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro / Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Cadastro" : "Novo Cadastro"}
      >
        <form id="client-form" onSubmit={handleSave} className="space-y-4">
          
          <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select 
                    name="type" 
                    value={formData.type || 'Cliente'} 
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                >
                    <option value="Cliente">Cliente</option>
                    <option value="Fornecedor">Fornecedor</option>
                </select>
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                />
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">CPF / CNPJ</label>
                <input
                type="text"
                name="cpf"
                required
                placeholder="Para login (será a senha inicial)"
                value={formData.cpf}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="Para login (deve ser único)"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
            />
          </div>

          <div className="pt-2 pb-1 border-b border-gray-100 mb-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center">
                <MapPin className="h-3 w-3 mr-1"/> Endereço
            </h4>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">CEP</label>
                <input
                  type="text"
                  name="cep"
                  value={formData.cep || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                />
             </div>
             <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Rua</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                />
             </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Número</label>
                <input
                  type="text"
                  name="number"
                  value={formData.number || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                />
             </div>
             <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Bairro</label>
                <input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                />
             </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Cidade</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                />
             </div>
             <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <input
                  type="text"
                  name="state"
                  maxLength={2}
                  placeholder="UF"
                  value={formData.state || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                />
             </div>
          </div>

          <div className="flex justify-end pt-4 border-t mt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-md hover:bg-blue-600 shadow-sm"
            >
              Salvar
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
      >
        <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
                <h4 className="text-lg font-medium text-gray-900">Excluir Cadastro?</h4>
                <p className="text-sm text-gray-500 mt-2">
                    Você tem certeza que deseja excluir <strong>{clientToDelete?.name}</strong>? 
                    <br/>Esta ação não poderá ser desfeita.
                </p>
            </div>
            <div className="flex w-full space-x-3 mt-4">
                <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Cancelar
                </button>
                <button
                    onClick={confirmDelete}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Excluir
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default Clients;