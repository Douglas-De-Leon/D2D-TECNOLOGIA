import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Search, Eye } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getAll, addItem, deleteItem, updateItem } from '../services/db';
import { Order } from '../types';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  const loadData = async () => {
    const data = await getAll<Order>('orders');
    setOrders(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async () => {
    const newOrder: Order = {
        client: 'Cliente Exemplo',
        responsible: 'Técnico',
        dateInit: new Date().toLocaleDateString('pt-BR'),
        status: 'Aberto',
        statusColor: 'bg-green-500',
        total: 'R$ 0,00'
    };
    await addItem('orders', newOrder);
    loadData();
  };

  const handleEdit = async (order: Order) => {
    const newStatus = prompt('Editar Status (Aberto, Em Andamento, Finalizado, Cancelado):', order.status);
    if (newStatus && newStatus !== order.status) {
        let color = 'bg-gray-500';
        if (newStatus === 'Aberto') color = 'bg-green-500';
        if (newStatus === 'Em Andamento') color = 'bg-blue-500';
        if (newStatus === 'Cancelado') color = 'bg-red-500';
        if (newStatus === 'Finalizado') color = 'bg-gray-500';
        
        const updatedOrder = { ...order, status: newStatus, statusColor: color };
        await updateItem('orders', updatedOrder);
        loadData();
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Excluir esta ordem de serviço?')) {
        await deleteItem('orders', id);
        loadData();
    }
  };

  return (
    <div>
      <PageHeader title="Ordens de Serviço" buttonLabel="Adicionar OS" onButtonClick={handleAdd} />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-2">
             <button className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200">Todas</button>
             <button className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200">Abertas</button>
             <button className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Em Andamento</button>
          </div>
          <div className="relative w-full sm:w-auto">
             <input type="text" placeholder="Pesquisar cliente ou OS..." className="pl-8 pr-4 py-2 border rounded-md text-sm outline-none w-full sm:w-64 focus:ring-1 focus:ring-brand-blue" />
             <Search className="h-4 w-4 text-gray-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">Nº OS</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Responsável</th>
                <th className="px-6 py-3 font-medium">Data Inicial</th>
                <th className="px-6 py-3 font-medium">Valor Total</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((os) => (
                <tr key={os.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-800">{os.id}</td>
                  <td className="px-6 py-4">{os.client}</td>
                  <td className="px-6 py-4">{os.responsible}</td>
                  <td className="px-6 py-4">{os.dateInit}</td>
                  <td className="px-6 py-4">{os.total}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${os.statusColor}`}>
                      {os.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-center space-x-1">
                    <button className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200" title="Visualizar"><Eye className="h-4 w-4" /></button>
                    <button 
                        className="p-1.5 bg-brand-blue text-white rounded hover:bg-blue-600" 
                        title="Editar"
                        onClick={() => handleEdit(os)}
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                        className="p-1.5 bg-brand-red text-white rounded hover:bg-red-600" 
                        title="Excluir"
                        onClick={() => os.id && handleDelete(os.id)}
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

export default Orders;