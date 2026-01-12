import React from 'react';
import { LucideIcon, PlusCircle, List } from 'lucide-react';

interface StatCardProps {
  label: string;
  count: number;
  icon: LucideIcon;
  colorClass: string;
  addLabel: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, count, icon: Icon, colorClass, addLabel }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
      <Icon className={`h-10 w-10 mb-2 ${colorClass}`} />
      <div className="text-3xl font-bold text-gray-800 mb-1">{count}</div>
      <div className="text-sm text-gray-500 font-medium mb-3">{addLabel}</div>
      
      <div className="flex space-x-2 w-full justify-center">
         <button className="text-green-500 hover:text-green-600 transition-colors" title="Adicionar">
            <PlusCircle className="h-6 w-6" />
         </button>
         <button className="text-red-400 hover:text-red-500 transition-colors" title="Listar">
            <List className="h-6 w-6" />
         </button>
      </div>
    </div>
  );
};

export default StatCard;