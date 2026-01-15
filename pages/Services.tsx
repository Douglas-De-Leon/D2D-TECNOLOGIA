import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Search, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { getAll, addItem, deleteItem, updateItem } from '../services/db';
import { Service, SystemUser } from '../types';

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  
  // Estados para Adicionar/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Service>({
    name: '',
    description: '',
    price: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Estados para Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  const loadData = async () => {
    const data = await getAll<Service>('services');
    setServices(data.sort((a, b) => (b.id || 0) - (a.id || 0)));
  };

  useEffect(() => {
    const stored = localStorage.getItem('mapos_user');
    if (stored) {
        setCurrentUser(JSON.parse(stored));
    }
    loadData();
  }, []);

  const isClient = currentUser?.level === 'client';

  const openModal = (service?: Service) => {
    if (service) {
      setFormData(service);
      setIsEditing(true);
    } else {
      setFormData({ name: '', description: '', price: 'R$ 0,00' });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && formData.id) {
        await updateItem('services', formData);
      } else {
        await addItem('services', formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar serviço");
    }
  };

  // Abre o modal de confirmação
  const handleDeleteClick = (service: Service) => {
    setServiceToDelete(service);
    setIsDeleteModalOpen(true);
  };

  // Executa a exclusão de fato
  const confirmDelete = async () => {
    if (serviceToDelete && serviceToDelete.id) {
        const success = await deleteItem('services', serviceToDelete.id);
        if (success) {
            loadData();
            setIsDeleteModalOpen(false);
            setServiceToDelete(null);
        } else {
            alert("Erro ao excluir serviço.");
        }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <PageHeader 
        title="Serviços" 
        buttonLabel="Adicionar Serviço" 
        onButtonClick={() => openModal()} 
        showButton={!isClient} // Clientes não veem o botão de adicionar
      />

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
                {!isClient && <th className="px-6 py-3 font-medium text-center">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                 <tr><td colSpan={isClient ? 4 : 5} className="px-6 py-4 text-center text-gray-500">Nenhum serviço encontrado.</td></tr>
              ) : (
                services.map((service) => (
                    <tr key={service.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{service.id}</td>
                    <td className="px-6 py-4 font-medium">{service.name}</td>
                    <td className="px-6 py-4 text-gray-500">{service.description}</td>
                    <td className="px-6 py-4 font-medium text-gray-700">{service.price}</td>
                    {!isClient && (
                        <td className="px-6 py-4 flex justify-center space-x-2">
                            <button 
                                className="p-1.5 bg-brand-blue text-white rounded hover:bg-blue-600" 
                                title="Editar"
                                onClick={() => openModal(service)}
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                                className="p-1.5 bg-brand-red text-white rounded hover:bg-red-600" 
                                title="Excluir"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(service);
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </td>
                    )}
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
        title={isEditing ? "Editar Serviço" : "Adicionar Serviço"}
      >
        <form onSubmit={handleSave} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Serviço</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Preço</label>
                <input type="text" name="price" value={formData.price} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2"></textarea>
            </div>
             <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="mr-2 px-4 py-2 text-sm text-gray-700 bg-white border rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-brand-blue rounded-md hover:bg-blue-600">Salvar</button>
            </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
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
                <h4 className="text-lg font-medium text-gray-900">Excluir Serviço?</h4>
                <p className="text-sm text-gray-500 mt-2">
                    Você tem certeza que deseja excluir o serviço <strong>{serviceToDelete?.name}</strong>? 
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

export default Services;