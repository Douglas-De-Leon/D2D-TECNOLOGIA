import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getAll, addItem, deleteItem, updateItem } from '../services/db';
import { Service } from '../types';

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);

  const loadData = async () => {
    const data = await getAll<Service>('services');
    setServices(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async () => {
    const newService: Service = {
        name: 'Novo Serviço',
        description: 'Descrição do serviço...',
        price: 'R$ 100,00'
    };
    await addItem('services', newService);
    loadData();
  };

  const handleEdit = async (service: Service) => {
    const newName = prompt('Editar Nome do Serviço:', service.name);
    if (newName && newName !== service.name) {
        const updatedService = { ...service, name: newName };
        await updateItem('services', updatedService);
        loadData();
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Excluir este serviço?')) {
        await deleteItem('services', id);
        loadData();
    }
  };

  return (
    <div>
      <PageHeader title="Serviços" buttonLabel="Adicionar Serviço" onButtonClick={handleAdd} />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-end">
           <div className="relative">
             <input type="text" placeholder="Pesquisar..." className="pl-8 pr-4 py-2 border rounded-md text-sm outline-none w-64 focus:ring-1 focus:ring-brand-blue" />
             <Search className="h-4 w-4 text-gray-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">Descrição</th>
                <th className="px-6 py-3 font-medium">Preço</th>
                <th className="px-6 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{service.id}</td>
                  <td className="px-6 py-4 font-medium">{service.name}</td>
                  <td className="px-6 py-4 text-gray-500">{service.description}</td>
                  <td className="px-6 py-4 font-medium text-gray-700">{service.price}</td>
                  <td className="px-6 py-4 flex justify-center space-x-2">
                    <button 
                        className="p-1.5 bg-brand-blue text-white rounded hover:bg-blue-600" 
                        title="Editar"
                        onClick={() => handleEdit(service)}
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                        className="p-1.5 bg-brand-red text-white rounded hover:bg-red-600" 
                        title="Excluir"
                        onClick={() => service.id && handleDelete(service.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Services;