import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getAll, addItem, deleteItem, updateItem } from '../services/db';
import { Client } from '../types';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);

  const loadData = async () => {
    const data = await getAll<Client>('clients');
    setClients(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async () => {
    // Simulating adding a new client
    const newClient: Client = {
        name: `Novo Cliente ${Math.floor(Math.random() * 1000)}`,
        cpf: '000.000.000-00',
        phone: '(00) 0000-0000',
        email: 'novo@email.com'
    };
    await addItem('clients', newClient);
    loadData();
  };

  const handleEdit = async (client: Client) => {
    const newName = prompt('Editar Nome do Cliente:', client.name);
    if (newName && newName !== client.name) {
        const updatedClient = { ...client, name: newName };
        await updateItem('clients', updatedClient);
        loadData();
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
        await deleteItem('clients', id);
        loadData();
    }
  };

  return (
    <div>
      <PageHeader title="Clientes" buttonLabel="Adicionar Cliente" onButtonClick={handleAdd} />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Search Bar */}
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
                <th className="px-6 py-3 font-medium">Telefone</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                 <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Nenhum cliente cadastrado.</td></tr>
              ) : (
                clients.map((client) => (
                    <tr key={client.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{client.id}</td>
                    <td className="px-6 py-4">{client.name}</td>
                    <td className="px-6 py-4">{client.cpf}</td>
                    <td className="px-6 py-4">{client.phone}</td>
                    <td className="px-6 py-4">{client.email}</td>
                    <td className="px-6 py-4 flex justify-center space-x-2">
                        <button 
                            className="p-1.5 bg-brand-blue text-white rounded hover:bg-blue-600 transition-colors" 
                            title="Editar"
                            onClick={() => handleEdit(client)}
                        >
                        <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                            className="p-1.5 bg-brand-red text-white rounded hover:bg-red-600 transition-colors" 
                            title="Excluir"
                            onClick={() => client.id && handleDelete(client.id)}
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
    </div>
  );
};

export default Clients;