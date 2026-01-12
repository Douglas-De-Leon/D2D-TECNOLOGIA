import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Products from './pages/Products';
import Services from './pages/Services';
import Orders from './pages/Orders';
import Sales from './pages/Sales';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import GenericPage from './pages/GenericPage';
import { initDB } from './services/db';

const App: React.FC = () => {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    initDB()
      .then(() => setIsDbReady(true))
      .catch((err) => {
        console.error('Database initialization failed:', err);
        // Ensure we still render even if DB fails, though it might be broken
        setIsDbReady(true);
      });
  }, []);

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

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="products" element={<Products />} />
          <Route path="services" element={<Services />} />
          <Route path="orders" element={<Orders />} />
          <Route path="sales" element={<Sales />} />
          <Route path="finance" element={<Finance />} />
          <Route path="settings" element={<Settings />} />
          
          {/* Generic/Placeholder Routes */}
          <Route path="warranties" element={<GenericPage title="Termos de Garantias" />} />
          <Route path="files" element={<GenericPage title="Arquivos" />} />
          <Route path="reports" element={<GenericPage title="Relatórios" />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;