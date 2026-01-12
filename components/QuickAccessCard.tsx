import React from 'react';
import { LucideIcon } from 'lucide-react';

interface QuickAccessCardProps {
  label: string;
  shortcut: string;
  icon: LucideIcon;
  bgColorClass: string;
  onClick: () => void;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ 
  label, 
  shortcut, 
  icon: Icon, 
  bgColorClass,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className={`${bgColorClass} rounded-lg shadow-md p-4 cursor-pointer transform transition hover:scale-105 hover:shadow-lg flex items-center justify-between text-white relative overflow-hidden`}
    >
      <div className="z-10">
        <h3 className="text-lg font-bold mb-1">{label}</h3>
        <span className="inline-block bg-white bg-opacity-30 rounded px-2 py-0.5 text-sm font-semibold">
          {shortcut}
        </span>
      </div>
      <div className="z-10 p-2 bg-white bg-opacity-20 rounded-lg">
        <Icon className="h-8 w-8" />
      </div>
      
      {/* Decorative circle */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white bg-opacity-10 rounded-full pointer-events-none" />
    </div>
  );
};

export default QuickAccessCard;