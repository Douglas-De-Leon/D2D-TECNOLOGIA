import React from 'react';
import { Search, Bell, Menu, User } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-6 relative z-10">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 mr-2 text-gray-500 rounded-md lg:hidden hover:bg-gray-100 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        {/* Search Bar */}
        <div className="relative hidden md:block max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue sm:text-sm transition duration-150 ease-in-out"
            placeholder="Pesquise aqui..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none relative">
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          <Bell className="h-6 w-6" />
        </button>

        {/* User Profile */}
        <div className="flex items-center">
            <div className="flex flex-col items-end mr-3 hidden sm:flex">
                <span className="text-xs text-gray-400">Boa noite</span>
                <span className="text-sm font-medium text-gray-700">Edmilson</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-sm">
                <User className="h-6 w-6 text-gray-500" />
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;