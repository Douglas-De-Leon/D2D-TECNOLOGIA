import React from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  showButton?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  buttonLabel = "Adicionar", 
  onButtonClick,
  showButton = true 
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <div className="text-sm text-gray-500 mt-1">
          <Link to="/" className="hover:text-brand-blue">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{title}</span>
        </div>
      </div>
      
      {showButton && (
        <button 
          onClick={onButtonClick}
          className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          {buttonLabel}
        </button>
      )}
    </div>
  );
};

export default PageHeader;