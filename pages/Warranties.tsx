import React, { useEffect, useState } from 'react';
import { Save, ShieldCheck, FileText, CheckSquare } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getSettings, saveSettings } from '../services/db';
import { CompanySettings } from '../types';

const Warranties: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [warrantyText, setWarrantyText] = useState('');
  const [isChecked, setIsChecked] = useState(false); // Apenas para simulação visual
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await getSettings();
    if (data) {
      setSettings(data);
      // Texto padrão caso não exista
      setWarrantyText(data.warrantyText || 'A garantia dos serviços prestados é de 90 dias a contar da data de entrega do aparelho, cobrindo apenas o defeito reclamado e os componentes substituídos. A garantia não cobre danos causados por mau uso, quedas, contato com líquidos ou intervenção de terceiros não autorizados.');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    
    const updatedSettings = { ...settings, warrantyText };
    await saveSettings(updatedSettings);
    alert('Termo de garantia atualizado com sucesso!');
  };

  if (loading) {
      return <div className="p-6 text-gray-500">Carregando termos...</div>;
  }

  return (
    <div>
      <PageHeader title="Termos de Garantias" showButton={false} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Lado Esquerdo: Editor */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col h-full">
            <div className="flex items-center mb-4 border-b pb-2">
                <EditIcon className="h-5 w-5 text-gray-500 mr-2" />
                <h2 className="text-lg font-bold text-gray-800">Editor de Termos</h2>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
                Edite abaixo o texto que aparecerá nas suas Ordens de Serviço. 
                Este texto serve como base jurídica para a garantia dos serviços prestados.
            </p>

            <textarea
                className="flex-1 w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-blue focus:border-transparent text-sm leading-relaxed"
                rows={12}
                value={warrantyText}
                onChange={(e) => setWarrantyText(e.target.value)}
                placeholder="Digite aqui os termos de garantia..."
            />

            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleSave}
                    className="flex items-center bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors shadow-sm font-medium"
                >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Termos
                </button>
            </div>
        </div>

        {/* Lado Direito: Visualização do Modelo */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col h-full border-l-4 border-gray-200">
             <div className="flex items-center mb-4 border-b pb-2">
                <ShieldCheck className="h-5 w-5 text-brand-blue mr-2" />
                <h2 className="text-lg font-bold text-gray-800">Modelo de Visualização</h2>
            </div>
             <p className="text-sm text-gray-500 mb-4">
                Pré-visualização de como o cliente verá o termo e a caixa de aceite ao abrir uma nova Ordem de Serviço.
            </p>

            {/* Simulação do Documento */}
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md p-6 relative">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <FileText className="h-24 w-24 text-gray-900" />
                </div>
                
                <h3 className="text-center font-bold text-gray-800 mb-6 uppercase tracking-wider border-b border-gray-300 pb-2">
                    Termo de Garantia de Serviços
                </h3>
                
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed text-justify font-serif">
                    {warrantyText}
                </div>

                <div className="mt-8 p-4 bg-white border border-brand-blue rounded-lg shadow-sm">
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="terms-preview"
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => setIsChecked(!isChecked)}
                                className="focus:ring-brand-blue h-5 w-5 text-brand-blue border-gray-300 rounded cursor-pointer"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="terms-preview" className="font-medium text-gray-900 cursor-pointer select-none">
                                Li e concordo com os Termos de Garantia
                            </label>
                            <p className="text-gray-500 text-xs mt-1">
                                Declaro estar ciente das condições de garantia descritas acima para a realização desta Ordem de Serviço.
                            </p>
                        </div>
                    </div>
                </div>

                {isChecked && (
                    <div className="mt-4 text-center text-xs text-green-600 font-semibold animate-pulse">
                        <CheckSquare className="inline-block h-3 w-3 mr-1"/>
                        Aceite registrado (Simulação)
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

// Helper icon component
const EditIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);

export default Warranties;