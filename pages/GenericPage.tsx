import React from 'react';
import PageHeader from '../components/PageHeader';
import { Construction } from 'lucide-react';

interface GenericPageProps {
  title: string;
}

const GenericPage: React.FC<GenericPageProps> = ({ title }) => {
  return (
    <div>
      <PageHeader title={title} showButton={false} />
      
      <div className="bg-white rounded-lg shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
            <Construction className="h-16 w-16 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">Em Construção</h2>
        <p className="text-gray-500 max-w-md">
            O módulo de <strong>{title}</strong> está sendo desenvolvido e estará disponível em breve.
        </p>
      </div>
    </div>
  );
};

export default GenericPage;