import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getSettings, saveSettings } from '../services/db';
import { CompanySettings } from '../types';

const Settings: React.FC = () => {
  const [formData, setFormData] = useState<CompanySettings>({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    theme: 'Padrão'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then((settings) => {
        if (settings) {
            setFormData(settings);
        }
        setLoading(false);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    await saveSettings(formData);
    alert('Configurações salvas com sucesso!');
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <PageHeader title="Configurações do Sistema" showButton={false} />

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Dados da Empresa</h3>
        
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
            <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>
          
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
            <input 
                type="text" 
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input 
                type="text" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

           <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
            <select 
                name="theme"
                value={formData.theme}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue"
            >
                <option>Padrão</option>
                <option>Escuro</option>
                <option>Claro</option>
            </select>
          </div>

          <div className="col-span-1 md:col-span-2 pt-4">
            <button 
                type="button" 
                onClick={handleSave}
                className="flex items-center bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors font-medium"
            >
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;