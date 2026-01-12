import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Search, ShoppingCart, Eye } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getAll, addItem, deleteItem, updateItem } from '../services/db';
import { Sale } from '../types';

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);

  const loadData = async () => {
    const data = await getAll<Sale>('sales');
    setSales(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async () => {
    // Simulating adding a new sale with random data
    const randomValue = Math.floor(Math.random() * 1000) + 50;
    const newSale: Sale = {
        client: 'Cliente Balcão',
        date: new Date().toLocaleDateString('pt-BR'),
        total: randomValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        status: 'Aberto',
        details: 'Venda Rápida (Exemplo)'
    };
    await addItem('sales', newSale);
    loadData();
  };

  const handleEdit = async (sale: Sale) => {
    const newStatus = prompt('Editar Status (Faturado, Aberto, Cancelado):', sale.status);
    if (newStatus && (newStatus === 'Faturado' || newStatus === 'Aberto' || newStatus === 'Cancelado')) {
        const updatedSale = { ...sale, status: newStatus as any };
        await updateItem('sales', updatedSale);
        loadData();
    } else if (newStatus) {
        alert('Status inválido. Use: Faturado, Aberto ou Cancelado.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta venda?')) {
        await deleteItem('sales', id);
        loadData();
    }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Faturado': return 'bg-green-500';
          case 'Cancelado': return 'bg-red-500';
          default: return 'bg-yellow-500';
      }
  };

  return (
    <div>
      <PageHeader title="Vendas" buttonLabel="Adicionar Venda" onButtonClick={handleAdd} />

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
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Detalhes</th>
                <th className="px-6 py-3 font-medium">Faturado</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                 <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">Nenhuma venda registrada.</td></tr>
              ) : (
                sales.map((sale) => (
                    <tr key={sale.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{sale.id}</td>
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                            <ShoppingCart className="h-4 w-4 mr-2 text-gray-400" />
                            {sale.client}
                        </div>
                    </td>
                    <td className="px-6 py-4">{sale.date}</td>
                    <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{sale.details}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(sale.status)}`}>
                            {sale.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">{sale.total}</td>
                    <td className="px-6 py-4 flex justify-center space-x-2">
                         <button className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200" title="Ver Detalhes"><Eye className="h-4 w-4" /></button>
                        <button 
                            className="p-1.5 bg-brand-blue text-white rounded hover:bg-blue-600 transition-colors" 
                            title="Editar"
                            onClick={() => handleEdit(sale)}
                        >
                        <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                            className="p-1.5 bg-brand-red text-white rounded hover:bg-red-600 transition-colors" 
                            title="Excluir"
                            onClick={() => sale.id && handleDelete(sale.id)}
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

export default Sales;