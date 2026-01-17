
import React, { useEffect, useState, useMemo } from 'react';
import { Users, Package, Wrench, ClipboardList, TrendingUp, TrendingDown, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QuickAccessCard from '../components/QuickAccessCard';
import CalendarWidget from '../components/CalendarWidget';
import ClockWidget from '../components/ClockWidget';
import StatCard from '../components/StatCard';
import { getDashboardStats, getAll } from '../services/db';
import { Sale, Order } from '../types';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

if (typeof window !== 'undefined') {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [stats, setStats] = useState({
    clients: 0,
    products: 0,
    services: 0,
    orders: 0,
    revenue: 0,
    expenses: 0
  });

  const [salesData, setSalesData] = useState<Sale[]>([]);
  const [ordersData, setOrdersData] = useState<Order[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [dashboardStats, sales, orders] = await Promise.all([
          getDashboardStats(),
          getAll<Sale>('service_sales'),
          getAll<Order>('orders')
        ]);
        if (isMounted) {
          setStats(dashboardStats);
          setSalesData(sales || []);
          setOrdersData(orders || []);
        }
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const currencyToNumber = (currencyStr: string): number => {
    if (!currencyStr) return 0;
    const cleanStr = currencyStr.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  };

  const lineChartData = useMemo(() => {
    const labels: string[] = [];
    const totals: number[] = [];
    if (viewMode === 'dia') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('pt-BR').substring(0, 5));
        const dayTotal = (salesData || [])
          .filter(s => s.date === d.toLocaleDateString('pt-BR'))
          .reduce((acc, curr) => acc + currencyToNumber(curr.total), 0);
        totals.push(dayTotal);
      }
    } else {
      labels.push('Semana 4', 'Semana 3', 'Semana 2', 'Esta Semana');
      totals.push(1200, 2500, 1800, stats.revenue); 
    }
    return {
      labels,
      datasets: [{
        label: 'Vendas (R$)',
        data: totals,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
      }]
    };
  }, [viewMode, salesData, stats.revenue]);

  const doughnutChartData = useMemo(() => {
    const statusCounts: Record<string, number> = {
      'Aberto': 0,
      'Em Andamento': 0,
      'Finalizado': 0,
      'Cancelado': 0
    };
    (ordersData || []).forEach(o => {
      if (statusCounts[o.status] !== undefined) statusCounts[o.status]++;
    });
    return {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: ['#22c55e', '#3b82f6', '#94a3b8', '#f43f5e'],
        borderWidth: 0,
        hoverOffset: 10
      }]
    };
  }, [ordersData]);

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <QuickAccessCard label="Clientes" shortcut="F1" icon={Users} bgColorClass="bg-brand-blue" onClick={() => navigate('/usuarios')} />
        <QuickAccessCard label="Produtos" shortcut="F2" icon={Package} bgColorClass="bg-brand-yellow" onClick={() => navigate('/products')} />
        <QuickAccessCard label="Serviços" shortcut="F3" icon={Wrench} bgColorClass="bg-brand-cyan" onClick={() => navigate('/services')} />
        <QuickAccessCard label="Ordens" shortcut="F4" icon={ClipboardList} bgColorClass="bg-brand-red" onClick={() => navigate('/orders')} />
        <ClockWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 text-brand-blue mr-2" />
                <h2 className="text-lg font-bold text-gray-800">Lançamentos de Vendas</h2>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
                {(['dia', 'semana', 'mes'] as const).map((mode) => (
                  <button 
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={`flex-1 sm:flex-none px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${viewMode === mode ? 'bg-white shadow text-brand-blue' : 'text-gray-500'}`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-64 sm:h-80 w-full">
              <Line 
                data={lineChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                    x: { grid: { display: false } }
                  }
                }} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center text-center">
              <div className="bg-green-100 p-4 rounded-full mb-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(stats.revenue)}</div>
              <div className="text-sm text-gray-500 font-medium">Receita Total</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center text-center">
              <div className="bg-red-100 p-4 rounded-full mb-3">
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(stats.expenses)}</div>
              <div className="text-sm text-gray-500 font-medium">Despesa Total</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center">
            <div className="flex items-center w-full mb-6">
              <PieIcon className="h-5 w-5 text-brand-red mr-2" />
              <h2 className="text-lg font-bold text-gray-800">Status das OS</h2>
            </div>
            <div className="w-full max-w-[280px] h-64 relative flex items-center justify-center">
              <Doughnut 
                data={doughnutChartData}
                options={{
                  cutout: '75%',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 }, padding: 20 }
                    },
                    tooltip: { enabled: true }
                  }
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
                <span className="text-4xl font-bold text-gray-700">{stats.orders}</span>
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest">Total OS</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Estatísticas</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Clientes" count={stats.clients} addLabel="Clientes" icon={Users} colorClass="text-brand-blue" />
              <StatCard label="Produtos" count={stats.products} addLabel="Produtos" icon={Package} colorClass="text-brand-yellow" />
              <StatCard label="Serviços" count={stats.services} addLabel="Serviços" icon={Wrench} colorClass="text-brand-cyan" />
              <StatCard label="Ordens" count={stats.orders} addLabel="Ordens" icon={ClipboardList} colorClass="text-brand-red" />
            </div>
          </div>
          
          <CalendarWidget />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
