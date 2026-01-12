import React, { useEffect, useState } from 'react';
import { Users, Package, Wrench, ClipboardList, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QuickAccessCard from '../components/QuickAccessCard';
import CalendarWidget from '../components/CalendarWidget';
import ClockWidget from '../components/ClockWidget';
import StatCard from '../components/StatCard';
import { getDashboardStats } from '../services/db';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    clients: 0,
    products: 0,
    services: 0,
    orders: 0,
    revenue: 0,
    expenses: 0
  });

  useEffect(() => {
    getDashboardStats().then(setStats).catch(console.error);
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'F1':
          event.preventDefault();
          navigate('/clients');
          break;
        case 'F2':
          event.preventDefault();
          navigate('/products');
          break;
        case 'F3':
          event.preventDefault();
          navigate('/services');
          break;
        case 'F4':
          event.preventDefault();
          navigate('/orders');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  const formatCurrency = (val: number) => {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <QuickAccessCard 
          label="Clientes" 
          shortcut="F1" 
          icon={Users} 
          bgColorClass="bg-brand-blue" 
          onClick={() => navigate('/clients')}
        />
        <QuickAccessCard 
          label="Produtos" 
          shortcut="F2" 
          icon={Package} 
          bgColorClass="bg-brand-yellow" 
          onClick={() => navigate('/products')}
        />
        <QuickAccessCard 
          label="Serviços" 
          shortcut="F3" 
          icon={Wrench} 
          bgColorClass="bg-brand-cyan" 
          onClick={() => navigate('/services')}
        />
        <QuickAccessCard 
          label="Ordens" 
          shortcut="F4" 
          icon={ClipboardList} 
          bgColorClass="bg-brand-red" 
          onClick={() => navigate('/orders')}
        />
        
        {/* Clock Widget taking up the last spot */}
        <ClockWidget />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Calendar (Takes up 2 cols on lg) */}
        <div className="lg:col-span-2 h-full">
          <CalendarWidget />
        </div>

        {/* Right: System Stats */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Estatísticas do Sistema</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <StatCard 
               label="Clientes" 
               count={stats.clients} 
               addLabel="Add Clientes"
               icon={Users}
               colorClass="text-brand-blue"
            />
             <StatCard 
               label="Produtos" 
               count={stats.products} 
               addLabel="Add Produtos"
               icon={Package}
               colorClass="text-brand-yellow"
            />
             <StatCard 
               label="Serviços" 
               count={stats.services} 
               addLabel="Add Serviços"
               icon={Wrench}
               colorClass="text-brand-cyan"
            />
             <StatCard 
               label="Ordens" 
               count={stats.orders} 
               addLabel="Add Ordens"
               icon={ClipboardList}
               colorClass="text-brand-red"
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4">
             <div className="flex flex-col items-center">
                <div className="bg-green-100 p-2 rounded-full mb-1">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm font-bold text-gray-700">{formatCurrency(stats.revenue)}</span>
                <span className="text-xs text-gray-500">Receita do dia</span>
             </div>
             <div className="flex flex-col items-center">
                <div className="bg-red-100 p-2 rounded-full mb-1">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <span className="text-sm font-bold text-gray-700">{formatCurrency(stats.expenses)}</span>
                <span className="text-xs text-gray-500">Despesa do dia</span>
             </div>
          </div>
        </div>

      </div>
      
      {/* Footer Info (Mock) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 h-32 flex items-center justify-center text-gray-400 text-sm border-dashed border-2 border-gray-200">
            Balanço Mensal do Ano (Gráfico Placeholder)
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 h-32 flex items-center justify-center text-gray-400 text-sm border-dashed border-2 border-gray-200">
            Status OS (Gráfico Placeholder)
        </div>
      </div>

    </div>
  );
};

export default Dashboard;