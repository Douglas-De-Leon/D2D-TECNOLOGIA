import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  ShoppingCart, 
  ClipboardList, 
  ShieldCheck, 
  FileText, 
  DollarSign, 
  LogOut,
  Settings,
  PieChart,
  User
} from 'lucide-react';
import { MenuItem, SystemUser } from '../types';

interface SidebarProps {
    onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const location = useLocation();
  const userStr = localStorage.getItem('mapos_user');
  const user: SystemUser | null = userStr ? JSON.parse(userStr) : null;
  const level = user?.level || 'user';

  // Definição completa do menu
  const allMenuItems: MenuItem[] = [
    { id: 'home', label: 'Início', icon: Home, path: '/' },
    { id: 'clients', label: 'Clientes / Fornecedor', icon: Users, path: '/clients' },
    // Produtos e Serviços removidos conforme solicitado
    { id: 'sales', label: 'Vendas', icon: ShoppingCart, path: '/sales' },
    { id: 'orders', label: 'Ordens de Serviço', icon: ClipboardList, path: '/orders' },
    { id: 'warranties', label: 'Termos de Garantias', icon: ShieldCheck, path: '/warranties' },
    { id: 'files', label: 'Arquivos', icon: FileText, path: '/files' },
    { id: 'finance', label: 'Lançamentos', icon: DollarSign, path: '/finance' },
    { id: 'reports', label: 'Relatórios', icon: PieChart, path: '/reports' },
    { id: 'settings', label: 'Configurações', icon: Settings, path: '/settings' },
  ];

  // Filtro de permissões
  const menuItems = allMenuItems.filter(item => {
      if (level === 'admin') return true;

      if (level === 'technician') {
          // Funcionário vê tudo exceto Configurações e Garantias (por exemplo)
          return !['settings', 'warranties', 'finance'].includes(item.id); 
      }

      if (level === 'client') {
          // Cliente vê suas ordens, vendas, arquivos
          return ['sales', 'orders', 'files'].includes(item.id);
      }

      return true;
  });

  return (
    <div className="flex flex-col h-full bg-sidebar text-gray-300 shadow-xl">
      <div className="flex items-center justify-center h-20 border-b border-gray-700 bg-sidebar">
        <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-brand-yellow rounded-md flex items-center justify-center transform rotate-45">
                <div className="w-4 h-4 border-2 border-sidebar rounded-full"></div>
            </div>
            <span className="text-2xl font-bold text-white tracking-wider">MAP-OS</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`
                  group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors duration-150
                  ${isActive 
                    ? 'bg-gray-900 text-white shadow-md border-l-4 border-brand-yellow' 
                    : 'hover:bg-sidebarHover hover:text-white'
                  }
                `}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-brand-yellow' : 'text-gray-400 group-hover:text-gray-300'}`} />
                {item.label}
              </Link>
            );
          })}
          
           {/* Link para Perfil sempre visível */}
            <Link
                to="/profile"
                className={`
                  group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors duration-150 mt-4
                  ${location.pathname === '/profile'
                    ? 'bg-gray-900 text-white shadow-md border-l-4 border-brand-blue' 
                    : 'hover:bg-sidebarHover hover:text-white'
                  }
                `}
              >
                <User className={`mr-3 h-5 w-5 ${location.pathname === '/profile' ? 'text-brand-blue' : 'text-gray-400 group-hover:text-gray-300'}`} />
                Meu Perfil
            </Link>

        </nav>
      </div>

      <div className="p-4 border-t border-gray-700">
        <button 
            onClick={onLogout}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-gray-400 rounded-md hover:bg-sidebarHover hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 text-red-400" />
          Sair
        </button>
      </div>
    </div>
  );
};

export default Sidebar;