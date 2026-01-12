import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getAll, addItem, deleteItem, updateItem } from '../services/db';
import { Transaction } from '../types';

const Finance: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

  const loadData = async () => {
    const data = await getAll<Transaction>('transactions');
    setTransactions(data);
    calculateSummary(data);
  };

  const calculateSummary = (data: Transaction[]) => {
      let income = 0;
      let expense = 0;
      data.forEach(t => {
          if(t.type === 'receita') income += t.numericValue;
          if(t.type === 'despesa') expense += t.numericValue;
      });
      setSummary({ income, expense, balance: income - expense });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async () => {
    const isIncome = Math.random() > 0.5;
    const val = Math.floor(Math.random() * 500) + 50;
    const newTrans: Transaction = {
        type: isIncome ? 'receita' : 'despesa',
        description: isIncome ? 'Nova Receita' : 'Nova Despesa',
        value: val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        numericValue: val,
        date: new Date().toLocaleDateString('pt-BR'),
        status: 'Pendente'
    };
    await addItem('transactions', newTrans);
    loadData();
  };

  const handleEdit = async (trans: Transaction) => {
    const newDesc = prompt('Editar Descrição:', trans.description);
    if (newDesc && newDesc !== trans.description) {
        const updatedTrans = { ...trans, description: newDesc };
        await updateItem('transactions', updatedTrans);
        loadData();
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Excluir este lançamento?')) {
        await deleteItem('transactions', id);
        loadData();
    }
  };

  const formatCurrency = (val: number) => {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div>
      <PageHeader title="Lançamentos Financeiros" buttonLabel="Novo Lançamento" onButtonClick={handleAdd} />

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
                      {item.type === 'despesa' ? '-' : ''}{item.value}
                  </td>
                  <td className="px-6 py-4 flex justify-center space-x-2">
                    <button 
                        className="p-1.5 bg-brand-blue text-white rounded hover:bg-blue-600" 
                        title="Editar"
                        onClick={() => handleEdit(item)}
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                        className="p-1.5 bg-brand-red text-white rounded hover:bg-red-600" 
                        title="Excluir"
                        onClick={() => item.id && handleDelete(item.id)}
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

export default Finance;