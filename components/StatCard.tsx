
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
    <div className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-100 rounded-xl hover:shadow-md transition-all">
      <Icon className={`h-8 w-8 mb-1 ${colorClass}`} />
      <div className="text-2xl font-black text-gray-800">{count}</div>
      <div className="text-[10px] text-gray-400 uppercase font-bold mb-3 tracking-tighter">{addLabel}</div>
      
      <div className="flex space-x-3 w-full justify-center">
         <button className="text-green-500 hover:scale-110 transition-transform" title="Adicionar">
            <PlusCircle className="h-5 w-5" />
         </button>
         <button className="text-red-400 hover:scale-110 transition-transform" title="Listar">
            <List className="h-5 w-5" />
         </button>
      </div>
    </div>
  );
};

export default StatCard;
