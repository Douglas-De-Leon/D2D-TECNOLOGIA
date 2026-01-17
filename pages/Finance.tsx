import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { getAll, addItem, deleteItem, updateItem } from '../services/db';
import { Transaction } from '../types';

const Finance: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Transaction> & { rawValue: number }>({
      description: '',
      type: 'receita',
      status: 'Pendente',
      date: '',
      rawValue: 0
  });

  // Estados para Modal de Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const loadData = async () => {
    const data = await getAll<Transaction>('transactions');
    // Ensure numericValue is treated as number
    const processedData = data.map(d => ({
        ...d,
        numericValue: Number(d.numericValue)
    })).sort((a, b) => (b.id || 0) - (a.id || 0));

    setTransactions(processedData);
    calculateSummary(processedData);
  };

  const calculateSummary = (data: Transaction[]) => {
      let income = 0;
      let expense = 0;
      data.forEach(t => {
          if(t.type === 'receita') income += (t.numericValue || 0);
          if(t.type === 'despesa') expense += (t.numericValue || 0);
      });
      setSummary({ income, expense, balance: income - expense });
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (trans?: Transaction) => {
    if (trans) {
        setFormData({
            ...trans,
            rawValue: trans.numericValue
        });
        setIsEditing(true);
    } else {
        setFormData({
            description: '',
            type: 'receita',
            status: 'Pendente',
            date: new Date().toLocaleDateString('pt-BR'),
            rawValue: 0
        });
        setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format value for display
    const formattedValue = formData.rawValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const transactionToSave: Transaction = {
        id: formData.id,
        description: formData.description || '',
        type: formData.type as 'receita' | 'despesa',
        status: formData.status || 'Pendente',
        date: formData.date || '',
        numericValue: formData.rawValue,
        value: formattedValue
    };

    try {
        if (isEditing && formData.id) {
            await updateItem('transactions', transactionToSave);
        } else {
            await addItem('transactions', transactionToSave);
        }
        setIsModalOpen(false);
        loadData();
    } catch (error) {
        console.error(error);
        alert('Erro ao salvar lançamento');
    }
  };

  // --- Lógica de Exclusão ---
  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (transactionToDelete && transactionToDelete.id) {
        try {
            const success = await deleteItem('transactions', transactionToDelete.id);
            if (success) {
                // Atualização otimista da lista
                setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id));
                setIsDeleteModalOpen(false);
                setTransactionToDelete(null);
                // Recarrega para atualizar o resumo (summary)
                loadData();
            } else {
                alert("Erro ao excluir lançamento.");
            }
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Ocorreu um erro ao tentar excluir.");
        }
    }
  };

  const formatCurrency = (val: number) => {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div>
      <PageHeader title="Lançamentos Financeiros" buttonLabel="Novo Lançamento" onButtonClick={() => openModal()} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500 flex items-center justify-between">
              <div>
                  <p className="text-sm text-gray-500 uppercase font-semibold">Receitas (Total)</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.income)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500 flex items-center justify-between">
              <div>
                  <p className="text-sm text-gray-500 uppercase font-semibold">Despesas (Total)</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.expense)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                  <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex items-center justify-between">
              <div>
                  <p className="text-sm text-gray-500 uppercase font-semibold">Saldo Total</p>
                  <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(summary.balance)}
                  </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
          </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-700">Lançamentos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Descrição</th>
                <th className="px-6 py-3 font-medium">Vencimento</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Valor</th>
                <th className="px-6 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => (
                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{item.id}</td>
                  <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${item.type === 'receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.type === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{item.description}</td>
                  <td className="px-6 py-4">{item.date}</td>
                  <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {item.status}
                      </span>
                  </td>
                  <td className={`px-6 py-4 font-bold ${item.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.type === 'despesa' ? '-' : ''}{formatCurrency(Number(item.numericValue))}
                  </td>
                  <td className="px-6 py-4 flex justify-center space-x-2">
                    <button 
                        className="p-1.5 bg-brand-blue text-white rounded hover:bg-blue-600 transition-colors" 
                        title="Editar"
                        onClick={() => openModal(item)}
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                        className="p-1.5 bg-brand-red text-white rounded hover:bg-red-600 transition-colors" 
                        title="Excluir"
                        onClick={() => handleDeleteClick(item)}
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

       <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Lançamento" : "Novo Lançamento"}
      >
        <form onSubmit={handleSave} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <input type="text" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                        <option value="receita">Receita</option>
                        <option value="despesa">Despesa</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                    <input type="number" required step="0.01" value={formData.rawValue} onChange={e => setFormData({...formData, rawValue: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Data Vencimento</label>
                    <input type="text" placeholder="DD/MM/AAAA" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                        <option value="Pendente">Pendente</option>
                        <option value="Pago">Pago</option>
                    </select>
                </div>
            </div>

             <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="mr-2 px-4 py-2 text-sm text-gray-700 bg-white border rounded-md hover:bg-gray-50">Cancelar</button>
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
                <h4 className="text-lg font-medium text-gray-900">Excluir Lançamento?</h4>
                <p className="text-sm text-gray-500 mt-2">
                    Você tem certeza que deseja excluir o lançamento <strong>{transactionToDelete?.description}</strong>? 
                    <br/>Esta ação não poderá ser desfeita e afetará o saldo total.
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

export default Finance;