import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Products from './pages/Products';
import Services from './pages/Services';
import Orders from './pages/Orders';
import Sales from './pages/Sales';
import Finance from './pages/Finance';
import Files from './pages/Files';
import Settings from './pages/Settings';
import Warranties from './pages/Warranties';
import GenericPage from './pages/GenericPage';
import Setup from './pages/Setup';
import { initDB } from './services/db';
import { SystemUser } from './types';

const App: React.FC = () => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<any>(null);
  const [user, setUser] = useState<SystemUser | null>(null);

  useEffect(() => {
    // Check local storage for session (basic persistence)
    const storedUser = localStorage.getItem('mapos_user');
    if (storedUser) {
        try {
            setUser(JSON.parse(storedUser));
        } catch (e) {
            localStorage.removeItem('mapos_user');
        }
    }

    initDB()
      .then((result) => {
        if (!result.success) {
            setDbError(result.error);
        }
        setIsDbReady(true);
      })
      .catch((err) => {
        console.error('Database initialization failed:', err);
        setDbError(err);
        setIsDbReady(true);
      });
  }, []);

  const handleLogin = (user: SystemUser) => {
      setUser(user);
      localStorage.setItem('mapos_user', JSON.stringify(user));
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('mapos_user');
  };

  if (!isDbReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-gray-500 font-medium">Carregando sistema...</span>
        </div>
      </div>
    );
  }

  // Se houver erro de conexão (ex: tabelas não existem), mostre a tela de Setup
  if (dbError) {
      return <Setup error={dbError} />;
  }

  // Se não estiver logado, mostra Login
  if (!user) {
      return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout onLogout={handleLogout} userName={user.name} />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="products" element={<Products />} />
          <Route path="services" element={<Services />} />
          <Route path="orders" element={<Orders />} />
          <Route path="sales" element={<Sales />} />
          <Route path="finance" element={<Finance />} />
          <Route path="files" element={<Files />} />
          <Route path="settings" element={<Settings />} />
          <Route path="warranties" element={<Warranties />} />
          
          {/* Generic/Placeholder Routes */}
          <Route path="reports" element={<GenericPage title="Relatórios" />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;