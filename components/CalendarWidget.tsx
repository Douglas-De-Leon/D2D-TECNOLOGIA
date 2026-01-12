import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarWidget: React.FC = () => {
  // Hardcoded for visual fidelity to the image (Feb 2022)
  const daysOfWeek = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
  
  // Feb 2022 starts on Tuesday (index 2)
  // 30, 31 are from Jan. 
  // 1-28 for Feb.
  const calendarDays = [
    { day: 30, current: false }, { day: 31, current: false }, 
    { day: 1, current: true }, { day: 2, current: true }, { day: 3, current: true }, { day: 4, current: true }, { day: 5, current: true },
    { day: 6, current: true }, { day: 7, current: true }, { day: 8, current: true }, { day: 9, current: true }, { day: 10, current: true }, { day: 11, current: true }, { day: 12, current: true },
    { day: 13, current: true }, { day: 14, current: true }, { day: 15, current: true }, { day: 16, current: true }, { day: 17, current: true }, { day: 18, current: true }, { day: 19, current: true },
    { day: 20, current: true }, { day: 21, current: true }, { day: 22, current: true }, { day: 23, current: true }, { day: 24, current: true }, { day: 25, current: true }, { day: 26, current: true },
    { day: 27, current: true }, { day: 28, current: true }, { day: 1, current: false }, { day: 2, current: false }, { day: 3, current: false }, { day: 4, current: false }, { day: 5, current: false }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Agenda</h2>
          <p className="text-sm text-gray-500">fevereiro de 2022</p>
        </div>
        <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300">Hoje</button>
            <div className="flex bg-gray-200 rounded">
                <button className="p-1 hover:bg-gray-300 rounded-l"><ChevronLeft className="h-4 w-4 text-gray-600"/></button>
                <button className="p-1 hover:bg-gray-300 rounded-r"><ChevronRight className="h-4 w-4 text-gray-600"/></button>
            </div>
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        {/* Header Days */}
        <div className="grid grid-cols-7 mb-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 grid-rows-5 h-full gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {calendarDays.map((item, index) => (
            <div 
              key={index} 
              className={`
                bg-white p-2 min-h-[3rem] relative transition-colors hover:bg-gray-50
                ${!item.current ? 'text-gray-300 bg-gray-50' : 'text-gray-700 font-medium'}
              `}
            >
              <span className="text-sm">{item.day}</span>
              {/* Mock Event Dot */}
              {item.day === 4 && item.current && (
                 <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-brand-blue"></div>
              )}
               {item.day === 17 && item.current && (
                 <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-brand-red"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;