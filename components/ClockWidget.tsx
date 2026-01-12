import React, { useState, useEffect } from 'react';

const ClockWidget: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format parts separately to match visual style (big HH:MM, small seconds/text)
  const timeStr = formatTime(time);

  return (
    <div className="bg-brand-yellow rounded-lg shadow-md p-4 flex flex-col justify-center items-center text-gray-900 relative overflow-hidden h-full">
      <div className="z-10 text-center">
        <div className="text-5xl font-mono font-bold tracking-tighter">
            {timeStr}
        </div>
        <div className="flex justify-between items-end px-2 mt-1">
            <span className="text-xs font-semibold uppercase opacity-60">Horas</span>
            <span className="text-xs font-semibold uppercase opacity-60">Minutos</span>
        </div>
        <div className="absolute top-2 right-2 font-bold text-xs opacity-50">PM</div>
      </div>
      
      {/* Decorative */}
       <div className="absolute -top-6 -left-6 w-24 h-24 bg-white bg-opacity-20 rounded-full pointer-events-none" />
    </div>
  );
};

export default ClockWidget;